import { useState } from "react";

export default function InputBox({ onSendMessage, isLoading }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full p-4 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask a question about this book..."
        disabled={isLoading}
        className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-800 disabled:bg-gray-100 disabled:text-gray-500 shadow-sm transition-all"
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {isLoading ? "Thinking..." : "Send"}
      </button>
    </form>
  );
}
