import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY ;

const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
    solidity: "0.8.17",
    networks: {
        sepolia: {
            url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
                accounts: [SEPOLIA_PRIVATE_KEY]
        }
    }
};

export default config;
