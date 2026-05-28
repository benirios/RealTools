const { INTENTS } = require('./intent');
const { handleBookingFlow } = require('./bookingFlow');
const { handleUpsellFlow } = require('./upsellFlow');

const routeMessage = ({ conversation, intent, text }) => {
  const upsellResult = handleUpsellFlow({ conversation, text });
  if (upsellResult.handled) {
    return upsellResult;
  }

  const bookingResult = handleBookingFlow({ conversation, intent, text });
  if (bookingResult.handled) {
    return bookingResult;
  }

  if (intent === INTENTS.GREETING) {
    return {
      handled: true,
      reply: 'Hi! I can help with clinic booking simulations. Reply BOOK to start.',
      nextState: 'idle',
      nextDraft: {},
    };
  }

  if (intent === INTENTS.PRICING) {
    return {
      handled: true,
      reply: 'Our consultation starts at $50. Reply BOOK to reserve a simulated slot.',
      nextState: 'idle',
      nextDraft: {},
    };
  }

  if (intent === INTENTS.CANCEL) {
    return {
      handled: true,
      reply:
        'For this MVP, cancellation is manual. Reply BOOK if you want to create a new booking simulation.',
      nextState: 'idle',
      nextDraft: {},
    };
  }

  return {
    handled: true,
    reply: 'I did not catch that. Reply BOOK to schedule or PRICE to see pricing.',
    nextState: 'idle',
    nextDraft: {},
  };
};

module.exports = { routeMessage };

