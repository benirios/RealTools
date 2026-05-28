const test = require('node:test');
const assert = require('node:assert/strict');

const { detectIntent, INTENTS } = require('../src/flows/intent');

test('detects booking intent from common keywords', async () => {
  const intent = await detectIntent('Can I book an appointment for tomorrow?');
  assert.equal(intent, INTENTS.BOOKING);
});

test('detects pricing intent', async () => {
  const intent = await detectIntent('What is the price for cleaning?');
  assert.equal(intent, INTENTS.PRICING);
});

test('detects greeting intent', async () => {
  const intent = await detectIntent('Hello there');
  assert.equal(intent, INTENTS.GREETING);
});

test('returns unknown when no keyword matches', async () => {
  const intent = await detectIntent('Need details on your doctors');
  assert.equal(intent, INTENTS.UNKNOWN);
});

