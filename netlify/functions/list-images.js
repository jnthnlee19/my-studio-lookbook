const fs = require('fs');
const path = require('path');

exports.handler = async () => {
  try {
    const dir = path.join(__dirname, '..', '..', 'images');
    const files = fs.readdirSync(dir).filter(name => name.toLowerCase().endsWith('.jpg'));
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(files)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not read images directory", details: error.message })
    };
  }
};