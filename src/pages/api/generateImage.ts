import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { logger, safeStringify } from '@/utils/logger';
import getErrorMessage from '@/utils/getErrorMessage';

const MODELS_LAB_API_KEY = process.env.MODELS_LAB_API_KEY!;
const MODELS_LAB_API_URL = 'https://modelslab.com/api/v6/realtime/text2img';

async function generatePrompt(theme: string): Promise<string> {
    try {
        const response = await axios.post(`/api/imagePromptGen`, { theme });
        if (response.data && response.data.prompt) {
            return response.data.prompt;
        } else {
            throw new Error('Unexpected response format from imagePromptGen');
        }
    } catch (error) {
        logger.error('Error generating prompt:', safeStringify(error));
        throw new Error(`Failed to generate prompt: ${getErrorMessage(error)}`);
    }
}

async function getRandomEnhancementTag(): Promise<string> {
  try {
    const response = await axios.get(`/api/randomImageEnhanceTag`);
    return response.data.tag;
  } catch (error) {
    logger.error('Error getting random enhancement tag:', error);
    throw new Error('Failed to get random enhancement tag');
  }
}

async function uploadToIPFS(mood: string, imageUrl: string): Promise<string> {
  try {
    const response = await axios.post(`/api/uploadToIPFS`, { mood, imageUrl });
    return response.data.ipfsUrl;
  } catch (error) {
    logger.error('Error uploading to IPFS:', safeStringify(error));
    throw new Error(`Failed to upload to IPFS: ${getErrorMessage(error)}`);
  }
}

function enhancePrompt(prompt: string): string {
  // Add emphasis to main theme
  const emphasizedPrompt = prompt.replace(/(\w+)/g, '(($1))');
  
  // Add style and quality keywords
  const styleKeywords = '((high quality)), ((detailed)), ((intricate))';
  
  // Combine all parts
  return `${emphasizedPrompt}, ${styleKeywords}`;
}

const NEGATIVE_PROMPT = 'out of frame, lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username, watermark, signature, extra body parts';

export const config = {
  maxDuration: 60,
};

export default async function generateImage(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { theme } = req.body;

    if (!theme) {
      return res.status(400).json({ error: 'Theme is required' });
    }

    logger.info(`Starting image generation process for theme: "${theme}"`);

    // Generate prompt and get enhancement tag
    const [basePrompt, enhancementTag] = await Promise.all([
      generatePrompt(theme),
      getRandomEnhancementTag()
    ]);

    // Enhance the prompt
    const fullPrompt = enhancePrompt(basePrompt);
    logger.info(`Generated prompt for theme "${theme}": ${fullPrompt}`);

    // Prepare data for Models Lab API
    const data = {
        key: MODELS_LAB_API_KEY,
        prompt: fullPrompt,
        negative_prompt: NEGATIVE_PROMPT,
        width: 512,
        height: 512,
        safety_checker: false,
        seed: null,
        samples: 1,
        base64: false,
        webhook: null,
        track_id: null,
        enhance_prompt: true,
        enhance_style: enhancePrompt
      };

    const config = {
      method: 'post',
      url: MODELS_LAB_API_URL,
      headers: { 
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(data)
    };

    const response = await axios.request(config);

    if (response.data.status === 'success') {
      logger.info(`Image generated successfully for theme "${theme}"`);
      const ipfsUrl = await uploadToIPFS(theme, response.data.output[0]);
      logger.info(`Image uploaded to IPFS. IPFS URL: ${ipfsUrl}`);
      res.status(200).json({
        imageUrl: response.data.output[0],
        ipfsUrl: ipfsUrl,
        prompt: fullPrompt,
        negativePrompt: NEGATIVE_PROMPT,
        enhancementTag,
        meta: response.data.meta
      });
    } else {
      logger.error('Failed to generate image', response.data);
      throw new Error('Failed to generate image');
    }
  } catch (error) {
    logger.error('Error generating image');
    console.error('Error generating image:', error );
    res.status(500).json({ error: 'Error generating image', details: getErrorMessage(error) });
  }
}