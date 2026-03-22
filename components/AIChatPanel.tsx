'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'

interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
}

export default function AIChatPanel() {
    const { aiChatPanelOpen, setAiChatPanelOpen, bookTitle } = useStore()

    const [input, setInput] = useState('')
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hello. I'm your reading assistant. Ask me anything about this book or its contents, and I'll do my best to help you.",
        },
    ])
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const abortControllerRef = useRef<AbortController | null>(null) // Added correctly

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    // MEMORY OPTIMIZATION: Ensure we instantly terminate any running fetch stream
    // behind the scenes if the user closes the chat drawer completely.
    useEffect(() => {
        if (!aiChatPanelOpen && abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsTyping(false);
        }
    }, [aiChatPanelOpen])

    const handleSend = async () => {
        if (!input.trim()) return

        // Abort previous stream if the user rapidly sends a new message
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: input.trim(),
        }

        setMessages((prev) => [...prev, userMsg])
        setInput('')
        setIsTyping(true)

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                signal: abortControllerRef.current.signal, // Binding the fetch to the abort controller
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    userQuestion: userMsg.content,
                    selectedText: "No text highlighted", // You can update this later when highlighting is implemented
                    bookContext: `The user is reading a book titled "${bookTitle || 'Unknown'}". Please consider this context in your response.` 
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Server error");
            }

            const aiMsgId = crypto.randomUUID();
            setMessages((prev) => [...prev, {
                id: aiMsgId,
                role: 'assistant',
                content: ''
            }]);

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                let done = false;
                while (!done) {
                    const { value, done: doneReading } = await reader.read();
                    done = doneReading;
                    if (value) {
                        const chunk = decoder.decode(value, { stream: true });
                        setMessages((prev) => 
                            prev.map(msg => 
                                msg.id === aiMsgId ? { ...msg, content: msg.content + chunk } : msg
                            )
                        );
                    }
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log("Stream successfully aborted.");
                return;
            }

            console.error("Error sending AI message:", error);
            const errorMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `Error: ${error instanceof Error ? error.message : "Connection failed"}. \n\n(If you just added your API key, you may need to restart your terminal/development server for Next.js to load it!)`,
            }
            setMessages((prev) => [...prev, errorMsg])
        } finally {
            setIsTyping(false)
        }
    }

    return (
        <AnimatePresence>
            {aiChatPanelOpen && (
                <>
                    <style>{`
                        .chat-scroll::-webkit-scrollbar { width: 5px; }
                        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
                        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(245,230,200,0.15); border-radius: 10px; }
                        .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(245,230,200,0.3); }
                    `}</style>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(3px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        transition={{ duration: 0.4 }}
                        className="fixed inset-0 z-40"
                        style={{ backgroundColor: 'rgba(20,10,5,0.45)' }}
                        onClick={() => setAiChatPanelOpen(false)}
                    />

                    {/* Drawer */}
                    <motion.aside
                        initial={{ x: '100%', opacity: 0.8 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0.8 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
                        style={{
                            width: 460, // Increased width per user request
                            background: 'linear-gradient(180deg, rgba(44,24,16,0.98) 0%, rgba(30,15,10,0.98) 100%)',
                            borderLeft: '1px solid rgba(245,230,200,0.08)',
                            boxShadow: '-15px 0 60px rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(24px)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 flex-shrink-0 relative">
                            <div className="absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-[rgba(245,230,200,0.15)] via-[rgba(245,230,200,0.05)] to-transparent" />
                            <div className="flex items-center gap-3">
                                <motion.div 
                                    initial={{ rotate: -15, scale: 0.8 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                                    className="p-2 rounded-xl"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(245,166,35,0.15) 0%, rgba(245,166,35,0.02) 100%)',
                                        border: '1px solid rgba(245,166,35,0.25)',
                                        boxShadow: '0 4px 15px rgba(245,166,35,0.08)'
                                    }}
                                >
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" style={{ color: '#F5A623' }}>
                                        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a2.25 2.25 0 00-1.556-1.556L15.15 6.9l1.035-.259a2.25 2.25 0 001.556-1.556L18 4.05l.259 1.035a2.25 2.25 0 001.556 1.556L20.85 6.9l-1.035.259a2.25 2.25 0 00-1.556 1.556z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </motion.div>
                                <h2
                                    className="text-xl font-normal tracking-wide"
                                    style={{ fontFamily: '"IM Fell English", serif', color: '#F5E6C8' }}
                                >
                                    AI Assistant
                                </h2>
                            </div>
                            <button
                                onClick={() => setAiChatPanelOpen(false)}
                                className="opacity-40 hover:opacity-100 transition-all hover:rotate-90 hover:scale-110 duration-300"
                                style={{ color: '#F5E6C8' }}
                                title="Close chat"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 chat-scroll">
                            <AnimatePresence initial={false}>
                                {messages.map((msg) => (
                                    <motion.div
                                        layout
                                        key={msg.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ type: 'spring', damping: 22, stiffness: 200 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className="max-w-[85%] rounded-2xl p-4 shadow-sm relative overflow-hidden group"
                                            style={{
                                                background: msg.role === 'user' 
                                                    ? 'linear-gradient(135deg, rgba(245,166,35,0.18) 0%, rgba(245,166,35,0.06) 100%)' 
                                                    : 'linear-gradient(135deg, rgba(245,230,200,0.08) 0%, rgba(245,230,200,0.02) 100%)',
                                                border: '1px solid',
                                                borderColor: msg.role === 'user' ? 'rgba(245,166,35,0.25)' : 'rgba(245,230,200,0.1)',
                                                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                                                borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                                                boxShadow: msg.role === 'user' ? '0 4px 20px rgba(245,166,35,0.08)' : '0 4px 15px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            <p
                                                className="text-[14.5px] leading-relaxed relative z-10"
                                                style={{
                                                    fontFamily: '"Libre Baskerville", serif',
                                                    color: msg.role === 'user' ? '#F5A623' : '#e8dcc4',
                                                    textShadow: msg.role === 'user' ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                                                }}
                                            >
                                                {msg.content}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}

                                {isTyping && (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="flex justify-start"
                                    >
                                        <div
                                            className="rounded-2xl p-4 px-5 flex items-center gap-2"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(245,230,200,0.06) 0%, rgba(245,230,200,0.01) 100%)',
                                                border: '1px solid rgba(245,230,200,0.08)',
                                                borderBottomLeftRadius: '4px',
                                            }}
                                        >
                                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(245,230,200,0.6)' }} />
                                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(245,230,200,0.6)' }} />
                                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(245,230,200,0.6)' }} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div ref={messagesEndRef} className="h-2" />
                        </div>

                        {/* Input Area */}
                        <div className="px-6 py-5 flex-shrink-0 relative">
                            {/* Subtle top border gradient */}
                            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-[rgba(245,230,200,0.08)] to-transparent" />
                            
                            <motion.div 
                                className="relative rounded-xl overflow-hidden group focus-within:ring-1 focus-within:ring-[rgba(245,166,35,0.4)] transition-all flex items-end"
                                style={{
                                    background: 'rgba(20,10,5,0.5)',
                                    border: '1px solid rgba(245,230,200,0.15)',
                                }}
                            >
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSend()
                                        }
                                    }}
                                    placeholder="Ask about the book..."
                                    rows={Math.min(3, input.split('\n').length || 1)}
                                    className="w-full text-[14.5px] pl-4 pr-12 py-3.5 bg-transparent outline-none resize-none placeholder-[rgba(245,230,200,0.2)]"
                                    style={{
                                        fontFamily: '"Libre Baskerville", serif',
                                        color: '#F5E6C8',
                                        minHeight: '48px',
                                        maxHeight: '120px'
                                    }}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="absolute right-2 bottom-2 w-9 h-9 flex items-center justify-center rounded-lg disabled:opacity-30 disabled:hover:scale-100 transition-all bg-[rgba(245,166,35,0.12)] hover:bg-[rgba(245,166,35,0.25)] border border-[rgba(245,166,35,0.25)] shadow-sm"
                                    style={{ color: '#F5A623' }}
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" style={{ transform: 'translateX(1px)' }}>
                                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" fill="currentColor" />
                                    </svg>
                                </motion.button>
                            </motion.div>
                            <p className="text-[10px] text-center mt-3 opacity-35" style={{ fontFamily: '"Libre Baskerville", serif', color: '#F5E6C8', letterSpacing: '0.02em' }}>
                                Press Enter to send, Shift + Enter for new line
                            </p>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    )
}
