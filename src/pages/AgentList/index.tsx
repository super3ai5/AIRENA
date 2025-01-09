/**
 * AI Agents Marketplace component
 * Displays a list of AI agents and provides functionality to create new agents
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Avatar, Button, Table, Drawer, Space, message, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useConnect, useAccount, useDisconnect, useSignMessage } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import {
  PlusOutlined,
  WalletOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import Publish from "../Publish";
import "./index.less";
import axios from "axios";
import { AxiosError } from "axios";
import WalletConnect from "@/components/WalletConnect";
import logo from "@/assets/images/logo.jpg";

/**
 * Interface for AI Agent data
 */
interface Agent {
  id: string;
  name: string;
  avatar: string;
  description: string;
  did: string;
  ipfsHash?: string;
  address?: string;
}

/**
 * Interface for wallet connection errors
 */
interface ConnectError extends Error {
  message: string;
}

// Constants for local storage and authentication
const STORAGE_KEY = "glitter_agents";
const AUTH_API = "https://api.social.glitterprotocol.app/v1/login_or_register";

/**
 * Retrieve agents from local storage
 * @returns Array of stored agents
 */
const getLocalAgents = (): Agent[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Failed to load agents:", err);
    return [];
  }
};

/**
 * Save agents to local storage
 * @param agents Array of agents to save
 */
const saveLocalAgents = (agents: Agent[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  } catch (err) {
    console.error("Failed to save agents:", err);
    message.error("Failed to save agent");
  }
};

/**
 * Create authentication message with timestamp
 * @param address Wallet address
 * @returns Message and timestamp
 */
const createMessage = (address: string) => {
  const timestamp = Math.floor(new Date().getTime() / 1000);
  return {
    msg: `Message:\n\nupload and deploy project\n\nWallet address:\n${address}\n\nNonce:\n${timestamp}\n`,
    timestamp,
  };
};

/**
 * Main AgentList component
 */
const AgentList: React.FC = () => {
  // State management
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [signing, setSigning] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(getLocalAgents());

  // Wallet connection hooks
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
    onError(error: ConnectError) {
      message.error("Failed to connect wallet: " + error.message);
      setConnecting(false);
    },
  });
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  /**
   * Sign message using wallet
   * @param msg Message to sign
   * @returns Signed message or null if failed
   */
  const signMessage = useCallback(
    async (msg: string) => {
      if (signing) return null;
      try {
        setSigning(true);
        return await signMessageAsync({ message: msg });
      } catch (err) {
        console.error("Sign message error:", err);
        disconnect();
        throw new Error("Failed to sign message");
      } finally {
        setSigning(false);
      }
    },
    [signMessageAsync, signing, disconnect]
  );

  /**
   * Handle user login
   * @param address Wallet address
   * @returns Authentication token or undefined if failed
   */
  const handleLogin = useCallback(
    async (address: string) => {
      if (loading || signing) return;
      try {
        setLoading(true);
        const { msg } = createMessage(address);
        const signature = await signMessage(msg);

        if (!signature) return;

        const response = await axios.post(AUTH_API, {
          address,
          msg,
          sign: signature,
        });

        if (response.data?.data?.Token) {
          localStorage.setItem(
            "Authentication-Tokens",
            response.data.data.Token
          );
          localStorage.setItem("Token_address", address);
          return response.data.data.Token;
        }

        throw new Error("Login failed");
      } catch (err) {
        const error = err as Error | AxiosError;
        if (!error.message.includes("User rejected")) {
          console.error("Login error:", error);
          message.error(
            `Login failed: ${
              error instanceof AxiosError
                ? error.response?.data?.message || error.message
                : error.message
            }`
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [signMessage, loading, signing]
  );

  /**
   * Handle wallet connection
   */
  const handleConnect = async () => {
    if (connecting) return;
    try {
      setConnecting(true);
      if (typeof window.ethereum === "undefined") {
        window.open("https://metamask.io/download/", "_blank");
        return;
      }
      await connect();
    } catch (err) {
      console.error("Connect error:", err);
      message.error("Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Initialize login on component mount
   */
  useEffect(() => {
    let mounted = true;
    let loginAttempted = false;

    const initLogin = async () => {
      if (loginAttempted) return;
      loginAttempted = true;

      const storedToken = localStorage.getItem("Authentication-Tokens");
      const storedAddress = localStorage.getItem("Token_address");

      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (!accounts || accounts.length === 0) {
            localStorage.removeItem("Authentication-Tokens");
            localStorage.removeItem("Token_address");
            return;
          }
        }

        if (storedToken && storedAddress && !isConnected) {
          if (mounted) {
            await connect();
          }
          return;
        }

        if (isConnected && address && address !== storedAddress && mounted) {
          const token = await handleLogin(address);
          if (token) {
            const localAgents = getLocalAgents();
            setAgents(localAgents);
            message.success("Connected successfully");
          }
        }
      } catch (err) {
        const error = err as Error;
        if (error.message.toLowerCase().includes("wallet_requestPermissions")) {
          return;
        }
        if (mounted) {
          message.error("Failed to login: " + error.message);
          localStorage.removeItem("Authentication-Tokens");
          localStorage.removeItem("Token_address");
        }
      }
    };

    if (!loading && !signing) {
      initLogin();
    }

    return () => {
      mounted = false;
    };
  }, [isConnected, address, connect, handleLogin, loading, signing]);

  /**
   * Handle wallet disconnection
   */
  const handleDisconnect = () => {
    disconnect();
    localStorage.removeItem("Authentication-Tokens");
    localStorage.removeItem("Token_address");
    setAgents([]);
  };

  /**
   * Show publish drawer if wallet is connected
   */
  const showPublishDrawer = () => {
    if (!isConnected) {
      message.error("Please connect wallet first");
      return;
    }
    setDrawerOpen(true);
  };

  /**
   * Handle creation of new agent
   * @param agent New agent data
   */
  const handleCreateAgent = (agent: Agent) => {
    if (!address) {
      message.error("Please connect wallet first");
      return;
    }

    const agentWithAddress = {
      ...agent,
      address,
    };

    const updatedAgents = [...agents, agentWithAddress];
    setAgents(updatedAgents);
    saveLocalAgents(updatedAgents);
    setDrawerOpen(false);
  };

  const filteredAgents = agents
    .filter((agent) => !agent.address || agent.address === address)
    .sort((a, b) => b.id.localeCompare(a.id));

  const latestAgentsByDid = useMemo(() => {
    const groupedByDid = filteredAgents.reduce((acc, agent) => {
      if (!acc[agent.did]) {
        acc[agent.did] = agent;
      } else if (agent.id.localeCompare(acc[agent.did].id) > 0) {
        acc[agent.did] = agent;
      }
      return acc;
    }, {} as Record<string, Agent>);

    return groupedByDid;
  }, [filteredAgents]);

  /**
   * Open chat with selected agent
   * @param agentId IPFS hash of agent
   */
  const handleChat = (agent: Agent) => {
    const isLatest = latestAgentsByDid[agent.did]?.id === agent.id;
    const link = isLatest
      ? `https://${agent.did}.limo`
      : `https://ipfs.glitterprotocol.dev/ipfs/${agent.ipfsHash}`;
    window.open(link, "_blank");
  };

  /**
   * Table columns configuration
   */
  const columns: ColumnsType<Agent> = [
    {
      title: "Agent",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar} />
          <span>{record.name}</span>
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      render: () => <span className="model-tag">GPT-3.5-turbo</span>,
    },
    {
      title: "DID",
      dataIndex: "did",
      key: "did",
    },
    {
      title: "ipfsHash",
      dataIndex: "ipfsHash",
      key: "ipfsHash",
      render: (ipfsHash) => {
        return (
          <a
            href={`https://ipfs.glitterprotocol.dev/ipfs/${ipfsHash}`}
            target="_blank"
          >
            <Tooltip title={ipfsHash}>
              {ipfsHash.slice(0, 6)}...{ipfsHash.slice(-4)}
            </Tooltip>
          </a>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<MessageOutlined />}
          onClick={() => handleChat(record)}
        >
          Chat
        </Button>
      ),
    },
  ];

  return (
    <div className="agent-list">
      <div className="header">
        <div className="logo">
          <img width={48} height={48} src={logo} alt="" />
          <h1>AIWS</h1>
        </div>
        <Space>
          {isConnected && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showPublishDrawer}
            >
              Create Agent
            </Button>
          )}
          <WalletConnect loading={loading} onDisconnect={handleDisconnect} />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredAgents}
        rowKey="id"
        className="agent-table"
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          style: {
            margin: "16px 32px",
          },
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      <Drawer
        title="Create New AI Agent"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width="100%"
        styles={{
          body: {
            padding: 24,
            display: "flex",
            justifyContent: "center",
          },
        }}
      >
        {isConnected ? (
          <div style={{ maxWidth: 800, width: "100%" }}>
            <Publish onSuccess={handleCreateAgent} />
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p>Please connect your wallet first</p>
            <Button icon={<WalletOutlined />} onClick={handleConnect}>
              Connect Wallet
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AgentList;
