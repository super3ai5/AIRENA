/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AI Agent Chat Interface Component
 * Provides a chat interface for interacting with AI agents
 */

import { Bubble, Sender, useXAgent, useXChat } from "@ant-design/x";
import { Avatar, Button, Modal, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import "./index.less";
import type { GetProp } from "antd";
import { sendMessage, getCurrentHistory } from "@/services/ai";
import chatIcon from "@/assets/images/chat.png";
import ReactMarkdown from "react-markdown";

// Default avatar URL for the AI agent
const AVATAR_URL =
  "https://ipfs.glitterprotocol.dev/ipfs/QmXHZS7nbVpsbe9iDurjUXEHeQ15txUdscukwh6gBopds9";

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

/**
 * Independent AI Agent Chat Component
 */
const Independent: React.FC = () => {
  const [content, setContent] = React.useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Get agent configuration
  const { avatar, name, functionDesc } = window?.aiData || DEFAULT_CONFIG;

  // Initialize chat with agent
  const { onRequest, messages, setMessages } = useXChat({ agent });

  // Load conversation history
  useEffect(() => {
    const loadHistory = async () => {
      const history = getCurrentHistory();
      if (history?.length === 0) {
        const updatedHistory = getCurrentHistory();
        const historyMessages = updatedHistory.map(
          (msg, index) =>
            ({
              id: `${index}`,
              message: msg.content,
              status: msg.role === "user" ? "local" : "success",
              role: msg.role === "user" ? "local" : "ai",
            } as MessageType)
        );
        setMessages(historyMessages as any);
      } else {
        const historyMessages = history.map(
          (msg, index) =>
            ({
              id: `${index}`,
              message: msg.content,
              status: msg.role === "user" ? "local" : "success",
              role: msg.role === "user" ? "local" : "ai",
            } as MessageType)
        );
        setMessages(historyMessages as any);
      }
    };

    loadHistory();
  }, [setMessages]);

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
        <Button
          type="primary"
          className="agent-details-btn"
          icon={<InfoCircleOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          View Details
        </Button>
      </div>
    </div>
  );

  //
  const CustomBubble = ({ content }: { content: string }) => (
    <div className="markdown-content">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );

  // Convert messages to bubble list items
  const items = messages.map(({ id, message, status }) => ({
    key: id,
    loading: status === "loading",
    role: status === "local" ? "local" : "ai",
    content: <CustomBubble content={message} />,
  }));

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
          <Bubble.List items={items} roles={roles} className="messages" />
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

      <Modal
        title="AI Agent Details"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
        centered
      >
        <div className="agent-details-modal">
          <div className="avatar-section">
            <Avatar src={window.aiData?.avatar || AVATAR_URL} size={100} />
            <h3 className="agent-name">{window.aiData?.name || "N/A"}</h3>
          </div>
          <div className="detail-item">
            <h4>Agent Intro:</h4>
            <p>{window.aiData?.functionDesc || "N/A"}</p>
          </div>
          <div className="detail-item">
            <h4>Agent Description Prompt:</h4>
            <p>{window.aiData?.behaviorDesc || "N/A"}</p>
          </div>
          <div className="detail-item">
            <h4>DID:</h4>
            <p>{window.aiData?.did || "N/A"}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Independent;
