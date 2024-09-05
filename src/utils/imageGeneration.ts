import axios from 'axios';
import { logger } from '@/utils/logger';
import getErrorMessage from '@/utils/getErrorMessage';
import { generatePrompt } from './promptGeneration';
import { getRandomEnhancementTag } from './enhancementTags';

const MODELS_LAB_API_KEY = process.env.MODELS_LAB_API_KEY!;
const MODELS_LAB_API_URL = 'https://modelslab.com/api/v6/realtime/text2img';

function enhancePrompt(prompt: string): string {
  const emphasizedPrompt = prompt.replace(/(\w+)/g, '(($1))');
  const styleKeywords = '((high quality)), ((detailed)), ((intricate))';
  return `${emphasizedPrompt}, ${styleKeywords}`;
}

const NEGATIVE_PROMPT = 'out of frame, lowres, text, error, cropped, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, out of frame, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck, username, watermark, signature, extra body parts';

export async function generateImage(theme: string) {
  logger.info(`Starting image generation process for theme: "${theme}"`);

  try {
    const [basePrompt, enhancementTag] = await Promise.all([
      generatePrompt(theme),
      getRandomEnhancementTag()
    ]);

    const fullPrompt = enhancePrompt(basePrompt);
    logger.info(`Generated prompt for theme "${theme}": ${fullPrompt}`);

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

    const response = await axios.post(MODELS_LAB_API_URL, data);

    if (response.data.status === 'success') {
      logger.info(`Image generated successfully for theme "${theme}"`);
      return {
        imageUrl: response.data.output[0],
        prompt: fullPrompt,
        negativePrompt: NEGATIVE_PROMPT,
        enhancementTag,
        meta: response.data.meta
      };
    } else {
      throw new Error('Failed to generate image');
    }
  } catch (error) {
    logger.error(`Error generating image: ${getErrorMessage(error)}`);
    throw error;
  }
}