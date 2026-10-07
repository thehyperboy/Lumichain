import { ethers } from 'ethers';

// Replace with your actual contract address and ABI
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0xYourContractAddressHere';
const CONTRACT_ABI = [
  // Add your contract ABI here
];

export const getProvider = () => {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  throw new Error("No crypto wallet found. Please install MetaMask.");
};

export const getSigner = async () => {
  const provider = getProvider();
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
};

export const getContract = async (withSigner = false) => {
  if (withSigner) {
    const signer = await getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
};

export const connectWallet = async () => {
  try {
    const signer = await getSigner();
    const address = await signer.getAddress();
    return { address, signer };
  } catch (error) {
    console.error("Error connecting to wallet:", error);
    throw error;
  }
};
