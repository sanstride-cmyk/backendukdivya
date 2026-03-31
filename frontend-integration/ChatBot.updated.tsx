// frontend-integration/ChatBot.updated.tsx
// Full replacement for src/components/ChatBot.tsx

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { upsertChatSession, completeChatSession } from "../lib/api";
import { v4 as uuidv4 } from "uuid";

type Message = { id: number; from: "bot" | "user"; text: string };
type Stage = "greeting" | "name" | "phone" | "email" | "services" | "done";

const FAQ_RESPONSES: Record<string, string> = {
  chatbot: "We build intelligent chatbots that work 24/7 to capture leads, answer questions, and qualify customers — fully customized for your business!",
  seo: "Our SEO strategies boost your rankings on Google and drive organic traffic that converts into real customers.",
  ads: "We run high-ROI Google & Meta ad campaigns optimized for your specific audience and budget.",
  social: "We manage your social media, create content, and grow your following across all major platforms.",
  price: "Our packages are tailored to your needs and goals. Book a free consultation and we'll give you a custom quote!",
  voice: "Our AI voice agents handle calls, qualify leads, and schedule appointments — 24/7 without any human intervention.",
};

const SERVICE_MAP: Record<string, string> = {
  "1": "Chatbot Development",
  "2": "AI Voice Agents",
  "3": "Social Media Marketing",
  "4": "SEO Optimization",
  "5": "Paid Ads",
};

function getBotResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("chatbot") || lower.includes("bot")) return FAQ_RESPONSES.chatbot;
  if (lower.includes("seo") || lower.includes("search")) return FAQ_RESPONSES.seo;
  if (lower.includes("ads") || lower.includes("google") || lower.includes("meta") || lower.includes("facebook")) return FAQ_RESPONSES.ads;
  if (lower.includes("social") || lower.includes("instagram") || lower.includes("tiktok")) return FAQ_RESPONSES.social;
  if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) return FAQ_RESPONSES.price;
  if (lower.includes("voice") || lower.includes("call") || lower.includes("phone")) return FAQ_RESPONSES.voice;
  return "That's a great question! Our team would love to give you a personalized answer. Book a free consultation and we'll reach out within 24 hours! 🚀";
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: 1, from: "bot",
    text: "Hi 👋 Welcome to Connect Marketing Solutions! How can I help grow your business today?\n\nAsk me about our services, or type 'start' to get a free consultation!",
  }]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("greeting");
  const [leadData, setLeadData] = useState({ name: "", phone: "", email: "" });
  const [sessionId] = useState<string>(() => uuidv4());
  const [showNotification, setShowNotification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setShowNotification(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize session when chat opens
  useEffect(() => {
    if (open) {
      upsertChatSession({ sessionId }).catch(() => {});
    }
  }, [open, sessionId]);

  const addMessage = (from: "bot" | "user", text: string) => {
    setMessages((prev) => [...prev, { id: Date.now(), from, text }]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userInput = input.trim();
    addMessage("user", userInput);
    setInput("");

    setTimeout(async () => {
      const lower = userInput.toLowerCase();

      if (lower === "start" || lower.includes("consult")) {
        addMessage("bot", "Great! Let's get you started. What's your name? 😊");
        setStage("name");

      } else if (stage === "name") {
        const name = userInput;
        setLeadData((p) => ({ ...p, name }));
        await upsertChatSession({ sessionId, name }).catch(() => {});
        addMessage("bot", `Nice to meet you, ${name}! 🎉 What's the best phone number to reach you?`);
        setStage("phone");

      } else if (stage === "phone") {
        const phone = userInput;
        setLeadData((p) => ({ ...p, phone }));
        await upsertChatSession({ sessionId, phone }).catch(() => {});
        addMessage("bot", "Perfect! And your email address? We'll send you a free marketing audit report!");
        setStage("email");

      } else if (stage === "email") {
        const email = userInput;
        setLeadData((p) => ({ ...p, email }));
        await upsertChatSession({ sessionId, email }).catch(() => {});
        addMessage("bot",
          `Awesome! 🚀 We've captured your details, ${leadData.name}! Our team will contact you within 24 hours.\n\nWhich service are you most interested in?\n\n1. Chatbot Development 🤖\n2. AI Voice Agents 📞\n3. Social Media Marketing 📱\n4. SEO Optimization 🔍\n5. Paid Ads 💰`
        );
        setStage("services");

      } else if (stage === "services") {
        const service = SERVICE_MAP[userInput] || userInput;
        await upsertChatSession({ sessionId, interestedService: service }).catch(() => {});
        await completeChatSession(sessionId).catch(() => {});
        addMessage("bot", `Excellent choice! Our experts will prepare a custom strategy for ${service}. Expect a call soon! 🎯\n\nFeel free to ask me anything else about our services.`);
        setStage("done");

      } else {
        addMessage("bot", getBotResponse(userInput));
      }
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="chatbot-container">
      {open ? (
        <div className="chatbot-window animate-slide-in-right">
          <div className="chatbot-header">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">Connect Assistant</p>
              <p className="text-xs text-white/70 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
                Online now
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={msg.from === "bot" ? "chat-bubble-bot" : "chat-bubble-user"} style={{ whiteSpace: "pre-line" }}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-area">
            <input
              className="chatbot-input"
              placeholder={
                stage === "name" ? "Enter your name..." :
                stage === "phone" ? "Enter your phone..." :
                stage === "email" ? "Enter your email..." :
                "Type your message..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="chatbot-send" onClick={handleSend}>
              <Send size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-end gap-2">
          {showNotification && (
            <div
              className="bg-gray-900 border border-orange-500/30 rounded-xl p-3 max-w-[220px] text-xs text-gray-300 shadow-lg cursor-pointer"
              onClick={() => { setOpen(true); setShowNotification(false); }}
            >
              <p className="font-semibold text-orange-400 mb-1">👋 Hi there!</p>
              <p>Ask us anything about growing your business!</p>
            </div>
          )}
          <button className="chatbot-toggle" onClick={() => { setOpen(true); setShowNotification(false); }}>
            <MessageCircle size={26} />
          </button>
        </div>
      )}
    </div>
  );
}
