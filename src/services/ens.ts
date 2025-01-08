import { ethers } from "ethers";
import { encode } from "@ensdomains/content-hash";

// Mainnet configuration
const MAINNET_CHAIN_ID = 1;
// const MAINNET_RPC_URL =
//   "https://eth-mainnet.g.alchemy.com/v2/UbtuzKb8VNANh8a-B0g0tNU7sXrjwZS6";
const ENS_ADDRESS = "0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e";

const ENS_ABI = [
  "function resolver(bytes32 node) external view returns (address)",
  "function owner(bytes32 node) external view returns (address)",
];

const RESOLVER_ABI = [
  "function setText(bytes32 node, string key, string value) public",
  "function text(bytes32 node, string key) public view returns (string)",
  "function setContenthash(bytes32 node, bytes hash) public",
  "function contenthash(bytes32 node) public view returns (bytes)",
];

// Switch to mainnet
async function switchToMainnet() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${MAINNET_CHAIN_ID.toString(16)}` }],
    });
  } catch (error) {
    console.error("Failed to switch network:", error);
    throw new Error("Please switch to Ethereum mainnet manually");
  }
}

export const setEnsRecord = async (ensName: string, ipfsHash: string) => {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }

    console.log("Setting ENS records for:", ensName);
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Check and switch network
    const network = await provider.getNetwork();
    if (network.chainId !== MAINNET_CHAIN_ID) {
      await switchToMainnet();
    }

    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();
    console.log("Signer address:", signerAddress);

    const namehash = ethers.utils.namehash(ensName);
    console.log("Namehash:", namehash);

    // Get ENS contract instance
    const ensContract = new ethers.Contract(ENS_ADDRESS, ENS_ABI, provider);

    // Get Resolver address
    const resolverAddress = await ensContract.resolver(namehash);
    console.log("Resolver address:", resolverAddress);

    if (!resolverAddress || resolverAddress === ethers.constants.AddressZero) {
      throw new Error("No resolver found for this ENS name");
    }

    // Create Resolver contract instance
    const resolverContract = new ethers.Contract(
      resolverAddress,
      RESOLVER_ABI,
      signer
    );

    // Set IPFS contenthash
    console.log("Setting IPFS contenthash for:", ipfsHash);
    const contentHash = "0x" + encode("ipfs", ipfsHash);
    console.log("Encoded contenthash:", contentHash);

    const contentTx = await resolverContract.setContenthash(
      namehash,
      contentHash
    );
    console.log("Content hash transaction:", contentTx.hash);
    const contentReceipt = await contentTx.wait();
    if (!contentReceipt.status) {
      throw new Error("Failed to set content hash");
    }

    // // Set DID record
    // console.log("Setting DID record:", did);
    // const didTx = await resolverContract.setText(namehash, "did", did);
    // console.log("DID transaction:", didTx.hash);
    // const didReceipt = await didTx.wait();
    // if (!didReceipt.status) {
    //   throw new Error("Failed to set DID record");
    // }

    return true;
  } catch (error) {
    console.error("Error setting ENS record:", error);
    throw error;
  }
};
