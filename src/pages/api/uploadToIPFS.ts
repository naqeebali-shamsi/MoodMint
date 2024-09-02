import type { NextApiRequest, NextApiResponse } from 'next';
import PinataClient from '@pinata/sdk';

const pinata = PinataClient(process.env.PINATA_API_KEY!, process.env.PINATA_API_SECRET!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { mood } = req.body;

    if (!mood) {
      res.status(400).json({ error: 'Mood is required' });
      return;
    }

    try {
      // Pin data to IPFS
      const result = await pinata.pinJSONToIPFS({ mood });
      const ipfsUrl = `ipfs://${result.IpfsHash}`;

      res.status(200).json({ ipfsUrl });
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      res.status(500).json({ error: 'Failed to upload to IPFS' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
