const { INTENTS } = require('./intent');

const BOOKING_STATES = Object.freeze({
  IDLE: 'idle',
  ASK_SERVICE: 'ask_service',
  ASK_DATE: 'ask_date',
  ASK_TIME: 'ask_time',
  UPSELL_OFFER: 'upsell_offer',
});

const sanitize = (value) => String(value || '').trim();

const handleBookingFlow = ({ conversation, intent, text }) => {
  const state = conversation?.state || BOOKING_STATES.IDLE;
  const draft = conversation?.booking_draft || {};
  const value = sanitize(text);

  if (state === BOOKING_STATES.IDLE) {
    if (intent !== INTENTS.BOOKING) {
      return { handled: false };
    }

    return {
      handled: true,
      reply: 'Great—what service do you need? (e.g., Cleaning, Whitening)',
      nextState: BOOKING_STATES.ASK_SERVICE,
      nextDraft: {},
    };
  }

  if (state === BOOKING_STATES.ASK_SERVICE) {
    if (!value) {
      return {
        handled: true,
        reply: 'Please share the service name to continue your booking.',
        nextState: BOOKING_STATES.ASK_SERVICE,
        nextDraft: draft,
      };
    }

    return {
      handled: true,
      reply: 'Nice. What date works best for you?',
      nextState: BOOKING_STATES.ASK_DATE,
      nextDraft: { service: value },
    };
  }

  if (state === BOOKING_STATES.ASK_DATE) {
    if (!value) {
      return {
        handled: true,
        reply: 'Please share your preferred date to continue.',
        nextState: BOOKING_STATES.ASK_DATE,
        nextDraft: draft,
      };
    }

    return {
      handled: true,
      reply: 'Great. What time do you prefer?',
      nextState: BOOKING_STATES.ASK_TIME,
      nextDraft: { ...draft, preferred_date: value },
    };
  }

  if (state === BOOKING_STATES.ASK_TIME) {
    if (!value) {
      return {
        handled: true,
        reply: 'Please share your preferred time to finish booking.',
        nextState: BOOKING_STATES.ASK_TIME,
        nextDraft: draft,
      };
    }

    const service = draft.service || 'General consultation';
    const preferredDate = draft.preferred_date || 'TBD';
    const preferredTime = value;

    return {
      handled: true,
      reply: `Confirmed: ${service} on ${preferredDate} at ${preferredTime}. Would you like to add a whitening add-on for $20? Reply YES or NO.`,
      nextState: BOOKING_STATES.UPSELL_OFFER,
      nextDraft: {},
      bookingToCreate: {
        service,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
      },
    };
  }

  return { handled: false };
};

module.exports = { BOOKING_STATES, handleBookingFlow };

