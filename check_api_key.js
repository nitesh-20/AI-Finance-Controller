const { GoogleGenAI } = require('@google/genai');
async function test() {
  try {
    const ai = new GoogleGenAI({apiKey: 'AIzaSyCg5JvKu2EkZbJ4dyisv9g_rupwIFg-F2M'});
    console.log("Checking API key...");
    const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Hi'
    });
    console.log("Response:", res.text);
  } catch(e) {
    console.error("API KEY ERROR?", e.message);
  }
}
test();
