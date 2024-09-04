import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY || "";

export default async function geminiPromptGen(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
    
    try {
        const { prompt } = req.body;
    
        if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
        }
    
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Generate a prompt for creating an image that speaks the emotion of (${theme}) which will serve as an (NFT).`;

        const result = await model.generateContent(prompt);
        console.log(result.response.text());
    
        if (response.status === "success" && response.data) {
        res.status(200).json({
            prompt: response.data.text,
            meta: response.meta,
        });
        } else {
        res.status(500).json({ error: "Error generating prompt" });
        }
    } catch (error) {
        console.error("Error generating prompt:", error);
        res.status(500).json({ error: "Error generating prompt", details: error });
    }
}
