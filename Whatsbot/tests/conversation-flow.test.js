const test = require('node:test');
const assert = require('node:assert/strict');

const { detectIntent } = require('../src/flows/intent');
const { routeMessage } = require('../src/flows/router');

const step = async (conversation, text) => {
  const intent = await detectIntent(text);
  const result = routeMessage({ conversation, intent, text });

  return {
    result,
    nextConversation: {
      state: result.nextState,
      booking_draft: result.nextDraft || {},
    },
  };
};

test('booking flow reaches confirmation and upsell acceptance', async () => {
  let conversation = { state: 'idle', booking_draft: {} };

  let output = await step(conversation, 'BOOK');
  assert.equal(output.result.nextState, 'ask_service');
  assert.match(output.result.reply, /what service/i);
  conversation = output.nextConversation;

  output = await step(conversation, 'Teeth cleaning');
  assert.equal(output.result.nextState, 'ask_date');
  assert.match(output.result.reply, /what date/i);
  conversation = output.nextConversation;

  output = await step(conversation, 'Tomorrow');
  assert.equal(output.result.nextState, 'ask_time');
  assert.match(output.result.reply, /what time/i);
  conversation = output.nextConversation;

  output = await step(conversation, '10:30 AM');
  assert.equal(output.result.nextState, 'upsell_offer');
  assert.match(output.result.reply, /add-on/i);

  // In production this ID comes from DB right after booking insert.
  conversation = {
    state: output.result.nextState,
    booking_draft: { active_booking_id: 'booking-123' },
  };

  output = await step(conversation, 'YES');
  assert.equal(output.result.nextState, 'idle');
  assert.equal(output.result.upsellResponse, 'accepted');
  assert.match(output.result.reply, /all set/i);
});

