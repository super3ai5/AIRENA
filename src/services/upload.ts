/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from "axios";
import { message } from "antd";
import { ethers } from "ethers";
import { UPLOAD_ABI } from "@/abis/uploadAbi";
import { importer, ImportCandidate } from "ipfs-unixfs-importer";
import {
  ENetwork,
  INetwork,
  networks,
  switchNetworkMetaMask,
} from "@/services/network";
import { decryptApiKey, readFileAsUint8Array } from "@/utils";

// Glitter IPFS API endpoint
const GLITTER_IPFS_API_URL = "https://ipfs.glitterprotocol.dev/api/v0";
const MAINNET_RPC = "https://rpc.ankr.com/eth";

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
export interface IAgentData {
  name: string;
  functionDesc: string;
  behaviorDesc: string;
  did: string;
  avatar?: string;
  id?: string;
}

interface IFile {
  filename: string;
  contenthash: string;
  filesize: number;
  timestamp: number;
}

export interface IRecord {
  filename: string;
  contenthash: string;
  timestamp: number;
  did: string;
  creator_address: string;
  agent_name: string;
  agent_intro: string;
  avatar: string;
}

const getProvider = async (needSigner = false) => {
  if (needSigner) {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();
    if (network.chainId === ENetwork.Ethereum) {
      await switchNetworkMetaMask(ENetwork.Ethereum, provider);
    }
    return provider;
  }

  if (window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }

  return new ethers.providers.JsonRpcProvider(MAINNET_RPC);
};

export const getAllRecords = async (
  pageNum: number,
  pageSize: number
): Promise<{ total: number; records: IRecord[] }> => {
  try {
    const provider = await getProvider();
    const network = await provider.getNetwork();
    console.log(network.chainId, " network.chainId");
    const contractAddress = networks.find(
      (item: INetwork) => item.value === network.chainId
    )?.contractAddr;
    if (!contractAddress) throw new Error("Contract address not found");
    const contract = new ethers.Contract(contractAddress, UPLOAD_ABI, provider);

    try {
      const count = await contract.getRecordCount();
      const length = count.toNumber();
      if (length === 0) {
        return {
          total: 0,
          records: [],
        };
      }
      // get all records
      const records = await contract.fetchData(0, length);

      console.log("Raw records:", records);

      // pagination
      const startIndex = (pageNum - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedRecords = records;

      // format records
      const formattedRecords: IRecord[] = paginatedRecords
        .map((record: any) => ({
          did: record.ensName,
          contenthash: record.contenthash,
          timestamp: record.timestamp.toNumber(),
          creator_address: record.creator_address,
          avatar: record.avatarContentHash,
          agent_name: record.agent_name,
          agent_intro: record.agent_intro,
        }))
        .sort((a: IRecord, b: IRecord) => b.timestamp - a.timestamp)
        .slice(startIndex, endIndex);

      console.log("Formatted records:", formattedRecords);
      return {
        total: length,
        records: formattedRecords,
      };
    } catch (error) {
      console.error("Contract call error:", error);
      throw new Error("Failed to fetch records from contract");
    }
  } catch (error) {
    console.error("Get records error:", error);
    message.error(
      error instanceof Error ? error.message : "Failed to get records"
    );
    throw error;
  }
};

/**
 * Upload file to Glitter IPFS
 * @param file File or Blob to upload
 * @param onProgress Progress callback
 * @returns Upload response
 */
const uploadToGlitter = async (
  fileList: File[],
  txId: string,
  chainId: string,
  onProgress?: (percent: number) => void
): Promise<IUploadRes> => {
  try {
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append(`files[${file.name}]`, file);
    });

    const { data } = await axios.post(
      `${GLITTER_IPFS_API_URL}/upagent?tx_id=${txId}&chainid=${chainId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress(progressEvent) {
          const { loaded, total } = progressEvent;
          onProgress?.((loaded / total) * 100);
        },
      }
    );

    if (!data.data?.[0]) {
      throw new Error("Upload failed: No response data");
    }
    console.log(data.data, "data.data");
    const item = data.data.find((item: any) => !item.Name.includes("/"));
    return {
      Hash: item.Hash,
      Size: item.Size,
    };
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

export const ipfsUnixfsImporterBlock = {
  blocks: new Map(),
  get: async (cid: any) => {
    const bytes = ipfsUnixfsImporterBlock.blocks.get(cid.toString());
    if (!bytes) throw new Error(`block not found: ${cid}`);
    return bytes;
  },
  put: async (bytes: Uint8Array) => {
    const cid = await bytes;
    ipfsUnixfsImporterBlock.blocks.set(cid.toString(), bytes);
    return cid;
  },
};

const createAvatarCid = async (file: File) => {
  const avatarCid = [];
  const { content: uint8Array } = await readFileAsUint8Array(file);

  let fileCid: any = "";
  const source: ImportCandidate[] = [{ content: uint8Array }];
  for await (const entry of importer(source, ipfsUnixfsImporterBlock, {
    cidVersion: 0,
    onlyHash: true,
  })) {
    fileCid = entry.cid;
  }

  avatarCid.push({
    name: file.name,
    size: file.size,
    cid: fileCid.toString(),
  });

  return avatarCid;
};

/**
 * Create HTML file from content
 * @param content HTML content string
 * @returns HTML File object
 */
const createHtmlFile = async (content: string): Promise<File> => {
  try {
    const blob = new Blob([content], { type: "text/html" });
    const file = new File([blob], "index.html", {
      type: "text/html",
      lastModified: Date.now(),
    });

    return file;
  } catch (error) {
    console.error("Create HTML file error:", error);
    throw error;
  }
};

const uploadFolderToIPFS = async (dirFileList: File[]) => {
  const list: IFile[] = [];
  const folderName = `agent_${Date.now()}`;

  const sourcePromises = dirFileList.map(async (file) => {
    const content = await readFileAsUint8Array(file);
    return {
      path: `${folderName}/${file.name}`,
      content: content.content,
    } as ImportCandidate;
  });

  const source = await Promise.all(sourcePromises);
  console.log("Source:", source);

  for await (const entry of importer(source, ipfsUnixfsImporterBlock, {
    cidVersion: 0,
    onlyHash: true,
    wrapWithDirectory: true,
  })) {
    console.log("Entry:", entry);
    const data = {
      filename: entry.path || "",
      contenthash: entry.cid.toString(),
      filesize: entry.size,
      timestamp: Date.now(),
    };
    console.log("Data:", data);
    list.push(data);
  }

  return list;
};

/**
 * upload file params
 */
interface IRecordDataParam {
  contenthash: string;
  timestamp: number;
  agent_name: string;
  agent_intro: string;
  ensName: string;
  avatarContentHash: string;
}

interface IUploadData {
  name: string;
  avatar: File;
  functionDesc: string;
  behaviorDesc: string;
  did: string;
}

/**
 * Upload content to IPFS
 * @param content Content to upload
 * @param onProgress Progress callback
 * @returns IPFS hash
 */
export const uploadToIPFSByContract = async (
  formData: IUploadData,
  onProgress?: (percent: number) => void
): Promise<{ htmlHash: string; avatarHash: string }> => {
  try {
    const provider = await getProvider(true);
    const signer = provider.getSigner();
    const network = await provider.getNetwork();
    const contractAddress = networks.find(
      (item: INetwork) => item.value === network.chainId
    )?.contractAddr;
    if (!contractAddress) throw new Error("Contract address not found");
    const contract = new ethers.Contract(contractAddress, UPLOAD_ABI, signer);

    const avatarCid = await createAvatarCid(formData.avatar);
    console.log("Avatar CID:", avatarCid);

    const htmlContent = generateHTML({
      name: formData.name,
      avatar: avatarCid[0].cid,
      functionDesc: formData.functionDesc,
      behaviorDesc: formData.behaviorDesc,
      did: formData.did,
    });

    const htmlFile = await createHtmlFile(htmlContent);
    console.log("HTML File:", htmlFile);
    const fileList = [htmlFile, formData.avatar];
    const dirFileList = await createFolderWithFiles(fileList);
    console.log(dirFileList, "dirFileList");
    const ipfsHashCids = await uploadFolderToIPFS(fileList);

    console.log(ipfsHashCids, "ipfsHashCids");
    const findCid = ipfsHashCids.find(
      (item: IFile) => !item.filename.includes("/")
    );
    console.log(findCid, "findCid");
    const data: IRecordDataParam = {
      contenthash: findCid ? findCid.contenthash : "",
      timestamp: Date.now(),
      agent_name: formData.name,
      agent_intro: formData.functionDesc,
      ensName: formData.did,
      avatarContentHash: avatarCid[0].cid,
    };
    const price = await contract.priceEth();
    console.log("Price:", price.toString());
    console.log(data, "data");

    const tx = await contract.recordData(
      data.contenthash,
      data.timestamp,
      data.agent_name,
      data.agent_intro,
      data.ensName,
      data.avatarContentHash,
      {
        value: price,
        gasLimit: 500000,
      }
    );

    const receipt = await tx.wait();
    const glitterHash = await uploadToGlitter(
      dirFileList,
      receipt.transactionHash,
      network.chainId.toString(),
      onProgress
    );
    return {
      htmlHash: glitterHash.Hash,
      avatarHash: avatarCid[0].cid,
    };
  } catch (error: any) {
    console.error("Contract error:", error);
    throw error;
  }
};

/**
 * Generate HTML content for AI agent
 * @param data Agent data
 * @returns Generated HTML string
 */
export const generateHTML = (data: IAgentData) => {
  const avatarUrl =
    typeof data.avatar === "string" && data.avatar
      ? data.avatar.startsWith("http")
        ? data.avatar
        : `https://ipfs.glitterprotocol.dev/ipfs/${data.avatar}`
      : "";

  const TEST_API_KEY = decryptApiKey(
    "JTE0JTA3RCUxQiUwNkglMDQlMUMlNURCWSU0MFZSWlUlMDJZWCU0MCUxMiUwM0clMUFJRiU1Qk0lMEIlMDUlMDlYJTAyWlpMRVdGJTE0JTE1QiU1REMlMEUlMDFYJTBEVVElMEElNUQlMTBFJTAxJTQwJTFGJTE0"
  );

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
        id: Date.now(),
        avatar: avatarUrl,
        apiKey: TEST_API_KEY,
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

const createFolderWithFiles = async (fileList: File[]): Promise<File[]> => {
  try {
    const timestamp = Date.now();
    const folderName = `agent_${timestamp}`;
    const dirFileList: File[] = [];

    const folderMetadata = {
      timestamp,
      files: fileList.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    };

    const folder = new Blob([JSON.stringify(folderMetadata)], {
      type: "application/x-directory",
    });

    const folderFile = new File([folder], folderName, {
      type: "application/x-directory",
      lastModified: timestamp,
    });
    dirFileList.push(folderFile);

    // add files to folder
    fileList.forEach((file) => {
      const newFile = new File([file], `${folderName}/${file.name}`, {
        type: file.type,
        lastModified: timestamp,
      });
      dirFileList.push(newFile);
    });

    return dirFileList;
  } catch (error) {
    console.error("Create folder error:", error);
    throw error;
  }
};
