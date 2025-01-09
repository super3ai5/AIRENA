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
  "JTE0JTA3RCUxQiUwNkglMDQlMUMlNURCWSU0MFZSWlUlMDJZWCU0MCUxMiUwM0clMUFJRiU1Qk0lMEIlMDUlMDlYJTAyWlpMRVdGJTE0JTE1QiU1REMlMEUlMDFYJTBFUFklNUNCJTQwUSUxMSUxQiUxNUNaJTEwJTVDJTAwJTBEVVElMEElNUQlMTBFJTAxJTQwJTFGJTE0"
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
    "X-Title": "AIWS",
  },
});

/**
 * Remove quotes from start and end of text
 */
const removeQuotes = (text: string): string => {
  return text.replace(/^["'""]|["'""]$/g, "").trim();
};

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
    // Initialize new conversation
    if (history.length === 0 && window.aiData?.behaviorDesc) {
      // Add system message with AI behavior description
      history.push({
        role: "system",
        content: window.aiData.behaviorDesc,
      });
    }

    history.push({ role: "user", content: message });

    // Call API to get response
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: history,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices?.[0]?.message?.content;
    if (!response) {
      throw new Error("Invalid response from AI");
    }

    // Remove quotes from response
    const cleanResponse = removeQuotes(response);
    history.push({ role: "assistant", content: cleanResponse });

    // Update conversation history
    conversationHistories[currentConversationId] = history;
    return cleanResponse;
  } catch (error) {
    console.error("Error sending message:", error);
    const errorMessage = "Sorry, an error occurred. Please try again later.";
    const history = conversationHistories[currentConversationId] || [];
    history.push({ role: "assistant", content: errorMessage });
    conversationHistories[currentConversationId] = history;
    return errorMessage;
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
