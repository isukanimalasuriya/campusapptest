import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set in .env");
  }
  return new GoogleGenerativeAI(apiKey);
};

export const getAISuggestions = async (req, res) => {
  const { description } = req.body;

  if (!description || description.trim() === "") {
    return res.status(400).json({ message: "Description is required" });
  }

  try {
    const client = getGeminiClient();
    
    // FIX: Changed 'genAI' to 'client' to match the line above
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" }); 

    const prompt = `
      You are a helpful university IT support assistant.
      Student issue: "${description}"
      Give 3 clear, short steps to solve this problem.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();   // actual generated text from Gemini

    if (!text) {
      throw new Error("No text returned from Gemini");
    }

    const suggestions = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    return res.json({ suggestions });
  } catch (error) {
    console.error("Gemini API error:", error.message || error);
    return res.status(500).json({
      message: "AI error with Gemini",
      error: error.message,
    });
  }
};