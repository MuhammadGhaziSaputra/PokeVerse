import { GoogleGenAI, Type } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getTeamRecommendation(preference: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: `Recommend a Pokemon team of 4-6 pokemon based on this request: "${preference}". 
      Respond in INDONESIAN language.
      Explain the role (in Indonesian) of each pokemon and why it was chosen. 
      The team should be viable for a general playthrough.
      Only include pokemon from Gen 1-9.`,
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
    console.error("Gemini Error:", error);
    return [
      { name: "Pikachu", role: "Maskot", reason: "API Limit tercapai, ini contoh Pokemon." },
      { name: "Charizard", role: "Penyerang", reason: "API Limit tercapai, tidak dapat menghasilkan tim AI." }
    ];
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
    console.error("Translation Error:", error);
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
    console.error("Gemini Error:", error);
    // Graceful fallback for 429
    return [
      { name: "Tackle", type: "Normal", description: "Limit AI harian tercapai. Ini adalah serangan bawaan." },
      { name: "Growl", type: "Normal", description: "Limit AI tercapai." }
    ];
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
    console.error("Gemini Error:", error);
    return {
       winner: "Tidak dapat diprediksi saat ini",
       explanation: "Batas limit penggunaan AI (Quota 429) tercapai. Silakan coba lagi nanti.",
       p1WinConditions: ["Limit AI"],
       p2WinConditions: ["Limit AI"]
    };
  }
}

