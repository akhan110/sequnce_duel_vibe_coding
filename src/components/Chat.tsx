import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChipColor } from '../types';
import { Send, MessageSquare } from 'lucide-react';

interface ChatProps {
  chat: ChatMessage[];
  currentUserId: string;
  onSendChatMessage: (text: string) => void;
}

const QUICK_CHATS = [
  'Good Game! 👍',
  'Nice Move! 🤯',
  'Watch Out! ⚠️',
  'I was blocking! 😉',
  'Dead card. Discarding... 🫠',
  'GG! Play again? 💫'
];

export default function Chat({
  chat,
  currentUserId,
  onSendChatMessage
}: ChatProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getBubbleColor = (color: ChipColor) => {
    switch (color) {
      case 'red': return 'text-red-800 bg-red-50/80 border-red-200/50';
      case 'green': return 'text-emerald-800 bg-emerald-50/80 border-emerald-200/50';
      case 'blue': return 'text-blue-800 bg-blue-50/80 border-blue-200/50';
      default: return 'text-slate-705 bg-slate-100/50 border-slate-200/50';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;
    onSendChatMessage(textToSend.trim());
    setInputText('');
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-[320px] md:h-full justify-between shadow-sm">
      {/* Thread header */}
      <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3 font-bold">
        <MessageSquare className="w-4 h-4 text-slate-650" /> Room Team Chat
      </h3>

      {/* Messages Thread list */}
      <div className="flex-1 overflow-y-auto mb-3 space-y-2 pr-1 custom-scrollbar">
        {chat.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-4">
            <span className="text-[10px] uppercase font-mono text-slate-450 tracking-wider">No chat logs. Standard room messages will appear here.</span>
          </div>
        ) : (
          chat.map((msg) => {
            const isMe = msg.senderUid === currentUserId;
            const bubbleColor = getBubbleColor(msg.senderColor);

            return (
              <div 
                key={msg.id}
                className={`flex flex-col max-w-[85%] rounded-2xl p-2.5 text-xs border ${bubbleColor} ${
                  isMe ? 'ml-auto rounded-tr-none' : 'mr-auto rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-4 border-b border-black/5 pb-0.5 mb-1 text-[10px] font-bold">
                  <span>{msg.senderName}</span>
                  <span className="text-[8px] font-mono text-slate-500 font-normal">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="font-sans text-slate-800 leading-relaxed break-words">{msg.text}</p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Macro Chats */}
      <div className="flex flex-wrap gap-1 mb-3 pt-2 border-t border-slate-100">
        {QUICK_CHATS.map((qText) => (
          <button
            key={qText}
            onClick={() => handleSend(qText)}
            className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 text-[9px] font-sans font-bold rounded-lg transition cursor-pointer"
          >
            {qText}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
          placeholder="Type standard chip chat..."
          className="flex-1 bg-transparent px-2 text-xs text-slate-800 focus:outline-none"
        />
        <button
          onClick={() => handleSend(inputText)}
          className="bg-slate-900 hover:bg-slate-800 text-white border-none p-2 rounded-lg transition cursor-pointer shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
