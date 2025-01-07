/**
 * AI Agent Chat Interface Component
 * Provides a chat interface for interacting with AI agents
 */

import {
  Attachments,
  Bubble,
  Conversations,
  Sender,
  Welcome,
  useXAgent,
  useXChat,
} from "@ant-design/x";
import React, { useEffect } from "react";
import "./index.less";

import {
  CloudUploadOutlined,
  EllipsisOutlined,
  PaperClipOutlined,
  PlusOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  type GetProp,
  Space,
  Typography,
  message,
  Avatar,
  Modal,
} from "antd";
import {
  sendMessage,
  setCurrentConversation,
  getCurrentHistory,
  API_KEY,
} from "@/services/ai";

// Default conversation list with initial chat option
const defaultConversationsItems = [
  {
    key: "0",
    label: "Start New Chat",
  },
];

// Default avatar URL for the AI agent
const AVATAR_URL =
  "https://ipfs.glitterprotocol.dev/ipfs/QmXHZS7nbVpsbe9iDurjUXEHeQ15txUdscukwh6gBopds9";

// Default configuration for Glitter AI Assistant
const GLITTER_CONFIG = {
  avatar: AVATAR_URL,
  name: "Glitter AI Assistant",
  functionDesc: "Your intelligent assistant",
  behaviorDesc: "",
  model: "gpt-3.5-turbo",
  did: "N/A",
  id: "0",
  apiKey: API_KEY,
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
  },
  local: {
    placement: "end",
    variant: "shadow",
  },
};

const { Paragraph } = Typography;

/**
 * Independent AI Agent Chat Component
 */
const Independent: React.FC = () => {
  // State management
  const [headerOpen, setHeaderOpen] = React.useState(false);
  const [content, setContent] = React.useState("");
  const [conversationsItems, setConversationsItems] = React.useState(
    defaultConversationsItems
  );
  const [activeKey, setActiveKey] = React.useState(
    defaultConversationsItems[0].key
  );
  const [attachedFiles, setAttachedFiles] = React.useState<
    GetProp<typeof Attachments, "items">
  >([]);
  const [isModalVisible, setIsModalVisible] = React.useState(false);

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

  // Get agent configuration from window or use default
  const { avatar, name, functionDesc, behaviorDesc, did, id } =
    window?.aiData || GLITTER_CONFIG;

  // Initialize chat with agent
  const { onRequest, messages, setMessages } = useXChat({
    agent,
  });

  /**
   * Load conversation history when active conversation changes
   */
  useEffect(() => {
    if (activeKey !== undefined) {
      setCurrentConversation(activeKey);
      const history = getCurrentHistory();
      const historyMessages = history.map(
        (msg, index) =>
          ({
            id: `${index}`,
            message: msg.content,
            status: msg.role === "user" ? "local" : "success",
          } as const)
      );
      setMessages(historyMessages);
    }
  }, [activeKey, setMessages]);

  /**
   * Handle message submission
   */
  const onSubmit = (nextContent: string) => {
    if (!nextContent) return;
    onRequest(nextContent);
    setContent("");
  };

  /**
   * Add new conversation to the list
   */
  const onAddConversation = () => {
    setConversationsItems([
      ...conversationsItems,
      {
        key: `${conversationsItems.length}`,
        label: `New Conversation ${conversationsItems.length}`,
      },
    ]);
    setActiveKey(`${conversationsItems.length}`);
  };

  /**
   * Handle conversation selection
   */
  const onConversationClick: GetProp<typeof Conversations, "onActiveChange"> = (
    key
  ) => {
    if (key !== activeKey) {
      setActiveKey(key);
    }
  };

  /**
   * Handle file attachment changes
   */
  const handleFileChange: GetProp<typeof Attachments, "onChange"> = (info) =>
    setAttachedFiles(info.fileList);

  /**
   * Modal visibility handlers
   */
  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  /**
   * Copy text to clipboard
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success("Copied to clipboard");
    } catch (err: any) {
      message.error("Failed to copy", err);
    }
  };

  /**
   * Render data item with optional copy functionality
   */
  const renderDataItem = (label: string, value: string, isSecret = false) => (
    <div style={{ marginBottom: 16 }}>
      <Typography.Text strong>{label}: </Typography.Text>
      <Paragraph
        style={{ marginTop: 4 }}
        copyable={
          isSecret
            ? {
                icon: <CopyOutlined />,
                text: value,
                tooltips: ["Copy", "Copied!"],
                onCopy: () => copyToClipboard(value),
              }
            : false
        }
      >
        {isSecret ? "********" : value}
      </Paragraph>
    </div>
  );

  /**
   * Show agent information modal
   */
  const onMore = () => {
    showModal();
  };

  /**
   * Welcome placeholder for empty chat
   */
  const placeholderNode = (
    <Space
      direction="vertical"
      style={{ width: "100%" }}
      size={16}
      className="placeholder"
    >
      <Welcome
        variant="borderless"
        icon={avatar}
        title={name}
        description={functionDesc}
        extra={
          <Space>
            <Button onClick={onMore} icon={<EllipsisOutlined />} />
          </Space>
        }
      />
    </Space>
  );

  // Convert messages to bubble list items
  const items: GetProp<typeof Bubble.List, "items"> = messages.map(
    ({ id, message, status }) => ({
      key: id,
      loading: status === "loading",
      role: status === "local" ? "local" : "ai",
      content: message,
    })
  );

  // UI Components
  const attachmentsNode = (
    <Badge dot={attachedFiles.length > 0 && !headerOpen}>
      <Button
        type="text"
        icon={<PaperClipOutlined />}
        onClick={() => setHeaderOpen(!headerOpen)}
      />
    </Badge>
  );

  const senderHeader = (
    <Sender.Header
      title="Attachments"
      open={headerOpen}
      onOpenChange={setHeaderOpen}
      styles={{
        content: {
          padding: 0,
        },
      }}
    >
      <Attachments
        beforeUpload={() => false}
        items={attachedFiles}
        onChange={handleFileChange}
        placeholder={(type) =>
          type === "drop"
            ? { title: "Drop file here" }
            : {
                icon: <CloudUploadOutlined />,
                title: "Upload files",
                description: "Click or drag files to this area to upload",
              }
        }
      />
    </Sender.Header>
  );

  const logoNode = (
    <div className="logo">
      <img src={avatar} draggable={false} alt="logo" />
      <span>{name}</span>
    </div>
  );

  return (
    <>
      <div className="layout">
        <div className="menu">
          {logoNode}
          <Button
            onClick={onAddConversation}
            type="link"
            className="addBtn"
            icon={<PlusOutlined />}
          >
            New Conversation
          </Button>
          <Conversations
            items={conversationsItems}
            className="conversations"
            activeKey={activeKey}
            onActiveChange={onConversationClick}
          />
        </div>
        <div className="chat">
          <Bubble.List
            items={
              items.length > 0
                ? items
                : [{ content: placeholderNode, variant: "borderless" }]
            }
            roles={roles}
            className="messages"
          />
          <Sender
            value={content}
            header={senderHeader}
            onSubmit={onSubmit}
            onChange={setContent}
            prefix={attachmentsNode}
            loading={agent.isRequesting()}
            className="sender"
          />
        </div>
      </div>

      <Modal
        title="Agent Information"
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <div style={{ padding: "16px 0", height: "700px", overflowY: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Avatar size={100} src={avatar} />
            <Typography.Title level={4} style={{ marginTop: 16 }}>
              {name}
            </Typography.Title>
          </div>

          <div
            style={{
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Typography.Title level={5}>Basic Information</Typography.Title>
            {renderDataItem("Function Description", functionDesc)}
            {renderDataItem("Behavior Description", behaviorDesc)}
            {renderDataItem("Model", "gpt-3.5-turbo")}
            {renderDataItem("DID", did)}
            {renderDataItem("ID", id)}
          </div>

          <div
            style={{
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
            }}
          >
            <Typography.Title level={5}>Security Information</Typography.Title>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Independent;
