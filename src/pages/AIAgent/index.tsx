/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AI Agent Chat Interface Component
 * Provides a chat interface for interacting with AI agents
 */

import { Bubble, Sender, useXAgent, useXChat } from "@ant-design/x";
import React, { useEffect } from "react";
import "./index.less";
import type { GetProp } from "antd";
import { sendMessage, getCurrentHistory } from "@/services/ai";
import chatIcon from "@/assets/images/chat.png";

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
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
    const history = getCurrentHistory();
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
        <img src={avatar} className="agent-avatar" alt="agent avatar" />
        <div className="agent-details">
          <h2 className="agent-name">{name}</h2>
          <p className="agent-desc">{functionDesc}</p>
        </div>
      </div>
    </div>
  );

  // Convert messages to bubble list items
  const items = messages.map(({ id, message, status }) => ({
    key: id,
    loading: status === "loading",
    role: status === "local" ? "local" : "ai",
    content: message,
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
            loading={agent.isRequesting()}
            className="sender"
          />
        </div>
      </div>
    </div>
  );
};

export default Independent;
