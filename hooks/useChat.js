import { useState } from "react";

export default function useChat(bookContext = "") {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (input) => {
    setIsLoading(true);
    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: "user", text: input }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input, context: bookContext }),
      });

      const data = await res.json();

      setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: "ai", text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading };
}