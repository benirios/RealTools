const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const calls = [];
const messageHandlerPath = require.resolve('../src/services/messageHandler');

require.cache[messageHandlerPath] = {
  id: messageHandlerPath,
  filename: messageHandlerPath,
  loaded: true,
  exports: {
    processIncomingMessage: async (event) => {
      calls.push(event);
    },
  },
};

const { app } = require('../src/app');

test.beforeEach(() => {
  calls.length = 0;
});

test('GET /webhook returns challenge when token is valid', async () => {
  const response = await request(app).get('/webhook').query({
    'hub.mode': 'subscribe',
    'hub.verify_token': process.env.META_VERIFY_TOKEN,
    'hub.challenge': 'challenge-123',
  });

  assert.equal(response.status, 200);
  assert.equal(response.text, 'challenge-123');
});

test('GET /webhook rejects invalid verification token', async () => {
  const response = await request(app).get('/webhook').query({
    'hub.mode': 'subscribe',
    'hub.verify_token': 'wrong-token',
    'hub.challenge': 'challenge-123',
  });

  assert.equal(response.status, 403);
});

test('POST /webhook forwards only text messages to processor', async () => {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            field: 'messages',
            value: {
              contacts: [{ profile: { name: 'Ana' } }],
              messages: [
                {
                  id: 'wamid-1',
                  from: '5511999999999',
                  type: 'text',
                  text: { body: 'BOOK' },
                },
                {
                  id: 'wamid-2',
                  from: '5511999999999',
                  type: 'image',
                  image: { id: 'media-1' },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const response = await request(app).post('/webhook').send(payload);

  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    waId: '5511999999999',
    profileName: 'Ana',
    text: 'BOOK',
    messageId: 'wamid-1',
  });
});

test('POST /webhook/twilio forwards Twilio WhatsApp form payload to processor', async () => {
  const response = await request(app).post('/webhook/twilio').type('form').send({
    From: 'whatsapp:+5511988887777',
    ProfileName: 'Bruno',
    Body: 'BOOK',
    MessageSid: 'SM123',
  });

  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    waId: '+5511988887777',
    profileName: 'Bruno',
    text: 'BOOK',
    messageId: 'SM123',
  });
});
