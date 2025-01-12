/* eslint-disable @typescript-eslint/no-explicit-any */
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
      const charCode =
        decodedStr.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }

    return result;
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
};

interface IReadFileReturn {
  path: string;
  content: any;
}

export const readFileAsUint8Array = (file: any): Promise<IReadFileReturn> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const arrayBuffer = e.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      resolve({
        path: file.webkitRelativePath,
        content: uint8Array,
      });
    };
    reader.readAsArrayBuffer(file);
  });
