
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tikzCode?: string;
  timestamp: Date;
}

export interface GenerationResponse {
  explanation: string;
  tikzCode: string;
}
