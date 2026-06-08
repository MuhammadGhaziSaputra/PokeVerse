import { GoogleGenAI, Type } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getTeamRecommendation(preference: string, mode: "build" | "counter" = "build") {
  try {
    const prompt = mode === "counter" 
      ? `Give me a counter Pokemon team of exactly 6 pokemon that can decisively defeat this opposing 6-pokemon team: "${preference}". 
      Respond in INDONESIAN language.
      Explain the role (in Indonesian) of each pokemon and exactly why it counters specific members or the general strategy of the opposing team. 
      Only include pokemon from Gen 1-9.`
      : `Recommend a Pokemon team of 4-6 pokemon based on this request: "${preference}". 
      Respond in INDONESIAN language.
      Explain the role (in Indonesian) of each pokemon and why it was chosen. 
      The team should be viable for a general playthrough.
      Only include pokemon from Gen 1-9.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ["name", "role", "reason"],
          },
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn("Gemini Error:", error);
    return [];
  }
}

export async function translateDescription(text: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Translate this Pokemon description to Indonesian. Keep it concise and maintain a professional yet engaging trainer guide tone: "${text}"`,
    });

    return response.text.trim();
  } catch (error) {
    console.warn("Translation Error:", error);
    return text; // Return original if fails
  }
}

export async function getBestMoves(pokemonName: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Berikan rekomenasi 4 serangan (moves) terbaik untuk Pokemon "${pokemonName}" berdasarkan dari beberapa game Pokemon.
      Jawab dalam bahasa Indonesia.
      Kembalikan hanya dalam format JSON array of objects dengan properti: "name" (nama serangan dalam bahasa inggris), "type" (tipe serangan dalam bahasa Indonesia), dan "description" (alasan dan deskripsi efek dalam bahasa Indonesia).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["name", "type", "description"],
          },
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn("Gemini Error:", error);
    // Graceful fallback for 429
    return [];
  }
}

export async function getBattleAnalysis(p1Name: string, p2Name: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Lakukan analisis pertarungan antara Pokemon "${p1Name}" dan "${p2Name}".
      Jelaskan segala kemungkinan siapa yang akan menang secara umum, dan berikan skenario (win conditions) bagaimana masing-masing Pokemon bisa menang.
      Gunakan bahasa Indonesia.
      Kembalikan dalam format JSON object dengan properti:
      - "winner" (nama Pokemon yang paling berpeluang menang atau "Seimbang")
      - "explanation" (penjelasan singkat mengapa)
      - "p1WinConditions" (array of string, skenario/kemungkinan bagaimana ${p1Name} bisa menang)
      - "p2WinConditions" (array of string, skenario/kemungkinan bagaimana ${p2Name} bisa menang)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            winner: { type: Type.STRING },
            explanation: { type: Type.STRING },
            p1WinConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
            p2WinConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["winner", "explanation", "p1WinConditions", "p2WinConditions"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.warn("Gemini Error:", error);
    return null;
  }
}

