'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import MoodNFT from '@/artifacts/contracts/MoodNFT.sol/MoodNFT.json';
import Image from 'next/image';
import Lottie from 'lottie-react';
import { z } from 'zod';
import { Menu } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

import Cat from '@/app/lotties/cat.json';
import Unfair from '@/app/images/snape-isnt-fair.gif';

const moodSchema = z.string().min(1).max(50).regex(/^[a-zA-Z\s]+$/, { message: "Mood must contain only letters and spaces" });

interface MintedNFT {
  id: string;
  mood: string;
  imageUrl: string;
  ipfsUrl: string;
  timestamp: string;
}

export default function Home() {
  const [moodNFT, setMoodNFT] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [mood, setMood] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        console.log("Please install MetaMask!");
      }
    };

    loadSavedState();
    initializeContract();

    return () => {
      isMounted = false;
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

    if (moodNFT && account) {
      setIsLoading(true);
      console.log(`Starting NFT minting process for mood: "${mood}"`);
      try {
        const response = await fetch('/api/mintNFT', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            mood, 
            account,
            contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to prepare NFT minting');
        }

        const { imageUrl, ipfsUrl } = await response.json();
        console.log(`Image generated and IPFS URL received. IPFS URL: ${ipfsUrl}`);

        console.log('Minting NFT on the blockchain...');
        const transaction = await moodNFT.mintMood(account, ipfsUrl, mood);
        await transaction.wait();
        console.log(`NFT minted successfully. Transaction hash: ${transaction.hash}`);

        const newNFT: MintedNFT = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate a unique id
          mood,
          imageUrl,
          ipfsUrl,
          timestamp: new Date().toISOString()
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
          {error && <p className="text-red-500 text-sm">{error.message}</p>}
          <div>
            <Tippy content="Mint your mood as an NFT">
              <button
                onClick={mintNFT}
                disabled={isLoading || !mood || !account}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                  isLoading || !mood || !account ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200`}
              >
                {isLoading ? <Lottie animationData={Cat} style={{ width: 50, height: 50 }} /> : 'Mint NFT'}
              </button>
            </Tippy>
          </div>
          {mintedNFTs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Your Minted NFTs</h3>
              {mintedNFTs.map((nft) => (
                <div key={nft.id} className="border border-gray-200 rounded-md p-4 space-y-4">
                  <p className="text-sm font-medium text-gray-700">Mood: {nft.mood}</p>
                  <p className="text-xs text-gray-500">Minted on: {new Date(nft.timestamp).toLocaleString()}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Tippy content="View your NFT on IPFS">
                      <button
                        onClick={() => window.open(nft.ipfsUrl, '_blank')}
                        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                      >
                        Open NFT URL
                      </button>
                    </Tippy>
                    <Tippy content="Download the NFT image">
                      <button
                        onClick={() => downloadImage(nft.imageUrl, nft.mood)}
                        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        Download Image
                      </button>
                    </Tippy>
                  </div>
                  <Menu as="div" className="relative inline-block text-left w-full">
                    <div>
                      <Tippy content="More options for your NFT">
                        <Menu.Button className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200">
                          More Actions
                          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
                        </Menu.Button>
                      </Tippy>
                    </div>
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Tippy content="Export NFT metadata">
                              <button
                                onClick={() => exportMetadata(nft)}
                                className={`${
                                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                } block w-full px-4 py-2 text-sm text-left transition-colors duration-200`}
                              >
                                Export Metadata
                              </button>
                            </Tippy>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Tippy content="Report if you don't like the generated image">
                              <button
                                onClick={() => handleDislike()}
                                className={`${
                                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                } block w-full px-4 py-2 text-sm text-left transition-colors duration-200`}
                              >
                                Did not like the image
                              </button>
                            </Tippy>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Menu>
                </div>
              ))}
              <Tippy content="Clear all saved NFTs">
                <button
                  onClick={clearAllNFTs}
                  className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Clear All Saved NFTs
                </button>
              </Tippy>
            </div>
          )}
        </div>
        {account && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Connected Account: {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
}