

const SUPABASE_URL = 'https://zlzfuglgigbeypsljzyw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsemZ1Z2xnaWdiZXlwc2xqenl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDc0NzQsImV4cCI6MjA2ODc4MzQ3NH0.2UFqQ1f6oUGKhHC_ieX3uyFRxkJC5FtUM7sWHPe6X-k';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { address, selections } = JSON.parse(event.body);

  if (!address || !Array.isArray(selections)) {
    return { statusCode: 400, body: 'Missing address or selections' };
  }

  console.log("📬 Incoming Save Request for:", address);
  console.log("📦 Selections:", JSON.stringify(selections, null, 2));

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

    const failures = await Promise.all(responses.map(async (r, i) => {
      if (!r.ok) {
        const body = await r.text();
        return {
          index: i,
          option: selections[i],
          status: r.status,
          error: body
        };
      }
      return null;
    }));

    const failedItems = failures.filter(f => f !== null);

    if (failedItems.length > 0) {
      console.error("❌ Failed to save some selections:", failedItems);
      return {
        statusCode: 500,
        body: `Supabase error: ${failedItems.length} failed. Check function logs for details.`
      };
    }

    return {
      statusCode: 200,
      body: 'Selections saved'
    };

  } catch (err) {
    console.error("💥 Unexpected error:", err);
    return {
      statusCode: 500,
      body: `Supabase error: ${err.message}`
    };
  }
};
