const fetch = require('node-fetch');

const SUPABASE_URL = 'https://zlzfuglgigbeypsljzyw.supabase.co'; // ← replace this
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsemZ1Z2xnaWdiZXlwc2xqenl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDc0NzQsImV4cCI6MjA2ODc4MzQ3NH0.2UFqQ1f6oUGKhHC_ieX3uyFRxkJC5FtUM7sWHPe6X-k'; // ← replace this

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { address, selections } = JSON.parse(event.body);

  if (!address || !Array.isArray(selections)) {
    return { statusCode: 400, body: 'Missing address or selections' };
  }

  try {
    const responses = await Promise.all(
      selections.map(sel =>
        fetch(`${SUPABASE_URL}/rest/v1/selections`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            address,
            option_number: sel.option,
            qty: sel.qty,
            comment: sel.comment
          })
        })
      )
    );

    if (responses.some(res => !res.ok)) {
      throw new Error('One or more selections failed to save.');
    }

    return { statusCode: 200, body: 'Selections saved' };
  } catch (err) {
    return { statusCode: 500, body: `Supabase error: ${err.message}` };
  }
};
