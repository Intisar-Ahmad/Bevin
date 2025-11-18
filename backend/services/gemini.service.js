import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateResult = async (prompt) => {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: `
You are an expert software developer. 
Always respond with one SINGLE valid JSON object.
Format:
{
  "text": "string",
  "fileTree": { "filename": { "file":{"contents": "string"} } } // must be exactly like this structure
}
Never include markdown fences (\`\`\`), comments, or explanations.
If no code is needed, set "fileTree": {}.
Never make folder or sub-folders in the fileTree. just simply name the file directory/fileName.ext
          `,
        },
      });

      let raw = (response.text || "").trim();
      // console.log(raw);

      // Try parsing
      const parsed = JSON.parse(raw);

      // Sanity check fields
      if (typeof parsed.text !== "string" || typeof parsed.fileTree !== "object") {
        throw new Error("Invalid shape");
      }

      //  Success — return clean JSON string
      console.log(parsed);
      return JSON.stringify(parsed);
    } catch (err) {
      console.warn(`Attempt ${attempt} failed:`, err.message);
      if (attempt === MAX_RETRIES) {
        console.log(err)
        // fallback — still valid JSON
        return JSON.stringify({
          text: "Error: AI response could not be parsed correctly."
        });
      }
    }
  }
};
