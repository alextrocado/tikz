
import React, { useEffect, useRef, useState } from 'react';

interface TikzRendererProps {
  code: string | undefined;
  isLoading: boolean;
}

const TikzRenderer: React.FC<TikzRendererProps> = ({ code, isLoading }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || isLoading) {
      setRenderError(null);
      return;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      setRenderError(null);
      
      const script = document.createElement('script');
      script.type = 'text/tikz';
      
      // Adiciona configurações globais para melhorar a compatibilidade do TikzJax
      let finalCode = code;
      if (code.includes('pgfplots') || code.includes('axis')) {
         // Configurações comuns de compatibilidade
         if (!code.includes('compat=')) {
           finalCode = code.replace('\\begin{axis}', '\\begin{axis}[compat=1.18]');
         }
      }

      script.textContent = finalCode;
      containerRef.current.appendChild(script);

      // @ts-ignore
      if (window.processTikzScripts) {
        try {
          // @ts-ignore
          window.processTikzScripts();
        } catch (e) {
          console.error("Erro TikzJax:", e);
          setRenderError("Erro na renderização do código TikZ. Verifique a sintaxe.");
        }
      }
    }
  }, [code, isLoading]);

  if (!code && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-800">
        <div className="p-4 bg-slate-800/50 rounded-full mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-slate-300">Pronto para visualizar</p>
        <p className="text-sm px-8 text-center mt-2">Descreva um gráfico ou figura no chat ao lado para começar.</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full p-4 overflow-auto bg-[#f8f9fa] rounded-2xl shadow-inner group">
      {/* Grid background for technical feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-8 h-8 bg-indigo-500 rounded-full animate-pulse" />
            </div>
          </div>
          <p className="mt-6 text-white font-bold tracking-widest text-sm animate-pulse uppercase">Processando LaTeX...</p>
        </div>
      )}

      {renderError && (
        <div className="absolute top-4 left-4 right-4 z-10 p-3 bg-red-500/90 text-white text-xs rounded-lg shadow-lg">
          {renderError}
        </div>
      )}

      <div 
        ref={containerRef} 
        className="tikz-container z-10 transition-all duration-700 ease-out"
      />
      
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => window.print()}
          className="p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-md transition-all border border-slate-200"
          title="Imprimir / Salvar PDF"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2-2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TikzRenderer;
