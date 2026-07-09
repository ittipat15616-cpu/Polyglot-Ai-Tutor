const API_KEY = "AQ.Ab8RN6KPjREnbFCHAS0hPaGGSJkjmJre2VsyiXbAHzW4kKa47w";

async function testKey() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hello" }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    console.log("Status:", response.status);
    const data = await response.text();
    console.log("Response:", data);
  } catch (e) {
    console.error("Error:", e);
  }
}

testKey();
