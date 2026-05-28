import fetch from 'node-fetch';

const URL = process.env.WEBHOOK_URL || 'http://localhost:3000/webhooks/ttn';
const devices = ['room_101_sensor','room_102_sensor','room_103_sensor'];

function randomTemp() { return 18 + Math.random() * 8; }

async function post(deviceId: string) {
  const payload = { device_id: deviceId, temperature: parseFloat(randomTemp().toFixed(2)), timestamp: new Date().toISOString() };
  try {
    const res = await fetch(URL, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
    console.log('posted', payload, 'status', res.status);
  } catch (err) { console.error('post error', err); }
}

async function run() {
  while (true) {
    for (const d of devices) await post(d);
    await new Promise(r => setTimeout(r, 5000));
  }
}

run().catch(console.error);
