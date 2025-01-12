/* eslint-disable @typescript-eslint/no-explicit-any */
interface Window {
  ethereum?: any;
}
/**
 * Extend Window interface to include ethereum property
 */
declare global {
  interface Window {
    ethereum?: any;
  }
}
