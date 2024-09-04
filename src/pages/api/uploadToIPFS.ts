import getErrorMessage from '@/utils/getErrorMessage';
import type { NextApiRequest, NextApiResponse } from 'next';
import { pinata } from '@/utils/pinataConfig';

export const config = {
  maxDuration: 60,
};

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

    // Upload image to IPFS
    const imageUploadResult = await pinata.upload.url(imageUrl);
    const imageIpfsUrl = `ipfs://${imageUploadResult.IpfsHash}`;

    // Create metadata JSON
    const metadata = {
      name: `Mood NFT: ${mood}`,
      description: `An NFT representing the mood: ${mood}`,
      image: imageIpfsUrl,
      attributes: [
        {
          trait_type: "Mood",
          value: mood
        }
      ]
    };

    // Upload metadata to IPFS
    const metadataUploadResult = await pinata.upload.json(metadata);
    const metadataIpfsUrl = `ipfs://${metadataUploadResult.IpfsHash}`;

    // Create gateway URLs for easier access
    const gatewayImageUrl = `https://gateway.pinata.cloud/ipfs/${imageUploadResult.IpfsHash}`;
    const gatewayMetadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataUploadResult.IpfsHash}`;

    res.status(200).json({ 
      success: true,
      data: {
        imageIpfsUrl, 
        metadataIpfsUrl,
        gatewayImageUrl,
        gatewayMetadataUrl
      },
      metadata // Include the full metadata for reference
    });
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error uploading to IPFS', 
      details: getErrorMessage(error) 
    });
  }
}