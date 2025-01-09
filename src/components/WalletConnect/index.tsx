import React from "react";
import { Button, Dropdown, message } from "antd";
import {
  WalletOutlined,
  DisconnectOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import type { MenuProps } from "antd";

interface WalletConnectProps {
  onDisconnect: () => void;
  loading: boolean;
}

const WalletConnect: React.FC<WalletConnectProps> = ({
  onDisconnect,
  loading,
}) => {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
    onError: (error) => {
      message.error(error.message);
    },
  });
  const { disconnect } = useDisconnect({
    onSuccess: () => {
      window.localStorage.removeItem("wagmi.connected");
      window.localStorage.removeItem("wagmi.injected.connected");
      onDisconnect();
      message.success("Wallet disconnected");
    },
  });

  // 
  const handleSwitchAccount = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not installed");
      }

      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

    } catch (error) {
      console.error("Failed to switch account:", error);
      message.error("Failed to switch account");
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const items: MenuProps["items"] = [
    {
      key: "switch",
      label: "Switch Account",
      icon: <SwapOutlined />,
      onClick: handleSwitchAccount,
    },
    {
      type: "divider",
    },
    {
      key: "disconnect",
      label: "Disconnect",
      icon: <DisconnectOutlined />,
      onClick: () => {
        disconnect();
      },
    },
  ];

  if (!isConnected || loading) {
    return (
      <Button
        className="wallet-connect-button"
        icon={<WalletOutlined />}
        onClick={() => connect()}
        loading={loading}
      >
        {loading ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <Dropdown menu={{ items }} trigger={["click"]}>
      <Button className="wallet-connect-button" icon={<WalletOutlined />}>
        {formatAddress(address as string)}
      </Button>
    </Dropdown>
  );
};

export default WalletConnect;
