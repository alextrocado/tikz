
import React, { useEffect, useRef, useState } from 'react';

interface TikzRendererProps {
  code: string | undefined;
  isLoading: boolean;
}

const TikzRenderer: React.FC<TikzRendererProps> = ({ code, isLoading }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    // Se o código estiver vazio ou estiver carregando, limpamos o erro e o container
    if (!code || code.trim() === "" || isLoading) {
      setRenderError(null);
      if (containerRef.current && !isLoading) {
        containerRef.current.innerHTML = '';
      }
      return;
    }

    const render = () => {
      if (!containerRef.current) return;

      try {
        containerRef.current.innerHTML = '';
        setRenderError(null);
        
        const script = document.createElement('script');
        script.type = 'text/tikz';
        
        let finalCode = code;
        // Auto-fix para compatibilidade comum de 3D se a IA esquecer
        if ((code.includes('pgfplots') || code.includes('axis')) && !code.includes('compat=')) {
          finalCode = code.replace('\\begin{axis}', '\\begin{axis}[compat=1.18]');
        }

        script.textContent = finalCode;
        containerRef.current.appendChild(script);

        // Dispara o processamento do TikzJax se disponível globalmente
        // @ts-ignore
        if (window.processTikzScripts) {
          try {
            // @ts-ignore
            window.processTikzScripts();
          } catch (e) {
            console.error("Erro ao renderizar via TikzJax:", e);
            setRenderError("Erro na renderização: verifique a validade do código LaTeX.");
          }
        } else {
          // Se o engine ainda não estiver pronto, tenta novamente em meio segundo
          setTimeout(render, 500);
        }
      } catch (err) {
        setRenderError("Falha crítica ao montar o script de renderização.");
      }
    };

    // Pequeno debounce para evitar múltiplas renderizações rápidas
    const timeout = setTimeout(render, 150);
    return () => clearTimeout(timeout);
  }, [code, isLoading]);

  if (!code && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-12 text-center bg-[#020617]">
        <div className="w-20 h-20 bg-slate-900/50 rounded-3xl flex items-center justify-center mb-6 border border-slate-800 shadow-2xl">
           <svg className="w-10 h-10 text-indigo-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
           </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-300 mb-3">Laboratório TikZ</h2>
        <p className="text-xs max-w-xs leading-relaxed opacity-60 uppercase tracking-widest font-medium">
          Escreva uma fórmula ou descreva uma figura matemática para visualizar a representação vetorial.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[500px] h-full w-full p-6 overflow-auto bg-white rounded-2xl shadow-inner transition-all duration-300">
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-slate-950/40 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl">
          <div className="w-14 h-14 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
          <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Gerando Vetores...</p>
        </div>
      )}

      {renderError && (
        <div className="absolute top-6 left-6 right-6 z-30 p-4 bg-red-600/95 text-white text-[11px] font-bold rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {renderError}
        </div>
      )}

      <div 
        ref={containerRef} 
        className={`tikz-container transition-all duration-700 ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`} 
      />
      
      {!isLoading && code && (
        <div className="absolute bottom-4 right-4 text-[9px] text-slate-300 bg-slate-900/10 px-2 py-1 rounded-md uppercase font-bold tracking-tighter pointer-events-none">
          Renderizado via TikzJax
        </div>
      )}
    </div>
  );
};

export default TikzRenderer;
