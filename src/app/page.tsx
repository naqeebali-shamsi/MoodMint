'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import MoodNFT from '@/artifacts/contracts/MoodNFT.sol/MoodNFT.json';
import Lottie from 'lottie-react';
import { set, z } from 'zod';
import { Button, Dropdown } from 'antd';
import { DownOutlined, ExportOutlined, DislikeOutlined, EyeOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import 'antd/dist/reset.css';

import Cat from '@/app/lotties/cat.json';
import Unfair from '@/app/images/snape-isnt-fair.gif';

const moodSchema = z.string().min(1).max(50).regex(/^[a-zA-Z\s]+$/, { message: "Mood must contain only letters and spaces" });

interface MintedNFT {
  id: string;
  mood: string;
  imageUrl: string;
  ipfsUrl: string;
  timestamp: string;
  transactionHash: string;
}

export default function Home() {
  const [moodNFT, setMoodNFT] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [mood, setMood] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [metaMaskPresent, setMetaMaskPresent] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSavedState = () => {
      try {
        const savedNFTs = localStorage.getItem('moodNFTs');
        if (savedNFTs) {
          const parsedNFTs = JSON.parse(savedNFTs);
          // Remove duplicates based on id
          const uniqueNFTs = parsedNFTs.filter((nft: MintedNFT, index: number, self: MintedNFT[]) =>
            index === self.findIndex((t) => t.id === nft.id)
          );
          setMintedNFTs(uniqueNFTs);
        }
      } catch (error) {
        console.error("Error loading saved NFTs:", error);
      }
    };

    const initializeContract = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          if (window.ethereum.request) {
            setMetaMaskPresent(true);
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (!isMounted) return;

            setAccount(accounts[0]);
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!, MoodNFT.abi, signer);
            setMoodNFT(contract);
          } else {
            console.error("window.ethereum.request is not defined.");
          }
        } catch (error) {
          console.error("An error occurred during initialization:", error);
        }
      } else {
        alert("Please install MetaMask!");
      }
    };

    loadSavedState();
    initializeContract();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
  
    const checkNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await provider.getNetwork();
          
          if (network.chainId !== 11155111) { // Sepolia chainId
            setNetworkError("Please connect to the Sepolia test network");
          } else {
            setNetworkError(null);
          }
        } catch (error) {
          console.error("Error checking network:", error);
        }
      }
    };
  
    const handleNetworkChange = (networkId: string) => {
      if (networkId !== '0xaa36a7') { // Sepolia networkId in hex
        setNetworkError("Please connect to the Sepolia test network");
      } else {
        setNetworkError(null);
      }
    };
  
    checkNetwork();
  
    if (window.ethereum && typeof window.ethereum.on === 'function') {
      window.ethereum.on('networkChanged', handleNetworkChange);
    }
  
    return () => {
      isMounted = false;
      if (window.ethereum && typeof window.ethereum.removeListener === 'function') {
        window.ethereum.removeListener('networkChanged', handleNetworkChange);
      }
    };
  }, []);

  const saveNFTsToLocalStorage = (nfts: MintedNFT[]) => {
    try {
      localStorage.setItem('moodNFTs', JSON.stringify(nfts));
    } catch (error) {
      console.error("Error saving NFTs to local storage:", error);
    }
  };

  const downloadImage = async (imageUrl: string, mood: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mood-nft-${mood}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading image:", error);
      setError("Failed to download image. Please try again.");
    }
  };

  const exportMetadata = (nft: MintedNFT) => {
    const metadata = JSON.stringify(nft, null, 2);
    const blob = new Blob([metadata], {type: 'application/json'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mood-nft-${nft.mood}-metadata.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAllNFTs = () => {
    localStorage.removeItem('moodNFTs');
    setMintedNFTs([]);
  };

  const handleDislike = () => {
    window.open(Unfair.src, '_blank');
  };

  const mintNFT = async () => {
    setError(null);
    try {
      moodSchema.parse(mood);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        console.error(`Validation error: ${err.errors[0].message}`);
        return;
      }
    }
  
    if (account && moodNFT) {
      setIsLoading(true);
      console.log(`Starting NFT minting process for mood: "${mood}"`);
      try {
        // Generate the image
        const generateResponse = await fetch('/api/moodForge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operation: 'generateImage', theme: mood }),
        });
  
        if (!generateResponse.ok) {
          throw new Error('Failed to generate image');
        }
  
        const { imageUrl, prompt, negativePrompt, enhancementTag } = await generateResponse.json();
  
        // Upload to IPFS
        const uploadResponse = await fetch('/api/moodForge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operation: 'uploadToIPFS', mood, imageUrl }),
        });
  
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload to IPFS');
        }
  
        const ipfsData = await uploadResponse.json();
  
        if (!ipfsData.success) {
          throw new Error(ipfsData.error || 'Failed to upload to IPFS');
        }
  
        const { metadataIpfsUrl, gatewayImageUrl, gatewayMetadataUrl } = ipfsData.data;
  
        // Mint the NFT using MetaMask
        console.log('Minting NFT on the blockchain...');
        const transaction = await moodNFT.mintMood(account, metadataIpfsUrl, mood);
        const receipt = await transaction.wait();
  
        console.log(`NFT minted successfully. Transaction hash: ${receipt.transactionHash}`);
  
        const newNFT: MintedNFT = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          mood,
          imageUrl: gatewayImageUrl,
          ipfsUrl: gatewayMetadataUrl,
          timestamp: new Date().toISOString(),
          transactionHash: receipt.transactionHash
        };
  
        const updatedNFTs = [...mintedNFTs, newNFT];
        setMintedNFTs(updatedNFTs);
        saveNFTsToLocalStorage(updatedNFTs);
  
        setMood('');
        console.log('NFT minting process completed successfully');
      } catch (error) {
        console.error("An error occurred while minting:", error);
        setError(error instanceof Error ? error.message : 'Failed to mint Mood NFT');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getMenuItems = (nft: MintedNFT): MenuProps['items'] => [
    {
      key: 'export',
      icon: <ExportOutlined />,
      label: 'Export Metadata',
      onClick: () => exportMetadata(nft),
    },
    {
      key: 'dislike',
      icon: <DislikeOutlined />,
      label: 'Did not like the image',
      onClick: handleDislike,
    },
    {
      key: 'showImage',
      icon: <EyeOutlined />,
      label: 'Show Image',
      onClick: () => window.open(nft.imageUrl, '_blank'),
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            NFT Mood Tracker
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Mint your mood as an NFT
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="Enter your mood"
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
          {isLoading ? (
            <div className="w-full h-64 flex  justify-center items-baseline">
              <Lottie
                animationData={Cat}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            ) : (
              <Button
                type="primary"
                onClick={mintNFT}
                disabled={!mood || !account}
                className="w-full h-8 text-lg font-semibold"
              >
                Mint NFT
              </Button>
            )}
          </div>
          {mintedNFTs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Your Minted NFTs</h3>
              {mintedNFTs.map((nft) => (
                <div key={nft.id} className="border border-gray-200 rounded-md p-4 space-y-4">
                  <p className="text-sm font-medium text-gray-700">Mood: {nft.mood}</p>
                  <p className="text-xs text-gray-500">Minted on: {new Date(nft.timestamp).toLocaleString()}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="primary" onClick={() => window.open(nft.ipfsUrl, '_blank')}>
                      Open NFT URL
                    </Button>
                    <Button onClick={() => downloadImage(nft.imageUrl, nft.mood)}>
                      Download Image
                    </Button>
                  </div>
                  <Dropdown menu={{ items: getMenuItems(nft) }} trigger={['click']}>
                    <Button className="w-full">
                      More Actions <DownOutlined />
                    </Button>
                  </Dropdown>
                </div>
              ))}
              <Button danger onClick={clearAllNFTs} className="w-full">
                Forget locally saved NFTs
              </Button>
            </div>
          )}
        </div>
        {account && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Connected Account: {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        )}
      </div>
      {
        !metaMaskPresent && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md shadow-lg" role="alert">
            <strong className="font-bold">MetaMask Required</strong>
            <span className="block sm:inline"> Please <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer" className="underline">install MetaMask</a> to mint NFTs.</span>
          </div>
        )
      }
      {networkError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Network Error:</strong>
          <span className="block sm:inline"> {networkError}</span>
        </div>
      )}
    </div>
  );
}