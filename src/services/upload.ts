import axios, { AxiosError } from "axios";
import type { RcFile } from "antd/es/upload";
import { message } from "antd";
import { ethers } from "ethers";

/**
 * Encrypt API key using XOR cipher
 * @param apiKey Original API key to encrypt
 * @returns Base64 encoded encrypted string
 */
export const encryptApiKey = (apiKey: string): string => {
  try {
    const key = "glitter-protocol";
    let result = "";
    for (let i = 0; i < apiKey.length; i++) {
      const charCode = apiKey.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(encodeURIComponent(result));
  } catch (error) {
    console.error("Encryption error:", error);
    return apiKey;
  }
};

/**
 * Decrypt encrypted API key
 * @param encryptedKey Base64 encoded encrypted key
 * @returns Original decrypted API key
 */
export const decryptApiKey = (encryptedKey: string): string => {
  if (!encryptedKey) return "";
  
  try {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encryptedKey)) {
      throw new Error("Invalid Base64 format");
    }

    const decoded = atob(encryptedKey);
    const decodedStr = decodeURIComponent(decoded);
    const key = "glitter-protocol";
    let result = "";
    
    for (let i = 0; i < decodedStr.length; i++) {
      const charCode = decodedStr.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    
    return result;
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
};

/**
 * Extend Window interface to include ethereum property
 */
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}

// Glitter IPFS API endpoint
const glitterEndpoint = "https://ipfs.glitterprotocol.dev/api/v0";

// Authentication API endpoint
const AUTH_API = "https://api.social.glitterprotocol.app/v1/login_or_register";

/**
 * Interface for IPFS upload response
 */
interface IUploadRes {
  Hash: string;
  Size: string;
}

/**
 * Interface for AI agent data
 */
interface AgentData {
  name: string;
  functionDesc: string;
  behaviorDesc: string;
  did: string;
  avatar?: string;
  id?: string;
}

/**
 * Create authentication message with timestamp
 * @param address Wallet address
 * @returns Message and timestamp
 */
const createMessage = (address: string) => {
  const timestamp = Math.floor(new Date().getTime() / 1000);
  const msg = `Message:

upload and deploy project

Wallet address:
${address}

Nonce:
${timestamp}
`;
  return { msg, timestamp };
};

/**
 * Sign message using MetaMask
 * @param msg Message to sign
 * @returns Signed message
 */
const signMessage = async (msg: string) => {
  if (!window.ethereum) {
    throw new Error("MetaMask not found");
  }
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return await signer.signMessage(msg);
};

/**
 * Login or register user with wallet
 * @param address Wallet address
 * @returns Authentication token
 */
const loginOrRegister = async (address: string) => {
  try {
    const { msg } = createMessage(address);
    const sign = await signMessage(msg);

    const response = await axios.post(AUTH_API, {
      address,
      msg,
      sign,
    });

    if (response.data?.data?.Token) {
      localStorage.setItem("Authentication-Tokens", response.data.data.Token);
      localStorage.setItem("Token_address", address);
      return response.data.data.Token;
    }

    throw new Error("Login failed");
  } catch (err) {
    const error = err as Error | AxiosError;
    console.error("Login error:", error);
    throw new Error(
      `Login failed: ${
        error instanceof AxiosError
          ? error.response?.data?.message || error.message
          : error.message
      }`
    );
  }
};

/**
 * Check authentication status and login if needed
 */
const checkAuth = async () => {
  const token = localStorage.getItem("Authentication-Tokens");
  const address = localStorage.getItem("Token_address");

  if (!token || !address) {
    if (!window.ethereum) {
      message.error("Please install MetaMask first");
      throw new Error("MetaMask not found");
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const address = await signer.getAddress();

    await loginOrRegister(address);
  }
};

/**
 * Upload file to Glitter IPFS
 * @param file File or Blob to upload
 * @param onProgress Progress callback
 * @returns Upload response
 */
const uploadToGlitter = async (
  file: File | Blob,
  onProgress?: (percent: number) => void
): Promise<IUploadRes> => {
  try {
    await checkAuth();

    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post<{ data: IUploadRes[] }>(
      `${glitterEndpoint}/add`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authentication-Tokens":
            localStorage.getItem("Authentication-Tokens") || "",
          Token_address: localStorage.getItem("Token_address") || "",
        },
        onUploadProgress(progressEvent) {
          const { loaded, total } = progressEvent;
          onProgress?.((loaded / total) * 100);
        },
      }
    );

    if (!response.data.data?.[0]) {
      throw new Error("Upload failed: No response data");
    }

    return response.data.data[0];
  } catch (err) {
    const error = err as Error | AxiosError;
    console.error("Upload error:", error);

    if (error.message === "MetaMask not found") {
      message.error("Please install MetaMask first");
    } else if (error.message.includes("Login failed")) {
      message.error("Authentication failed, please try again");
    } else {
      message.error("Upload failed, please try again");
    }

    throw error;
  }
};

/**
 * Upload content to IPFS
 * @param content Content to upload
 * @param onProgress Progress callback
 * @returns IPFS hash
 */
export const uploadToIPFS = async (
  content: string,
  onProgress?: (percent: number) => void
): Promise<string> => {
  const blob = new Blob([content], { type: "text/html" });
  const result = await uploadToGlitter(blob, onProgress);
  return result.Hash || "";
};

/**
 * Convert base64 string to Blob
 * @param base64 Base64 string
 * @returns Blob object
 */
const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(";base64,");
  const contentType = parts[0].split(":")[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};

/**
 * Upload avatar to IPFS
 * @param base64OrFile Base64 string or RcFile object
 * @param onProgress Progress callback
 * @returns IPFS hash
 */
export const uploadAvatar = async (
  base64OrFile: string | RcFile,
  onProgress?: (percent: number) => void
): Promise<string> => {
  let file: Blob;

  if (typeof base64OrFile === "string") {
    file = base64ToBlob(base64OrFile);
  } else {
    file = base64OrFile;
  }

  const result = await uploadToGlitter(file, onProgress);
  return result.Hash || "";
};

/**
 * Generate HTML content for AI agent
 * @param data Agent data
 * @returns Generated HTML string
 */
export const generateHTML = (data: AgentData) => {
  const avatarUrl =
    typeof data.avatar === "string" && data.avatar
      ? data.avatar.startsWith("http")
        ? data.avatar
        : `https://ipfs.glitterprotocol.dev/ipfs/${data.avatar}`
      : "";

  const testKey = "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";
  const encryptedTestKey = encryptApiKey(testKey);

  return `
<!DOCTYPE html>
<html>
<head>
  <title>${data.name}</title>
  <link rel="icon" href="${avatarUrl}" type="image/x-icon" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta charset="UTF-8">
  <meta name="description" content="${data.functionDesc}">
  <script>
    window.aiData = ${JSON.stringify(
      {
        name: data.name,
        functionDesc: data.functionDesc,
        behaviorDesc: data.behaviorDesc,
        did: data.did,
        id: data.id,
        avatar: avatarUrl,
        apiKey: encryptedTestKey,
      },
      null,
      2
    )};
  </script>
  <script type="module" crossorigin src="https://aipfs.glitterprotocol.tech/agent/agent.js"></script>
  <link rel="stylesheet" crossorigin href="https://aipfs.glitterprotocol.tech/agent/agent.css">
</head>
<body>
  <div id="root-ai-agent"></div>
</body>
</html>
  `.trim();
};
