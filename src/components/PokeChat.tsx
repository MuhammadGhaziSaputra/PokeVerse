import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, X } from "lucide-react";
import { ai } from "../services/geminiService";
import { motion } from "motion/react";
import Markdown from "react-markdown";

interface Message {
  role: "user" | "model";
  text: string;
}

export default function PokeChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Halo! Saya **Pokechat**, asisten profesor Pokemon terpercaya Anda. Ada yang ingin Anda tanyakan seputar Pokemon hari ini?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session
    chatRef.current = ai.chats.create({
      model: "gemini-3.1-flash-lite-preview",
      config: {
        systemInstruction: "Kamu adalah Pokechat, spesialis dan profesor ahli tentang dunia Pokemon. Selalu gunakan bahasa Indonesia dengan ramah, dan antusias. Jawab segala sesuatu terkait Pokemon secara spesifik dan akurat, termasuk anime, game, lore, statistik, strategi, pertarungan, dan fakta unik."
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isTyping || !chatRef.current) return;

    setInputValue("");
    setMessages(prev => [...prev, { role: "user", text }]);
    setIsTyping(true);

    let currentResponse = "";
    // Insert a placeholder to stream into
    setMessages(prev => [...prev, { role: "model", text: "" }]);

    try {
      const streamResponse = await chatRef.current.sendMessageStream({ message: text });
      
      for await (const chunk of streamResponse) {
        if (chunk.text) {
          currentResponse += chunk.text;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1].text = currentResponse;
            return updated;
          });
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].text = "Maaf, komunikasi dengan jaringan Pokedex terputus. Silakan ulangi pertanyaan Anda.";
        return updated;
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 flex flex-col h-full overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 flex items-center justify-between text-white relative shadow-md z-10">
        <div className="flex items-center gap-4">
          <Sparkles className="absolute right-6 top-6 w-24 h-24 text-white/5 transform rotate-12 pointer-events-none" />
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
            <Bot className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Pokechat</h2>
            <p className="text-slate-400 text-sm font-medium">Asisten Pokemon Pribadi Anda</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-slate-50/50">
        {messages.map((msg, idx) => {
          const isModel = msg.role === "model";
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx}
              className={`flex gap-4 max-w-[85%] ${isModel ? "self-start" : "ml-auto flex-row-reverse"}`}
            >
              <div className={`p-2 rounded-full h-10 w-10 flex items-center justify-center shrink-0 ${isModel ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-700"}`}>
                {isModel ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              
              <div className={`p-4 rounded-2xl shadow-sm ${
                isModel 
                  ? "bg-white border border-slate-100 text-slate-700 rounded-tl-sm" 
                  : "bg-slate-900 text-white rounded-tr-sm"
                }`}
              >
                <div className={`markdown-body text-sm ${isModel ? "prose-sm" : "prose-sm prose-invert"}`}>
                  <Markdown>{msg.text || (isTyping && idx === messages.length - 1 ? '...' : '')}</Markdown>
                </div>
              </div>
            </motion.div>
          );
        })}
        {isTyping && messages[messages.length - 1].role === "user" && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 self-start max-w-[85%]">
             <div className="p-2 rounded-full h-10 w-10 bg-red-100 text-red-600 flex items-center justify-center shrink-0">
               <Bot className="w-5 h-5" />
             </div>
             <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm rounded-tl-sm flex items-center gap-1 text-slate-400">
               <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '0ms' }} />
               <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '150ms' }} />
               <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
           </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2 relative">
          <input
            type="text"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-6 py-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium text-slate-700 placeholder-slate-400"
            placeholder="Tanya tentang status, evolusi, jurus, dll..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !inputValue.trim()}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white p-4 rounded-full transition-all shadow-md shadow-red-500/20 active:scale-95 shrink-0"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
