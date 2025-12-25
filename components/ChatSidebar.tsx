
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatSidebarProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const templates = [
    { label: "Gráfico 3D", prompt: "Gere um gráfico 3D da função z = x^2 - y^2 usando pgfplots" },
    { label: "Geometria", prompt: "Desenhe um círculo inscrito num triângulo equilátero com as medidas marcadas" },
    { label: "Campo Vetorial", prompt: "Representação de um campo vetorial 2D simples f(x,y) = (-y, x)" }
  ];

  return (
    <div className="flex flex-col h-full bg-[#0f172a] border-r border-slate-800 w-full md:w-96 shadow-2xl z-20">
      <div className="p-6 border-b border-slate-800 bg-[#1e293b]/50">
        <h1 className="text-xl font-black text-white flex items-center gap-3">
          <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-sm shadow-[0_0_15px_rgba(99,102,241,0.5)]">Σ</span>
          TikZ Studio
        </h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
          Gemini 2.0 Flash
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.length === 0 && (
          <div className="space-y-4 animate-in fade-in duration-700">
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-xs text-indigo-300 leading-relaxed">
                Bem-vindo ao laboratório vetorial. Descreva funções ou diagramas e o **Gemini 2.0** gerará o código TikZ para renderização instantânea.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase px-2 tracking-tighter">Exemplos rápidos</p>
              {templates.map((t, i) => (
                <button 
                  key={i}
                  onClick={() => onSendMessage(t.prompt)}
                  className="text-left p-3 text-xs bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-slate-300 transition-all hover:border-indigo-500/50 group"
                >
                  <span className="font-bold text-indigo-400 group-hover:text-indigo-300">{t.label}:</span>
                  <span className="block opacity-60 truncate mt-1">{t.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start animate-in fade-in slide-in-from-left-2 duration-300'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-200 border border-slate-700 shadow-sm'}`}>
              <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
            </div>
            <span className="text-[9px] text-slate-500 mt-1 uppercase font-bold px-1 opacity-60">
              {msg.role === 'user' ? 'Utilizador' : 'Gemini 2.0 Engine'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 animate-pulse">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Gemini 2.0 a calcular...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-[#0f172a] border-t border-slate-800">
        <div className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Descreva a sua figura..."
            className="w-full bg-slate-900 text-white border border-slate-700 rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all disabled:opacity-50 text-sm shadow-inner group-hover:border-slate-600"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:bg-slate-800 transition-all shadow-xl active:scale-95 shadow-indigo-500/20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatSidebar;
