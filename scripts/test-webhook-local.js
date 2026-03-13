const axios = require('axios');

async function testWebhook() {
  const paymentCode = 'MKT4WPLH8'; // The latest pending one
  const secret = 'spsk_live_oHFKksamC9FPG81JNusfEndhj24WBEcB';
  
  const payload = {
    id: 1234567,
    content: `Nap tiền ${paymentCode}`,
    transferAmount: 10000,
    transferType: 'IN',
    gateway: 'BIDV'
  };

  console.log('Testing with Bearer token...');
  try {
    const res = await axios.post('http://localhost:3000/api/payments/webhook', payload, {
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Response (Bearer):', res.status, res.data);
  } catch (err) {
    console.error('Error (Bearer):', err.response?.status, err.response?.data || err.message);
  }

  console.log('\nTesting with Apikey token...');
  try {
    const res = await axios.post('http://localhost:3000/api/payments/webhook', payload, {
      headers: {
        'Authorization': `Apikey ${secret}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Response (Apikey):', res.status, res.data);
  } catch (err) {
    console.error('Error (Apikey):', err.response?.status, err.response?.data || err.message);
  }
}

testWebhook();
