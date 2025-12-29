import { useState } from "react";
import { orderService } from "../app/services/orderService";
import { useEffect } from "react";

export function useOrderchat(orderId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const response = await orderService.getChatMessages(orderId);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error("Failed to fetch chat messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [orderId]);

  const sendMessage = async (messageData, attachmentUrl = null) => {
    try {
      setSending(true);
      const response = await orderService.sendChatMessage(orderId, {
        message: messageData,
        attachmentUrl,
      });
      // Append the new message to the list immediately
      if (response.data && response.data.message) {
         setMessages((prevMessages) => [...prevMessages, response.data.message]);
      } else {
         // Fallback just in case structure differs
         fetchMessages();
      }
      return response;
    } catch (err) {
      console.error("Failed to send chat message:", err);
      throw err; 
    } finally {
      setSending(false);
    }
  };
  
  return { messages, loading, sending, sendMessage, refetch: fetchMessages };
}
