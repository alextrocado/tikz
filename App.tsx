
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

  // Check if an API key has already been selected via AI Studio
  const checkKeyStatus = useCallback(async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      try {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setNeedsApiKey(!hasKey);
      } catch (e) {
        setNeedsApiKey(true);
      }
    }
  }, []);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  // Handle opening the AI Studio key selection dialog
  const handleOpenKeyDialog = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        // Proceed assuming success to mitigate race condition between UI and state
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
      // Call service to get TikZ representation using Gemini 2.0
      const response = await generateTikzResponse([...messages, userMessage]);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.explanation,
        tikzCode: response.tikzCode || undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      if (response.tikzCode && response.tikzCode.trim().length > 0) {
        setCurrentTikzCode(response.tikzCode);
      }
    } catch (error: any) {
      console.error("Erro na App:", error);
      
      const msg = error.message || "";
      
      // If the model or entity is not found, prompt for key re-selection
      if (msg === "ENTITY_NOT_FOUND") {
        setNeedsApiKey(true);
        const assistantError: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "❌ Modelo Gemini 2.0 não acessível ou chave inválida. \n\nIsto acontece se a sua chave de API não tiver permissões para modelos experimentais 2.0 ou se o projeto não tiver faturamento ativo. Por favor, tente selecionar uma nova chave.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantError]);
      } else {
        const assistantError: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Erro no Processamento: ${msg || "Falha desconhecida na comunicação."}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantError]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Mandatory API Key Selection UI */}
      {needsApiKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4">
          <div className="bg-slate-900 border border-slate-700/50 p-10 rounded-3xl max-w-lg w-full shadow-[0_0_100px_rgba(79,70,229,0.4)] text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4">Acesso Gemini 2.0</h3>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              Para gerar gráficos TikZ com Gemini 2.0, deve selecionar uma Chave de API de um projeto com faturamento ativo.
            </p>
            <button
              onClick={handleOpenKeyDialog}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95"
            >
              Configurar Chave de API
            </button>
            <p className="mt-6 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="hover:text-indigo-400 underline decoration-indigo-500/30">Documentação de Faturamento</a>
            </p>
          </div>
        </div>
      )}

      {/* Sidebar with messages and input */}
      <ChatSidebar 
        messages={messages} 
        onSendMessage={handleSendMessage}
        isLoading={isLoading} 
      />

      {/* Main visualization area */}
      <main className="flex-1 flex flex-col p-6 overflow-hidden relative">
        <TikzRenderer code={currentTikzCode} isLoading={isLoading} />
        <CodePanel code={currentTikzCode} />
      </main>
    </div>
  );
};

export default App;
