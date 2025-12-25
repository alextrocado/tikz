
import React, { useState } from 'react';

interface CodePanelProps {
  code: string | undefined;
}

const CodePanel: React.FC<CodePanelProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (code) {
      const fullDoc = `\\documentclass[tikz,border=10pt]{standalone}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\begin{document}
${code}
\\end{document}`;
      navigator.clipboard.writeText(fullDoc);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!code) return null;

  return (
    <div className="mt-4 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-700">
        <span className="text-xs font-mono text-slate-300">LaTeX / TikZ Code</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Copiado!
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              Copiar Documento Completo
            </>
          )}
        </button>
      </div>
      <div className="p-4 bg-slate-900 overflow-x-auto max-h-60">
        <pre className="text-xs font-mono text-indigo-300 leading-relaxed whitespace-pre">
          {code}
        </pre>
      </div>
    </div>
  );
};

export default CodePanel;
