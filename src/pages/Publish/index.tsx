/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * AI Agent Publication Component
 * Allows users to create and publish new AI agents
 */

import React from "react";
import { Form, Input, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import type { RcFile, UploadChangeParam } from "antd/es/upload";
import "./index.less";
import { uploadToIPFS, generateHTML, uploadAvatar } from "@/services/upload";
import { setEnsRecord } from "@/services/ens";

const { TextArea } = Input;

/**
 * Extended UploadFile interface with IPFS hash
 */
interface CustomUploadFile extends Omit<UploadFile, "originFileObj"> {
  ipfsHash?: string;
}

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
  const [avatar, setAvatar] = React.useState<CustomUploadFile[]>([]);
  const [avatarHash, setAvatarHash] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  /**
   * Handle avatar upload changes
   */
  const handleChange = (info: UploadChangeParam<UploadFile>) => {
    const fileList = info.fileList.map((file) => ({
      ...file,
      ipfsHash: (file as CustomUploadFile).ipfsHash,
    })) as CustomUploadFile[];

    setAvatar(fileList);
    if (fileList.length === 0) {
      form.setFieldsValue({ avatar: undefined });
    }
  };

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

      // Update form with new avatar
      const newAvatar = {
        uid: "-1",
        name: file.name,
        status: "done",
        url: `https://ipfs.glitterprotocol.dev/ipfs/${ipfsHash}`,
        ipfsHash,
      } as CustomUploadFile;

      setAvatar([newAvatar]);
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
        ipfsHash,
      };

      onSuccess(agent);
      message.success("Agent created successfully");
      form.resetFields();
      setAvatar([]);
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

  return (
    <div className="publish-container">
      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
      >
        <Form.Item
          label="Agent Name"
          name="name"
          rules={[{ required: true, message: "Please input Agent Name!" }]}
        >
          <Input placeholder="Enter Agent Name" />
        </Form.Item>

        <Form.Item
          label="Avatar"
          name="avatar"
          rules={[{ required: true, message: "Please upload avatar!" }]}
        >
          <Upload
            listType="picture-card"
            fileList={avatar}
            onChange={handleChange}
            beforeUpload={beforeUpload}
            maxCount={1}
          >
            {avatar.length === 0 && (
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
          rules={[{ required: true, message: "Please input Agent Intro!" }]}
        >
          <TextArea
            placeholder="Provide a brief introduction for the AI agent here"
            autoSize={{ minRows: 3, maxRows: 6 }}
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
          rules={[{ required: true, message: "Please input DID!" }]}
        >
          <Input placeholder="Enter DID or ENS name" />
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
