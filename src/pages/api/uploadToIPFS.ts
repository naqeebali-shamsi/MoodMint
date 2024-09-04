import getErrorMessage from '@/utils/getErrorMessage';
import type { NextApiRequest, NextApiResponse } from 'next';
import { PinataSDK } from 'pinata';

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: "example-gateway.mypinata.cloud",
});

export default async function uploadToIPFS(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { mood, imageUrl } = req.body;

    if (!mood) {
      return res.status(400).json({ error: 'Mood text is required' });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Upload to IPFS directly from URL
    const uploadResponse = await pinata.upload.url(imageUrl, {
      pinataMetadata: {
        name: 'url-uploaded-image',
      },
      pinataContent: {
        mood: mood
      }
    });

    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${uploadResponse.IpfsHash}`;
    res.status(200).json({ ipfsUrl });
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    res.status(500).json({ error: 'Error uploading to IPFS', details: getErrorMessage(error) });
  }
} 