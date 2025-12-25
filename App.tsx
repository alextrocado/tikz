
import React, { useState, useCallback, useEffect } from 'react';
import ChatSidebar from './components/ChatSidebar';
import TikzRenderer from './components/TikzRenderer';
import CodePanel from './components/CodePanel';
import { generateTikzResponse } from './services/geminiService';
import { Message } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTikzCode, setCurrentTikzCode] = useState<string | undefined>();
  const [needsApiKey, setNeedsApiKey] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        try {
          const hasKey = await (window as any).aistudio.hasSelectedApiKey();
          setNeedsApiKey(!hasKey);
        } catch (e) {
          setNeedsApiKey(true);
        }
      }
    };
    checkStatus();
  }, []);

  const handleOpenKeyDialog = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        setNeedsApiKey(false);
      } catch (e) {
        console.error("Erro ao abrir diálogo:", e);
      }
    }
  };

  const handleSendMessage = useCallback(async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { explanation, tikzCode } = await generateTikzResponse([...messages, userMessage]);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: explanation,
        tikzCode: tikzCode || undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      if (tikzCode && tikzCode.trim().length > 0) {
        setCurrentTikzCode(tikzCode);
      }
    } catch (error: any) {
      const msg = error.message || "Erro inesperado.";
      
      const assistantError: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ ${msg}`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantError]);

      // Se for erro crítico de chave, mostramos o overlay
      if (msg.includes("chave") || msg.includes("faturamento") || msg.includes("AI Studio")) {
        setNeedsApiKey(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      {needsApiKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4">
          <div className="bg-slate-900 border border-slate-700/50 p-10 rounded-3xl max-w-lg w-full shadow-[0_0_100px_rgba(79,70,229,0.4)] text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-gradient-to-tr from-red-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">Problema com a Chave de API</h3>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              Sua chave atual não tem permissão para usar os modelos avançados. Isso acontece quando o projeto não tem faturamento ativo ou você atingiu o limite gratuito.
            </p>
            <button
              onClick={handleOpenKeyDialog}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95"
            >
              Trocar ou Selecionar Chave
            </button>
            <p className="mt-6 text-xs text-slate-500 italic">
              Dica: Tente usar uma chave de um projeto que você criou recentemente no Google Cloud.
            </p>
          </div>
        </div>
      )}

      <ChatSidebar 
        messages={messages} 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading} 
      />

      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-hidden bg-slate-950 relative">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-500/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full z-10">
          <div className="flex-1 min-h-0 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
            <TikzRenderer code={currentTikzCode} isLoading={isLoading} />
          </div>
          <CodePanel code={currentTikzCode} />
        </div>
      </main>
    </div>
  );
};

export default App;
