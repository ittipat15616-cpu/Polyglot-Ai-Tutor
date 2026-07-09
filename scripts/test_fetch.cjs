const fs = require('fs');
const path = require('path');

const MODEL_NAME = 'gemini-1.5-flash';
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
const API_KEY = apiKeyMatch ? apiKeyMatch[1].trim() : null;

async function test() {
  const prompt = "Say hello";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  if (!response.ok) {
    console.error("HTTP Status:", response.status);
    console.error("Response text:", await response.text());
  } else {
    console.log("Success:", await response.json());
  }
}
test();
