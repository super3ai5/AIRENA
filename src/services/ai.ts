/**
 * AI Service Module
 */

import OpenAI from "openai";
import { decryptApiKey } from "./upload";

/**
 * Declare global window.aiData type
 */
declare global {
  interface Window {
    aiData: {
      name: string; // AI name
      functionDesc: string; // Function description
      behaviorDesc: string; // Behavior description
      model: string; // Model used
      did: string; // Device ID
      id: string; // AI ID
      avatar: string; // Avatar
      apiKey: string; // API key
      testKey: string; // Test key
    };
  }
}

/**
 * Decrypt and get API key
 */
export const API_KEY = decryptApiKey(
  "JTE0JTA3RCUxQiUwNkglMDQlMUMlNUQlMTFWRSUwRFIlMDklMEElNUVVJTVDTCUxNiUwMSUxNCUxREElMTMlNUQlNDBXJTA2JTBFJTVFViU1RCUwREYlMTZUQkklMTNFVkMlNUVTJTBDWl9VJTBBTEYlMDdGJTFDRkFWJTEyJTVEWlklMERTJTVFX0FGJTAzJTQwJTE0QQ=="
);

/**
 * Initialize OpenAI client
 */
export const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1", // OpenRouter API URL
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true, // Allow usage in browser
  defaultHeaders: {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Bearer ${API_KEY}`,
    "HTTP-Referer": window.location.origin,
    "X-Title": "Glitter AI Agent",
  },
});

/**
 * Send message to AI and get response
 * @param message User's message
 * @returns AI's response content
 */
export const sendMessage = async (message: string) => {
  try {
    const apiKey = API_KEY;
    if (!apiKey) {
      throw new Error("No valid API key available");
    }

    // Get current conversation history
    const history = conversationHistories[currentConversationId] || [];

    // Add system message if new conversation and behavior description exists
    if (history.length === 0 && window.aiData?.behaviorDesc) {
      history.push({
        role: "system",
        content: window.aiData.behaviorDesc,
      });
    }

    // Add user message to history
    history.push({ role: "user", content: message });

    // Call API to get AI response
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: history,
      temperature: 0.7, // Control response randomness
      max_tokens: 1000, // Limit maximum response length
    });

    // Get AI response content
    const response = completion.choices[0].message.content;
    if (response) {
      // Add AI response to history
      history.push({ role: "assistant", content: response });
    }

    // Update conversation history
    conversationHistories[currentConversationId] = history;
    return response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

/**
 * Store all conversation histories
 */
const conversationHistories: Record<
  string,
  Array<{ role: "system" | "user" | "assistant"; content: string }>
> = {};

/**
 * Current conversation ID
 */
let currentConversationId = "0";

/**
 * Set current active conversation
 * @param conversationId Conversation ID
 */
export const setCurrentConversation = (conversationId: string) => {
  currentConversationId = conversationId;
  // Initialize history if new conversation
  if (!conversationHistories[conversationId]) {
    conversationHistories[conversationId] = [];
    if (window.aiData?.behaviorDesc) {
      conversationHistories[conversationId].push({
        role: "system",
        content: window.aiData.behaviorDesc,
      });
    }
  }
};

/**
 * Clear current conversation history
 */
export const clearHistory = () => {
  conversationHistories[currentConversationId] = [];
};

/**
 * Clear all conversation histories
 */
export const clearAllHistory = () => {
  Object.keys(conversationHistories).forEach((key) => {
    conversationHistories[key] = [];
  });
};

/**
 * Get current conversation history (excluding system messages)
 * @returns Current conversation history array
 */
export const getCurrentHistory = () => {
  const history = conversationHistories[currentConversationId] || [];

  return history.filter((msg) => msg.role !== "system");
};
