/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * AI Agent Publication Component
 * Allows users to create and publish new AI agents
 */

import React from "react";
import { Form, Input, Upload, Button, message, Select, Spin } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { RcFile } from "antd/es/upload";
import "./index.less";
import { uploadToIPFS, generateHTML, uploadAvatar } from "@/services/upload";
import { setEnsRecord, getAllOwnedENSDomains } from "@/services/ens";
import { useAccount } from "wagmi";

const { TextArea } = Input;

/**
 * Form values interface for agent creation
 */
interface FormValues {
  name: string;
  avatar?: string;
  functionDesc: string;
  behaviorDesc: string;
  did: string;
}

/**
 * Agent data interface
 */
interface Agent {
  id: string;
  name: string;
  avatar: string;
  description: string;
  did: string;
  ipfsHash: string;
  address: string;
}

/**
 * Props interface for Publish component
 */
interface PublishProps {
  onSuccess: (agent: Agent) => void;
}

/**
 * Publish component for creating new AI agents
 */
const Publish: React.FC<PublishProps> = ({ onSuccess }) => {
  // Form and state management
  const [form] = Form.useForm<FormValues>();
  const [avatarHash, setAvatarHash] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const { address } = useAccount();
  const [ensDomains, setEnsDomains] = React.useState<string[]>([]);
  const [loadingDomains, setLoadingDomains] = React.useState(false);

  /**
   * Validate and upload avatar before adding to form
   */
  const beforeUpload = async (file: RcFile): Promise<boolean> => {
    try {
      // Validate file type
      const isJpgOrPng =
        file.type === "image/jpeg" || file.type === "image/png";
      if (!isJpgOrPng) {
        message.error("You can only upload JPG/PNG files!");
        return false;
      }

      // Validate file size
      const isLt1M = file.size / 1024 / 1024 < 1;
      if (!isLt1M) {
        message.error("Image must be smaller than 1MB!");
        return false;
      }

      // Upload to IPFS
      const ipfsHash = await uploadAvatar(file);
      setAvatarHash(ipfsHash);
      form.setFieldsValue({ avatar: ipfsHash });
      await form.validateFields(["avatar"]);

      return false;
    } catch (err) {
      const error = err as Error;
      message.error("Upload failed, please try again");
      console.error("Upload error:", error.message);
      return false;
    }
  };

  /**
   * Handle form submission and agent creation
   */
  const onFinish = async (values: FormValues) => {
    try {
      setSubmitting(true);
      if (!address) {
        message.error("Please connect wallet first");
        return;
      }

      // Generate HTML content
      const htmlContent = generateHTML({
        name: values.name,
        avatar: avatarHash,
        functionDesc: values.functionDesc,
        behaviorDesc: values.behaviorDesc,
        did: values.did,
      });

      // Upload HTML to IPFS
      const ipfsHash = await uploadToIPFS(htmlContent);
      console.log(ipfsHash, "ipfsHash");
      console.log(values.did, "values.did");

      // Set ENS records if DID is an ENS domain
      try {
        await setEnsRecord(values.did, ipfsHash);
        message.success("ENS records updated successfully");
      } catch (error) {
        console.error("Failed to set ENS records:", error);
        if (error instanceof Error) {
          message.error(`Failed to update ENS records: ${error.message}`);
        } else {
          message.error("Failed to update ENS records");
        }
        // Return early if ENS binding fails
        return;
      }

      // Create Agent object
      const agent: Agent = {
        id: ipfsHash,
        name: values.name,
        avatar: avatarHash
          ? `https://ipfs.glitterprotocol.dev/ipfs/${avatarHash}`
          : "",
        description: values.functionDesc,
        did: values.did,
        address: address || "",
        ipfsHash,
      };

      onSuccess(agent);
      message.success("Agent created successfully");
      form.resetFields();
      setAvatarHash("");
    } catch (error) {
      console.error("Error creating agent:", error);
      if (error instanceof Error) {
        message.error(`Failed to create agent: ${error.message}`);
      } else {
        message.error("Failed to create agent");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Fetch ENS domains on component mount
   */
  React.useEffect(() => {
    const fetchENSDomains = async () => {
      console.log(address, "address");
      if (!address) return;

      try {
        setLoadingDomains(true);
        const ownedNames = await getAllOwnedENSDomains(address);
        console.log(ownedNames, "ownedNames");
        if (ownedNames.length > 0) {
          setEnsDomains(ownedNames);
        }
      } catch (error) {
        console.error("Failed to fetch ENS domains:", error);
        message.error("Failed to load ENS domains. Please try again later.");
      } finally {
        setLoadingDomains(false);
      }
    };

    fetchENSDomains();
  }, [address]);

  const handleReset = () => {
    form.resetFields();
    setAvatarHash("");
    setLoadingDomains(false);
  };

  return (
    <div className="publish-container">
      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
        onReset={handleReset}
      >
        <Form.Item
          label="Agent Name"
          name="name"
          rules={[
            { required: true, message: "Please input Agent Name!" },
            { max: 50, message: "Agent Name cannot exceed 50 characters!" },
          ]}
        >
          <Input placeholder="Enter Agent Name" maxLength={50} showCount />
        </Form.Item>

        <Form.Item
          label="Avatar"
          name="avatar"
          rules={[{ required: true, message: "Please upload avatar!" }]}
        >
          <Upload
            listType="picture-card"
            showUploadList={false}
            beforeUpload={beforeUpload}
          >
            {avatarHash ? (
              <img
                src={`https://ipfs.glitterprotocol.dev/ipfs/${avatarHash}`}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item
          label="Agent Intro"
          name="functionDesc"
          rules={[
            { required: true, message: "Please input Agent Intro!" },
            { max: 150, message: "Agent Intro cannot exceed 150 characters!" },
          ]}
        >
          <TextArea
            placeholder="Provide a brief introduction for the AI agent here"
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={150}
            showCount
          />
        </Form.Item>

        <Form.Item
          label="Agent Description Prompt"
          name="behaviorDesc"
          rules={[
            {
              required: true,
              message: "Please input Agent Description Prompt!",
            },
          ]}
        >
          <TextArea
            placeholder="Provide the personality traits or characteristics for the AI agent here"
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>

        <Form.Item
          label="DID"
          name="did"
          rules={[{ required: true, message: "Please select an ENS domain!" }]}
        >
          <Select
            placeholder={
              address ? "Select your ENS domain" : "Please connect wallet first"
            }
            loading={loadingDomains}
            notFoundContent={
              loadingDomains ? (
                <Spin size="small" />
              ) : !address ? (
                "Please connect wallet first"
              ) : ensDomains.length === 0 ? (
                "No ENS domains found for this address"
              ) : null
            }
            disabled={!address}
            onDropdownVisibleChange={async (open) => {
              if (open && address) {
                try {
                  setLoadingDomains(true);
                  const domains = await getAllOwnedENSDomains(address);
                  if (domains.length > 0) {
                    setEnsDomains(domains);
                  }
                } catch (error) {
                  console.error("Failed to fetch ENS domains:", error);
                  message.error("Failed to load ENS domains");
                } finally {
                  setLoadingDomains(false);
                }
              }
            }}
          >
            {ensDomains.map((domain) => (
              <Select.Option key={domain} value={domain}>
                {domain}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            Create
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Publish;
