export default function Message({ role, text }) {
  const isUser = role === "user";
  
  return (
    <div className={`flex w-full mb-6 ${isUser ? "justify-end" : "justify-start"}`}>
      <div 
        className={`max-w-[85%] sm:max-w-[75%] px-5 py-4 rounded-2xl shadow-sm ${
          isUser 
            ? "bg-slate-900 text-white rounded-br-sm" 
            : "bg-white border border-gray-100 text-slate-800 rounded-bl-sm"
        }`}
      >
        {role === "ai" && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 text-[10px] font-bold">AI</span>
            </div>
            <span className="text-xs font-semibold text-slate-500">Reading Assistant</span>
          </div>
        )}
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
          {text}
        </div>
      </div>
    </div>
  );
}
