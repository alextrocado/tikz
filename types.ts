
export interface Source {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tikzCode?: string;
  sources?: Source[];
  timestamp: Date;
}

export interface GenerationResponse {
  explanation: string;
  tikzCode: string;
  sources?: Source[];
}
