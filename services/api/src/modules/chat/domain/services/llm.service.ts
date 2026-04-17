import { DocumentChunk } from './vector-search.service';

export const LLM_SERVICE = Symbol('LlmService');

export interface LlmService {
  complete(chunks: DocumentChunk[], question: string): Promise<string>;
  completeConversational(message: string): Promise<string>;
}
