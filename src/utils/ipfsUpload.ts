import { pinata } from '@/utils/pinataConfig';
import { logger } from '@/utils/logger';
import getErrorMessage from '@/utils/getErrorMessage';

export async function uploadToIPFS(mood: string, imageUrl: string) {
  try {
    logger.info(`Starting IPFS upload for mood: "${mood}"`);

    const imageUploadResult = await pinata.upload.url(imageUrl);
    const imageIpfsUrl = `ipfs://${imageUploadResult.IpfsHash}`;

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

    const metadataUploadResult = await pinata.upload.json(metadata);
    const metadataIpfsUrl = `ipfs://${metadataUploadResult.IpfsHash}`;

    const gatewayImageUrl = `https://gateway.pinata.cloud/ipfs/${imageUploadResult.IpfsHash}`;
    const gatewayMetadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataUploadResult.IpfsHash}`;

    logger.info(`Successfully uploaded to IPFS for mood: "${mood}"`);

    return {
      success: true,
      data: {
        imageIpfsUrl,
        metadataIpfsUrl,
        gatewayImageUrl,
        gatewayMetadataUrl
      },
      metadata
    };
  } catch (error) {
    logger.error(`Error uploading to IPFS: ${getErrorMessage(error)}`);
    throw error;
  }
}