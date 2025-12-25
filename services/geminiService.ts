
import { GoogleGenAI } from "@google/genai";
import { Message, GenerationResponse } from "../types";

const SYSTEM_INSTRUCTION = `
Você é o "TikZ Master AI", um assistente especializado em matemática e LaTeX/TikZ.

REGRAS DE RESPOSTA:
Sua resposta DEVE ser estritamente um objeto JSON válido dentro de um bloco de código markdown:
\`\`\`json
{
  "explanation": "Sua explicação amigável aqui em Português.",
  "tikzCode": "\\begin{tikzpicture} ... \\end{tikzpicture}"
}
\`\`\`

REGRAS TIKZ:
- Use apenas pacotes compatíveis com TikzJax (tikz, pgfplots).
- Não inclua \\documentclass ou preâmbulos.
- Comece com \\begin{tikzpicture} e termine com \\end{tikzpicture}.
`;

async function callGeminiModel(modelName: string, contents: any): Promise<GenerationResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Usamos apenas o prompt de texto para evitar que o SDK tente parsear JSON automaticamente e falhe em erros 403
  const response = await ai.models.generateContent({
    model: modelName,
    contents: contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  const textOutput = response.text;
  if (!textOutput) throw new Error("A IA retornou uma resposta vazia.");

  try {
    // Busca o bloco de código JSON na resposta
    const jsonMatch = textOutput.match(/```json\s*([\s\S]*?)\s*```/) || textOutput.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Formato de resposta inválido.");
    
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const data = JSON.parse(jsonStr.trim());
    
    return {
      explanation: data.explanation || "Aqui está sua figura:",
      tikzCode: data.tikzCode || ""
    };
  } catch (e) {
    console.error("Erro ao parsear resposta:", textOutput);
    throw new Error("Erro ao processar a resposta da IA. Tente novamente.");
  }
}

export async function generateTikzResponse(messages: Message[]): Promise<GenerationResponse> {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      (window as any).aistudio.openSelectKey();
    }
    throw new Error("Chave de API não configurada.");
  }

  const contents = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content + (msg.tikzCode ? `\n\nCódigo TikZ anterior:\n${msg.tikzCode}` : '') }]
  }));

  // Lista de modelos em ordem de preferência/disponibilidade
  const models = ["gemini-3-pro-preview", "gemini-3-flash-preview", "gemini-2.5-flash-latest"];
  let lastError = "";

  for (const model of models) {
    try {
      console.log(`Tentando modelo: ${model}`);
      return await callGeminiModel(model, contents);
    } catch (error: any) {
      lastError = error?.message || String(error);
      console.warn(`Modelo ${model} falhou:`, lastError);
      
      // Se o erro for de autenticação grave, não adianta tentar os outros
      if (lastError.includes("API_KEY_INVALID") || lastError.includes("401")) break;
      
      // Continua para o próximo modelo se for erro de cota ou faturamento (403/429)
      continue;
    }
  }

  // Se chegou aqui, todos falharam
  if (lastError.includes("403") || lastError.includes("billing") || lastError.includes("faturamento")) {
    throw new Error("Sua conta do Google AI Studio requer faturamento ativo ou excedeu os limites. Tente criar uma nova chave de API ou vincular um cartão.");
  }

  throw new Error("Não foi possível obter resposta dos servidores do Google. Verifique sua conexão e chave de API.");
}
