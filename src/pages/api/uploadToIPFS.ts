import type { NextApiRequest, NextApiResponse } from 'next';
import { PinataSDK } from 'pinata';

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: "indigo-large-narwhal-58.mypinata.cloud",
});

export default async function uploadToIPFS(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const { mood } = req.body;

      // Convert mood text to a File object
      const file = new File([`Mood: ${mood}`], "MoodData.txt", { type: "text/plain" });

      // Use the Pinata SDK to upload the file
      const uploadResponse = await pinata.upload.file(file);

      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${uploadResponse.IpfsHash}`;

      res.status(200).json({ ipfsUrl });
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    res.status(500).json({ error: 'Error uploading to IPFS' });
  }
}
