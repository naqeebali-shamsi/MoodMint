'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import MoodNFT from '@/artifacts/contracts/MoodNFT.sol/MoodNFT.json';

export default function Home() {
  const [moodNFT, setMoodNFT] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [mood, setMood] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!, MoodNFT.abi, signer);
          setMoodNFT(contract);
        } catch (error) {
          console.error("An error occurred during initialization:", error);
        }
      } else {
        console.log("Please install MetaMask!");
      }
    };

    init();
  }, []);

  const mintMood = async () => {
    if (moodNFT && mood) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/uploadToIPFS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mood }),
        });

        if (!response.ok) {
          throw new Error('Failed to upload to IPFS');
        }

        const { ipfsUrl } = await response.json();

        const transaction = await moodNFT.mintMood(account, ipfsUrl, mood);
        await transaction.wait();
        alert('Mood NFT minted!');
        setMood('');
      } catch (error) {
        console.error("An error occurred while minting:", error);
        alert('Failed to mint Mood NFT');
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
            <div>
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="Enter your mood"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <button
              onClick={mintMood}
              disabled={isLoading || !mood}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading || !mood ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {isLoading ? 'Minting...' : 'Mint Mood NFT'}
            </button>
          </div>
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
