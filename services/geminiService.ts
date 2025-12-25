
// TikZ generation service using @google/genai
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message, GenerationResponse } from "../types";

const SYSTEM_INSTRUCTION = `
Você é o "TikZ Master Engine 2.0". Sua especialidade absoluta é LaTeX/TikZ e representações gráficas matemáticas.

INSTRUÇÕES DE RESPOSTA:
1. Gere código TikZ/LaTeX impecável para representações 2D e 3D.
2. Explique brevemente o funcionamento matemático da figura em Português.
3. O código TikZ DEVE estar obrigatoriamente dentro de um bloco de código markdown delimitado por \`\`\`latex.
4. Gere sempre o ambiente completo: \\begin{tikzpicture} ... \\end{tikzpicture}.

DIRETRIZES TÉCNICAS:
- Use apenas pacotes compatíveis com TikzJax (tikz, pgfplots).
- Para gráficos 3D, use o ambiente 'axis' do pgfplots com 'compat=1.18'.
- Não use pacotes externos como 'standalone' no código interno; foque apenas no ambiente tikzpicture.
`;

export async function generateTikzResponse(messages: Message[]): Promise<GenerationResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Basic check for key existence or common "missing" placeholders
  if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey === "YOUR_API_KEY") {
    throw new Error("ENTITY_NOT_FOUND");
  }

  // Guidelines: Create a new GoogleGenAI instance right before making an API call 
  // to ensure it uses the most up-to-date API key from the dialog.
  const ai = new GoogleGenerativeAI(apiKey);
  
  const contents = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", 
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    // Access the text property directly (getter)
    const textOutput = response.text;
    
    if (!textOutput) {
      throw new Error("O Gemini 2.0 retornou uma resposta vazia.");
    }

    // Extraction of the TikZ code block
    const tikzRegex = /\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}/;
    const match = textOutput.match(tikzRegex);
    const tikzCode = match ? match[0] : "";
    
    const explanation = textOutput.replace(/```[\s\S]*?```/g, "").trim();

    // If there's an explanation but no TikZ code
    if (!tikzCode && textOutput.trim().length > 0) {
      return {
        explanation: textOutput,
        tikzCode: "",
      };
    }

    if (!tikzCode) {
      throw new Error("Não foi possível extrair um código TikZ válido da resposta.");
    }

    return {
      explanation: explanation || "Figura gerada com sucesso:",
      tikzCode,
    };
  } catch (e: any) {
    console.error("Erro capturado no GeminiService:", e);
    
    // The "json" error usually indicates a network/auth issue where an HTML error page is returned.
    // Mapping this to ENTITY_NOT_FOUND lets App.tsx trigger the key picker.
    const errorMsg = e.message || String(e);

    if (
      errorMsg.includes("json") || 
      errorMsg.includes("Response") || 
      errorMsg.includes("not found") || 
      errorMsg.includes("404") ||
      errorMsg.includes("403") ||
      errorMsg.includes("API key")
    ) {
      throw new Error("ENTITY_NOT_FOUND");
    }

    throw new Error(`Erro Gemini 2.0: ${errorMsg}`);
  }
}
