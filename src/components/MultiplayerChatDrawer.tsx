import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AnglerPeer,
  ChatMessage,
  SupportedLanguage,
} from '../types';
import {
  multiplayerService,
  AVAILABLE_ROOMS,
} from '../services/multiplayerService';
import { LOCALIZATION } from '../data/localization';
import {
  X,
  Users,
  Send,
  Radio,
  Smile,
  Globe,
  MessageSquare,
} from 'lucide-react';

interface MultiplayerChatDrawerProps {
  isOpen: boolean;
  playerName: string;
  language: SupportedLanguage;
  onClose: () => void;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export const MultiplayerChatDrawer: React.FC<MultiplayerChatDrawerProps> = ({
  isOpen,
  playerName,
  language,
  onClose,
  onLanguageChange,
}) => {
  const t = LOCALIZATION[language] || LOCALIZATION.en;
  const [messages, setMessages] = useState<ChatMessage[]>(multiplayerService.getChat());
  const [peers, setPeers] = useState<AnglerPeer[]>(multiplayerService.getPeers());
  const [currentRoom, setCurrentRoom] = useState(multiplayerService.getCurrentRoom());
  const [inputText, setInputText] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = multiplayerService.subscribe(() => {
      setMessages([...multiplayerService.getChat()]);
      setPeers([...multiplayerService.getPeers()]);
      setCurrentRoom(multiplayerService.getCurrentRoom());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const msg = (textToSend || inputText).trim();
    if (!msg) return;
    multiplayerService.sendUserMessage(playerName, msg);
    setInputText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="w-full max-w-md h-full bg-slate-900/95 border-l border-slate-700/80 shadow-2xl flex flex-col text-slate-100"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <span>{t.multiplayer}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h3>
              <span className="text-[11px] text-slate-400">
                {currentRoom.name} • {peers.length + 1} Anglers
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language dropdown quick toggle */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-[11px] font-bold">
              {(['en', 'id', 'ja', 'es'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2 py-0.5 rounded cursor-pointer uppercase ${
                    language === lang
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              id="btn-close-chat"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Room Switcher Pills */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {AVAILABLE_ROOMS.map((room) => (
            <button
              key={room.id}
              onClick={() => multiplayerService.switchRoom(room.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                currentRoom.id === room.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>{room.name}</span>
            </button>
          ))}
        </div>

        {/* Online Anglers Ribbon */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* User yourself */}
          <div className="px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 text-cyan-300 shrink-0">
            <span>🌟</span>
            <span>{playerName} (You)</span>
          </div>

          {peers.map((peer) => (
            <div
              key={peer.id}
              className="px-2.5 py-1 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs flex items-center gap-1.5 text-slate-300 shrink-0"
              title={`${peer.name} is ${peer.state}`}
            >
              <span>{peer.avatar}</span>
              <span className="font-semibold">{peer.name}</span>
              <span className="text-[10px] text-slate-400 capitalize">({peer.state})</span>
            </div>
          ))}
        </div>

        {/* Chat Message Feed */}
        <div
          ref={chatScrollRef}
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 text-xs"
        >
          {messages.map((msg) => {
            const isMe = msg.sender === playerName;

            if (msg.isSystem) {
              return (
                <div
                  key={msg.id}
                  className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-cyan-900/40 text-cyan-300 text-center font-medium my-1"
                >
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5 px-1">
                  <span>{msg.avatar || '🎣'}</span>
                  <span className="font-bold text-slate-300">{msg.sender}</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div
                  className={`px-3.5 py-2 rounded-2xl max-w-[85%] leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-xs'
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Localized Quick Reaction Chips */}
        <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {[
            t.quickChat1,
            t.quickChat2,
            t.quickChat3,
            t.quickChat4,
            t.quickChat5,
            t.quickChat6,
          ].map((quick, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(quick)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 whitespace-nowrap transition cursor-pointer border border-slate-700/60 shrink-0"
            >
              {quick}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            id="input-multiplayer-chat"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.chatPlaceholder}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
