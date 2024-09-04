import type { NextApiRequest, NextApiResponse } from 'next';
import { logger, safeStringify } from '@/utils/logger';
import getErrorMessage from '@/utils/getErrorMessage';
import axios from 'axios';

const BASE_URL = process.env.NODE_ENV === 'production'
  ? `https://${process.env.HOST}`
  : `http://${process.env.HOST}:${process.env.PORT}`;

export default async function mintNFT(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { mood, account, contractAddress } = req.body;

    if (!mood || !account || !contractAddress) {
      return res.status(400).json({ error: 'Mood, account, and contract address are required' });
    }

    logger.info(`Starting NFT minting process for mood: "${mood}" and account: ${account}`);

    // Generate image and get IPFS URL in one step
    const response = await axios.post(`${BASE_URL}/api/generateImage`, { theme: mood });
    
    if (response.status !== 200) {
      throw new Error(`Failed to generate image: ${response.statusText}`);
    }

    const { imageUrl, ipfsUrl } = response.data;
    logger.info(`Image generated and uploaded to IPFS. Image URL: ${imageUrl}, IPFS URL: ${ipfsUrl}`);
    res.status(200).json({ imageUrl, ipfsUrl });
    logger.info(`NFT minting preparation completed successfully for mood: "${mood}"`);
  } catch (error) {
    logger.error(`Error in NFT minting process: ${getErrorMessage(error)}`);
    res.status(500).json({ 
      error: 'Error preparing NFT', 
      details: getErrorMessage(error),
    });
  }
}