const hre = require("hardhat");
const fs = require("fs");

async function main() {
    try {
        console.log("Starting deployment...");

        // Connect to the network
        const provider = new hre.ethers.providers.JsonRpcProvider(hre.network.config.url);
        console.log("Provider:", provider.constructor.name);

        const network = await provider.getNetwork();
        console.log("Network:", network.name, "Chain ID:", network.chainId);

        // Create wallet from private key
        const privateKey = process.env.PRIVATE_KEY;
        const wallet = new hre.ethers.Wallet(privateKey, provider);
        console.log("Deploying contracts with the account:", wallet.address);

        const balance = await wallet.getBalance();
        console.log("Account balance:", hre.ethers.utils.formatEther(balance), "ETH");

        if (balance.isZero()) {
            throw new Error("Deployer account has zero balance");
        }

        console.log("Creating contract factory...");
        // Use hre.ethers.getContractFactory to get the contract factory
        const MoodNFT = await hre.ethers.getContractFactory("MoodNFT", wallet);
        console.log("Contract factory created");

        console.log("Deploying contract...");
        const moodNFT = await MoodNFT.deploy();
        console.log("Awaiting deployment confirmation...");

        await moodNFT.deployed();

        // Write the contract address to a file inside the artifacts directory
        const artifactsDir = './src/artifacts/contracts/MoodNFT.sol';
        if (!fs.existsSync(artifactsDir)) {
            fs.mkdirSync(artifactsDir, { recursive: true });
        }
        fs.writeFileSync(`${artifactsDir}/contractAddress.txt`, moodNFT.address);

        console.log(`Contract deployed at address: ${moodNFT.address}`);

    } catch (error) {
        console.error("Error in deployment:");
        console.error(error);
    }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
