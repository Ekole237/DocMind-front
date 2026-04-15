import { DocumentChunk } from '#chat/domain/services/vector-search.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptBuilder {
  readonly SYSTEM_PROMPT = `Tu es un assistant interne spécialisé dans les documents RH de l'entreprise.
Réponds UNIQUEMENT en français.
Réponds UNIQUEMENT à partir des informations fournies dans le contexte ci-dessous.
Si l'information demandée n'est pas dans le contexte, réponds exactement :
"Je n'ai pas trouvé d'information sur ce sujet dans la base documentaire RH."
Ne génère JAMAIS de réponse à partir de tes connaissances générales.
Cite toujours le document source dans ta réponse.
Sois précis, concis et professionnel.`;

  buildUserPrompt(chunks: DocumentChunk[], question: string): string {
    const context = chunks
      .map((c) => `[${c.title}]\n${c.content}`)
      .join('\n---\n');

    return `CONTEXTE DOCUMENTAIRE :\n---\n${context}\n---\n\nQUESTION : ${question}`;
  }
}
