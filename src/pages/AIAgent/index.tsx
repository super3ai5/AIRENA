import { Bubble, Sender, useXAgent, useXChat } from "@ant-design/x";
import { Avatar, Button, Modal, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import "./index.less";
import type { GetProp } from "antd";
import { sendMessage, getCurrentHistory } from "@/services/ai";
import chatIcon from "@/assets/images/chat.png";
import ReactMarkdown from "react-markdown";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import Cookies from "js-cookie";

// Default avatar URL for the AI agent
const AVATAR_URL = "https://ipfs.glitterprotocol.dev/ipfs/QmXHZS7nbVpsbe9iDurjUXEHeQ15txUdscukwh6gBopds9";

// Default configuration for AI Assistant
const DEFAULT_CONFIG = {
  avatar: AVATAR_URL,
  name: "On-Chain Hacker -Nova",
  functionDesc:
    "A tech-savvy blockchain expert skilled in smart contracts and security.Nova is precise,logical, and always reliable.",
  model: "gpt-3.5-turbo",
  did: "N/A",
  id: "0",
};

/**
 * Chat bubble styling configuration
 */
const roles: GetProp<typeof Bubble.List, "roles"> = {
  ai: {
    placement: "start",
    typing: { step: 5, interval: 20 },
    styles: {
      content: {
        borderRadius: 16,
      },
    },
    avatar: {
      src: window?.aiData?.avatar || AVATAR_URL,
    },
  },
  local: {
    placement: "end",
    variant: "shadow",
    styles: {
      content: {
        borderRadius: 16,
      },
    },
  },
};

type MessageType = GetProp<typeof Bubble.List, "items">[number];

const Independent: React.FC = () => {
  const [content, setContent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!Cookies.get("token"));
  const [walletAddress, setWalletAddress] = useState<string | null>(Cookies.get("walletAddress") || null);

  // Initialize AI agent with message handling
  const [agent] = useXAgent({
    request: async ({ message }, { onSuccess }) => {
      try {
        const response = await sendMessage(message || "");
        onSuccess(response || "");
      } catch (error) {
        console.error("Error:", error);
        onSuccess("Sorry, an error occurred. Please try again later.");
      }
    },
  });

  // Initialize chat with agent
  const { onRequest, messages, setMessages } = useXChat({ agent });

  // Helper function to add system message to the chat
  const addSystemMessage = (message: string) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: `${Date.now()}`, message, status: "success", role: "ai" },
    ]);
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkLoginState = () => {
      const token = Cookies.get("token");
      const savedWalletAddress = Cookies.get("walletAddress");

      if (token && savedWalletAddress) {
        setIsLoggedIn(true);
        setWalletAddress(savedWalletAddress);
        console.log("Restored login state:", { token, savedWalletAddress });
      } else {
        setIsLoggedIn(false);
        setWalletAddress(null);
        console.log("No valid login state found");
      }
    };

    // Check on mount
    checkLoginState();

    // Add event listener for window focus
    window.addEventListener('focus', checkLoginState);

    // Cleanup
    return () => {
      window.removeEventListener('focus', checkLoginState);
    };

  }, []);

  const getInviteId = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("invite") || "0";
  };
// 添加切换到 BSC 链的函数
const switchToBSCChain = async (provider: any) => {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x38' }], // BSC Mainnet chainId
    });
  } catch (switchError: any) {
    // 如果用户没有添加 BSC 网络，则添加
    if (switchError.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x38',
            chainName: 'Binance Smart Chain',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18
            },
            rpcUrls: ['https://bsc-dataseed1.binance.org'],
            blockExplorerUrls: ['https://bscscan.com']
          }]
        });
      } catch (addError) {
        console.error('Error adding BSC chain:', addError);
      }
    }
  }
};
  // Handle wallet connection and token generation
  const handleWalletConnect = async () => {
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      await switchToBSCChain(connection);

      const signer = provider.getSigner();
      const walletAddress = await signer.getAddress();
      const inviteId = getInviteId();

      setWalletAddress(walletAddress);

      // Avoid sending requests if already logged in
      if (isLoggedIn) {
        console.log("Already logged in. Skipping request to backend.");
        return;
      }

      // Send POST request to the backend
      const response = await fetch("https://irobot.run/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress, inviteId }),
      });

      if (!response.ok) {
        setIsLoggedIn(false);
        addSystemMessage("Not connect the server, please try again.");
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      const token = data.token;
      const introduce = data.introduce;

      if (!token) {
        setIsLoggedIn(false);
        addSystemMessage("Not connect the server, please try again.");
        throw new Error("No token received from backend.");
      }

      // Store wallet address and token in cookies
      Cookies.set("walletAddress", walletAddress, { expires: 180 });
      Cookies.set("token", token, { expires: 180 });

      console.log("Wallet connected and token stored successfully!");
      setIsLoggedIn(true);

      // If introduce is not empty, display it in the chat
      if (introduce && introduce.trim() !== "") {
        addSystemMessage(introduce);
      }
    } catch (error) {
      setIsLoggedIn(false);
      addSystemMessage("Not connect the server, please try again.");
      console.error("Error connecting wallet:", error);
    }
  };
  const handleWalletDisconnect = async () => {
    try {
      Cookies.remove("walletAddress");
      Cookies.remove("token");
      setIsLoggedIn(false);
      setWalletAddress(null);
      console.log("Wallet disconnected, cookies cleared.");
      const web3Modal = new Web3Modal();
      web3Modal.clearCachedProvider();
      if (window.ethereum && window.ethereum.disconnect) {
        await window.ethereum.disconnect();
      }
      console.log("Wallet disconnected successfully");

    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };
  const { avatar, name, functionDesc } = window?.aiData || DEFAULT_CONFIG;

  // Handle message submission
  const onSubmit = (nextContent: string) => {
    if (!nextContent) return;
    onRequest(nextContent);
    setContent("");
  };



  // Header component
  const headerNode = (
    <div className="agent-header">
      <div className="agent-info">
        <Avatar src={avatar} size={132} />
        <div className="agent-details">
          <h2 className="agent-name">{name}</h2>
          <Tooltip title={functionDesc}>
            <p className="agent-desc">{functionDesc}</p>
          </Tooltip>
        </div>
        <div className="wallet-actions">
        <Button 
          className="agent-details-btn" 
          onClick={walletAddress ? handleWalletDisconnect : handleWalletConnect}
        >
          {isLoggedIn &&   walletAddress 
            ? `Disconnect: ${walletAddress.slice(0, 2)}...${walletAddress.slice(-3)}` 
            : "Connect MetaMask"}
        </Button>
      </div>
      </div>
    </div>
  );

  return (
    <div className="ai-agent-container">
      <div className="chat-container">
        {headerNode}
        <section className="chat-section">
          <div className="divider"></div>
          <div className="chat-title">
            <img width={24} height={24} src={chatIcon} alt="" />
            <span>Chat</span>
          </div>
        </section>
        <div className="chat-main">
          <Bubble.List items={messages.map(({ id, message, status }) => ({
            key: id,
            loading: status === "loading",
            role: status === "local" ? "local" : "ai",
            content: <div className="markdown-content"><ReactMarkdown>{message}</ReactMarkdown></div>,
          }))} roles={roles} className="messages" />
          <Sender
            value={content}
            onSubmit={onSubmit}
            onChange={setContent}
            placeholder="Ask me anything"
            loading={agent.isRequesting()}
            className="sender"
          />
        </div>
      </div>
    </div>
  );
};

export default Independent;
