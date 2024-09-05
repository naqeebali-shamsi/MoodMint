import type { NextApiRequest, NextApiResponse } from 'next';
import { generateImage } from '@/utils/imageGeneration';
import { uploadToIPFS } from '@/utils/ipfsUpload';
import { generatePrompt } from '@/utils/promptGeneration';
import { getRandomEnhancementTag } from '@/utils/enhancementTags';
import { handleApiError } from '@/utils/errorHandling';

export const config = {
    maxDuration: 60,
  };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { operation, theme, mood, imageUrl } = req.body;

    switch (operation) {
      case 'generatePrompt':
        const prompt = await generatePrompt(theme);
        return res.status(200).json({ prompt });

      case 'getEnhancementTag':
        const tag = getRandomEnhancementTag();
        return res.status(200).json({ tag });

      case 'generateImage':
        const generatedImage = await generateImage(theme);
        return res.status(200).json(generatedImage);

      case 'uploadToIPFS':
        const uploadResult = await uploadToIPFS(mood, imageUrl);
        return res.status(200).json(uploadResult);

      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
  } catch (error) {
    handleApiError(error, res);
  }
}