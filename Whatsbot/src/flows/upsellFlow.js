const { BOOKING_STATES } = require('./bookingFlow');

const normalize = (value) => String(value || '').toLowerCase().trim();

const POSITIVE_WORDS = ['yes', 'y', 'ok', 'sure', 'add', 'accept'];
const NEGATIVE_WORDS = ['no', 'n', 'nope', 'not now', 'later'];

const isPositive = (text) => POSITIVE_WORDS.some((word) => text.includes(word));
const isNegative = (text) => NEGATIVE_WORDS.some((word) => text.includes(word));

const handleUpsellFlow = ({ conversation, text }) => {
  if ((conversation?.state || BOOKING_STATES.IDLE) !== BOOKING_STATES.UPSELL_OFFER) {
    return { handled: false };
  }

  const normalized = normalize(text);
  const bookingId = conversation?.booking_draft?.active_booking_id || null;

  if (isPositive(normalized)) {
    return {
      handled: true,
      reply: 'Awesome, the add-on is included in your booking simulation. You are all set!',
      nextState: BOOKING_STATES.IDLE,
      nextDraft: {},
      upsellResponse: 'accepted',
      bookingId,
    };
  }

  if (isNegative(normalized)) {
    return {
      handled: true,
      reply: 'No problem. Your booking is still confirmed. Reply BOOK anytime for another appointment.',
      nextState: BOOKING_STATES.IDLE,
      nextDraft: {},
      upsellResponse: 'rejected',
      bookingId,
    };
  }

  return {
    handled: true,
    reply: 'Please reply YES or NO for the add-on offer.',
    nextState: BOOKING_STATES.UPSELL_OFFER,
    nextDraft: conversation?.booking_draft || {},
    upsellResponse: null,
    bookingId,
  };
};

module.exports = { handleUpsellFlow };

