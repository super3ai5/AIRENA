/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * AI Agent Publication Component
 * Allows users to create and publish new AI agents
 */

import React, { useState } from "react";
import {
  Form,
  Input,
  Upload,
  Button,
  message,
  Select,
  Spin,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { RcFile } from "antd/es/upload/interface";
import { ethers } from "ethers";
import "./index.less";
import { uploadToIPFSByContract } from "@/services/upload";
import { setEnsRecord, getAllOwnedENSDomains } from "@/services/ens";
import { ENetwork } from "@/services/network";
import { useAccount } from "wagmi";

const { TextArea } = Input;

/**
 * Form values interface for agent creation
 */
interface FormValues {
  name: string;
  functionDesc: string;
  behaviorDesc: string;
  did: string;
}

/**
 * Props interface for Publish component
 */
interface PublishProps {
  onSuccess: () => void;
}

const STEPS = {
  PREPARING: "Preparing files...",
  UPLOADING_AVATAR: "Uploading avatar...",
  CREATING_AGENT: "Creating Agent...",
  UPLOADING_FILES: "Uploading files...",
  CONFIRMING: "Confirming transaction...",
  COMPLETED: "Completed!",
};

/**
 * Publish component for creating new AI agents
 */
const Publish: React.FC<PublishProps> = ({ onSuccess }) => {
  // Form and state management
  const [form] = Form.useForm<FormValues>();
  const [avatarFile, setAvatarFile] = useState<RcFile>();
  const [submitting, setSubmitting] = React.useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const { address } = useAccount();
  const [ensDomains, setEnsDomains] = React.useState<string[]>([]);
  const [loadingDomains, setLoadingDomains] = React.useState(false);
  const [imageUrl, setImageUrl] = useState<string>();

  /**
   * Validate and upload avatar before adding to form
   */
  const beforeUpload = (file: RcFile): boolean => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG files!");
      return false;
    }

    const isLt1M = file.size / 1024 / 1024 < 1;
    if (!isLt1M) {
      message.error("Image must be smaller than 1MB!");
      return false;
    }

    setAvatarFile(file);
    getBase64(file, setImageUrl);
    return false;
  };

  const onFinish = async (values: FormValues) => {
    try {
      setSubmitting(true);
      setCurrentStep(STEPS.PREPARING);

      if (!avatarFile) {
        message.error("Please upload an avatar!");
        return;
      }

      const data = {
        name: values.name,
        avatar: avatarFile,
        functionDesc: values.functionDesc,
        behaviorDesc: values.behaviorDesc,
        did: values.did,
      };

      setCurrentStep(STEPS.CREATING_AGENT);
      const { htmlHash } = await uploadToIPFSByContract(data);

      setCurrentStep(STEPS.UPLOADING_FILES);
      // Set ENS records if DID is an ENS domain
      try {
        const chainId = ethers.BigNumber.from(
          window.ethereum?.chainId
        ).toNumber();
        if (chainId === ENetwork.Ethereum) {
          await setEnsRecord(values.did, htmlHash);
          message.success("ENS records updated successfully");
        }
      } catch (error: any) {
        console.error("Failed to set ENS records:", error);
        if (error instanceof Error) {
          message.error(`Failed to update ENS records: ${error.message}`);
        } else {
          message.error("Failed to update ENS records");
        }
        // Return early if ENS binding fails
        return;
      }

      onSuccess();
      message.success("Agent created successfully");
      form.resetFields();
      setAvatarFile(undefined);
      setImageUrl(undefined);
      setCurrentStep("");
    } catch (error) {
      console.error("Error creating agent:", error);
      message.error("Failed to create agent");
      setCurrentStep("");
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
    setAvatarFile(undefined);
    setImageUrl(undefined);
    setLoadingDomains(false);
  };

  const uploadButton = (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const getBase64 = (img: RcFile, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result as string));
    reader.readAsDataURL(img);
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
          <Input
            autoComplete="off"
            placeholder="Enter Agent Name"
            maxLength={50}
            showCount
          />
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
            {imageUrl ? (
              <img src={imageUrl} alt="avatar" style={{ width: "100%" }} />
            ) : (
              uploadButton
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
            {submitting ? currentStep || "Creating..." : "Create"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Publish;
