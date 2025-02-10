/**
 * AI Service Module
 */

import OpenAI from "openai";
import { decryptApiKey } from "@/utils";
import Cookies from "js-cookie";

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
    // Get token from cookies
    const token = Cookies.get("token");
    if (!token) {
      //throw new Error("No valid token available. Please connect your wallet.");
      console.error("No valid token available. Please connect your wallet.");
      return "No valid token available. Please connect your wallet."
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

    // Call backend API to get response https://irobot.run http://127.0.0.1:5013
    const response = await fetch("https://irobot.run/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: message,
        token: token,
      }),
    });

    const data = await response.json();

    const aiResponse = data.content;

    if (!aiResponse) {
      
      console.error("Invalid response from AI");
      return "Sorry, invalid response from AI. Please try again later."
    }

    // Remove quotes from response
    const cleanResponse = removeQuotes(aiResponse);
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
