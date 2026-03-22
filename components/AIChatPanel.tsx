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

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

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
        } catch (error) {
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
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                        onClick={() => setAiChatPanelOpen(false)}
                    />

                    {/* Drawer */}
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
                        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col overflow-hidden"
                        style={{
                            width: 380,
                            backgroundColor: 'rgba(44,24,16,0.97)',
                            borderLeft: '1px solid rgba(245,230,200,0.12)',
                            boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(16px)',
                        }}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                            style={{ borderBottom: '1px solid rgba(245,230,200,0.12)' }}
                        >
                            <div className="flex items-center gap-2">
                                <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" style={{ color: '#F5A623' }}>
                                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a2.25 2.25 0 00-1.556-1.556L15.15 6.9l1.035-.259a2.25 2.25 0 001.556-1.556L18 4.05l.259 1.035a2.25 2.25 0 001.556 1.556L20.85 6.9l-1.035.259a2.25 2.25 0 00-1.556 1.556z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <h2
                                    className="text-lg font-normal"
                                    style={{ fontFamily: '"IM Fell English", serif', color: '#F5E6C8' }}
                                >
                                    AI Assistant
                                </h2>
                            </div>
                            <button
                                onClick={() => setAiChatPanelOpen(false)}
                                className="opacity-50 hover:opacity-100 transition-opacity"
                                style={{ color: '#F5E6C8' }}
                                title="Close chat"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="max-w-[85%] rounded-lg p-3"
                                        style={{
                                            backgroundColor: msg.role === 'user' ? 'rgba(245,166,35,0.15)' : 'rgba(245,230,200,0.06)',
                                            border: '1px solid',
                                            borderColor: msg.role === 'user' ? 'rgba(245,166,35,0.2)' : 'rgba(245,230,200,0.1)',
                                        }}
                                    >
                                        <p
                                            className="text-sm leading-relaxed"
                                            style={{
                                                fontFamily: '"Libre Baskerville", serif',
                                                color: msg.role === 'user' ? '#F5A623' : '#F5E6C8',
                                                opacity: msg.role === 'user' ? 1 : 0.9,
                                            }}
                                        >
                                            {msg.content}
                                        </p>
                                    </motion.div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="rounded-lg p-3 px-4 flex items-center gap-1.5"
                                        style={{
                                            backgroundColor: 'rgba(245,230,200,0.04)',
                                            border: '1px solid rgba(245,230,200,0.05)',
                                        }}
                                    >
                                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(245,230,200,0.5)' }} />
                                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(245,230,200,0.5)' }} />
                                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(245,230,200,0.5)' }} />
                                    </motion.div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div
                            className="px-5 py-4 flex-shrink-0"
                            style={{ borderTop: '1px solid rgba(245,230,200,0.08)' }}
                        >
                            <div className="relative">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSend()
                                        }
                                    }}
                                    placeholder="Ask a question..."
                                    rows={2}
                                    className="w-full text-sm pl-3 pr-10 py-2.5 rounded-sm outline-none resize-none"
                                    style={{
                                        fontFamily: '"Libre Baskerville", serif',
                                        backgroundColor: 'rgba(245,230,200,0.08)',
                                        color: '#F5E6C8',
                                        border: '1px solid rgba(245,230,200,0.2)',
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    className="absolute right-2 bottom-2 p-1.5 rounded-sm opacity-60 hover:opacity-100 disabled:opacity-30 transition-opacity"
                                    style={{ color: '#F5A623' }}
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                                        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" fill="currentColor" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-[10px] text-center mt-2 opacity-30" style={{ fontFamily: '"Libre Baskerville", serif', color: '#F5E6C8' }}>
                                Press Enter to send, Shift + Enter for new line.
                            </p>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    )
}
