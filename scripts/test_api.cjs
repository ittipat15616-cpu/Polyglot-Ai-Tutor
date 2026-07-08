const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AQ.Ab8RN6KP9lzPglyr7dbjwdKKuo1lZy4PZunJrVfs1mF7sw8-VA');

async function test(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("hello");
    console.log(`${modelName} SUCCESS:`, result.response.text());
  } catch (e) {
    console.error(`${modelName} FAILED:`, e.message);
  }
}

async function run() {
  await test('gemini-2.5-flash');
}
run();
