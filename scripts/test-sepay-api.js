const axios = require('axios');

async function testSePay() {
  const apiKey = 'spsk_test_WLNWs6B2VbNGypeuscMWNYg4HqFfMZBW';
  console.log('Testing with API Key:', apiKey);
  try {
    const response = await axios.get('https://my.sepay.vn/userapi/bankaccounts/list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('SePay Response Status:', response.status);
    console.log('SePay Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

testSePay();
