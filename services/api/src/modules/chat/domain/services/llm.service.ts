import { DocumentChunk } from './vector-search.service';

export const LLM_SERVICE = Symbol('LlmService');

export interface CompleteResponse {
  answer: string;
  exactQuote: string | null;
  sourceChunkId: string | null;
}

export interface LlmService {
  complete(
    chunks: DocumentChunk[],
    question: string,
  ): Promise<CompleteResponse>;
  completeConversational(message: string): Promise<string>;
}
