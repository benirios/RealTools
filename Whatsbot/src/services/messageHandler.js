const { supabase } = require('../lib/supabase');
const { detectIntent } = require('../flows/intent');
const { routeMessage } = require('../flows/router');
const { BOOKING_STATES } = require('../flows/bookingFlow');
const { sendWhatsAppText } = require('../lib/whatsapp');

const nowIso = () => new Date().toISOString();

const upsertContact = async ({ waId, profileName }) => {
  const payload = {
    wa_id: waId,
    updated_at: nowIso(),
  };

  if (profileName) {
    payload.name = profileName;
  }

  const { error: upsertError } = await supabase
    .from('contacts')
    .upsert(payload, { onConflict: 'wa_id' });

  if (upsertError) {
    throw new Error(`Contact upsert failed: ${upsertError.message}`);
  }

  const { data: contact, error: selectError } = await supabase
    .from('contacts')
    .select('id')
    .eq('wa_id', waId)
    .single();

  if (selectError || !contact) {
    throw new Error(`Contact read failed: ${selectError?.message || 'No contact found'}`);
  }

  return contact;
};

const hasInboundMessage = async (waMessageId) => {
  if (!waMessageId) {
    return false;
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id')
    .eq('wa_message_id', waMessageId)
    .limit(1);

  if (error) {
    throw new Error(`Message dedupe check failed: ${error.message}`);
  }

  return data.length > 0;
};

const ensureConversation = async (contactId) => {
  const { error: upsertError } = await supabase.from('conversations').upsert(
    {
      contact_id: contactId,
      state: BOOKING_STATES.IDLE,
      booking_draft: {},
      updated_at: nowIso(),
    },
    { onConflict: 'contact_id' },
  );

  if (upsertError) {
    throw new Error(`Conversation upsert failed: ${upsertError.message}`);
  }

  const { data: conversation, error: selectError } = await supabase
    .from('conversations')
    .select('state, booking_draft, last_intent')
    .eq('contact_id', contactId)
    .single();

  if (selectError || !conversation) {
    throw new Error(`Conversation read failed: ${selectError?.message || 'No conversation found'}`);
  }

  return conversation;
};

const logMessage = async ({ waMessageId, contactId, direction, text, intent = null }) => {
  const { error } = await supabase.from('messages').insert({
    wa_message_id: waMessageId,
    contact_id: contactId,
    direction,
    text,
    intent,
  });

  if (error) {
    throw new Error(`Message log failed: ${error.message}`);
  }
};

const createBooking = async ({ contactId, service, preferredDate, preferredTime }) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      contact_id: contactId,
      service,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      status: 'simulated_confirmed',
      upsell_offered: true,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Booking create failed: ${error?.message || 'No booking created'}`);
  }

  return data;
};

const saveUpsellResponse = async ({ bookingId, response }) => {
  const { error } = await supabase
    .from('bookings')
    .update({ upsell_response: response })
    .eq('id', bookingId);

  if (error) {
    throw new Error(`Upsell update failed: ${error.message}`);
  }
};

const updateConversation = async ({ contactId, nextState, nextDraft, lastIntent }) => {
  const { error } = await supabase
    .from('conversations')
    .update({
      state: nextState,
      booking_draft: nextDraft,
      last_intent: lastIntent,
      updated_at: nowIso(),
    })
    .eq('contact_id', contactId);

  if (error) {
    throw new Error(`Conversation update failed: ${error.message}`);
  }
};

const processIncomingMessage = async ({ waId, profileName, text, messageId }) => {
  const safeText = String(text || '').trim();
  if (!waId || !safeText) {
    return;
  }

  const contact = await upsertContact({ waId, profileName });
  const duplicate = await hasInboundMessage(messageId);
  if (duplicate) {
    return;
  }

  const conversation = await ensureConversation(contact.id);
  const intent = await detectIntent(safeText);

  await logMessage({
    waMessageId: messageId,
    contactId: contact.id,
    direction: 'inbound',
    text: safeText,
    intent,
  });

  const routeResult = routeMessage({
    conversation,
    intent,
    text: safeText,
  });

  let nextDraft = routeResult.nextDraft || {};

  if (routeResult.bookingToCreate) {
    const booking = await createBooking({
      contactId: contact.id,
      service: routeResult.bookingToCreate.service,
      preferredDate: routeResult.bookingToCreate.preferred_date,
      preferredTime: routeResult.bookingToCreate.preferred_time,
    });

    nextDraft = {
      ...nextDraft,
      active_booking_id: booking.id,
    };
  }

  if (routeResult.upsellResponse) {
    if (!routeResult.bookingId) {
      throw new Error('Upsell response cannot be saved without bookingId');
    }

    await saveUpsellResponse({
      bookingId: routeResult.bookingId,
      response: routeResult.upsellResponse,
    });
  }

  await updateConversation({
    contactId: contact.id,
    nextState: routeResult.nextState,
    nextDraft,
    lastIntent: intent,
  });

  const outboundMessageId = await sendWhatsAppText({
    to: waId,
    text: routeResult.reply,
  });

  await logMessage({
    waMessageId: outboundMessageId,
    contactId: contact.id,
    direction: 'outbound',
    text: routeResult.reply,
    intent: null,
  });
};

module.exports = { processIncomingMessage };

