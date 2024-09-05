import axios from 'axios';
import { logger, safeStringify } from '@/utils/logger';
import getErrorMessage from '@/utils/getErrorMessage';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

const MODELS_LAB_API_KEY = process.env.MODELS_LAB_API_KEY!;
const MODELS_LAB_API_URL = 'https://modelslab.com/api/v6/llm/chat';
const MODELS_LAB_QUEUED_RESPONSE_URL = "https://modelslab.com/api/v6/llm/get_queued_response";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

function extractAndRefinePrompt(response: string): string {
    const match = response.match(/\[PROMPT\]([\s\S]*?)\[\/PROMPT\]/);
    let prompt = match && match[1] ? match[1].trim() : response.trim();
    prompt = prompt.replace(/^(Prompt:|Image Description:|NFT Description:)\s*/i, '');
    prompt = prompt.split(/\n{2,}/)[0];
    if (!prompt.endsWith('.')) {
      prompt += '.';
    }
    prompt += ' High quality, detailed, intricate, digital art, 3D';
    return prompt;
  }

export async function generatePrompt(theme: string): Promise<string> {
  logger.info(`Starting prompt generation for theme: "${theme}"`);

  const data = {
    key: MODELS_LAB_API_KEY,
    model_id: "zephyr-7b-beta",
    prompt: `Generate a prompt for creating an image that speaks the emotion of (${theme}) which will serve as an (NFT).`,
    system_prompt: "You are a ((prompt engineer)) with ((limitless imagination)).",
    max_new_tokens: 250,
    do_sample: true,
    temperature: 1,
    top_k: 50,
    top_p: 10,
    generator_type: "json",
    no_repeat_ngram_size: 5,
    seed: Math.floor(Math.random() * 10000),
    temp: false,
    uncensored_system_prompt: false
  };

  try {
    const response = await axios.post(MODELS_LAB_API_URL, data);

    if (response.data.status === 'success' && response.data.message) {
      return response.data.message;
    } else if (response.data.status === 'processing') {
      const { chat_id, eta } = response.data.meta;
      const waitTime = (Math.ceil(eta) + 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      const queuedResponse = await axios.post(MODELS_LAB_QUEUED_RESPONSE_URL, {
        key: MODELS_LAB_API_KEY,
        chat_id: chat_id
      });

      if (queuedResponse.status === 200 && queuedResponse.data.message) {
        return queuedResponse.data.message;
      } else {
        throw new Error('Failed to retrieve queued response');
      }
    } else if (response.data.message && response.data.message.includes("exhausted")) {
      logger.info('Models Lab API exhausted. Falling back to Gemini API');
      return await generatePromptWithGemini(theme);
    } else {
      throw new Error('Unexpected response from Models Lab API');
    }
  } catch (error) {
    logger.error(`Error generating prompt: ${getErrorMessage(error)}`);
    throw error;
  }
}

async function generatePromptWithGemini(theme: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    }
  ];
  
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", safetySettings });
  
  const geminiPrompt = `Generate a concise, detailed prompt for an AI image generation model to create an NFT based on the theme "${theme}". The prompt should be descriptive, focusing on visual elements, style, and mood.

Do not include explanations or separate sections. 

IMPORTANT: Your response should ONLY contain the image generation prompt itself, enclosed in [PROMPT] tags. The prompt should be a single paragraph, similar in style and format to this example:

[PROMPT]A ((surreal portrait)) of a figure with ((multiple intertwined heads)), each face expressing a different aspect of confusion. The heads overlap, with mismatched eyes looking in various directions, creating a sense of ((disorientation)). The color palette is muted and dreamlike, with textures reminiscent of old photographs and faded ink. High quality, detailed, intricate, digital art.[/PROMPT]

Now, create a similar prompt for the theme "${theme}":

[PROMPT]Your image generation prompt here[/PROMPT]`;

  try {
    const result = await model.generateContent(geminiPrompt);
    const fullResponse = result.response.text();
    return extractAndRefinePrompt(fullResponse);
  } catch (error) {
    logger.error(`Error generating prompt via Gemini: ${getErrorMessage(error)}`);
    throw new Error('Error generating prompt via Gemini');
  }
}