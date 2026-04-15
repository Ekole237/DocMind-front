import { type LlmService } from '#chat/domain/services/llm.service';
import { type DocumentChunk } from '#chat/domain/services/vector-search.service';
import { PromptBuilder } from '#chat/infrastructure/services/prompt-builder';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

@Injectable()
export class LlmServiceImplementation implements LlmService {
  private readonly logger = new Logger(LlmServiceImplementation.name);

  constructor(
    private readonly _configService: ConfigService,
    private readonly _promptBuilder: PromptBuilder,
  ) {}

  async complete(chunks: DocumentChunk[], question: string): Promise<string> {
    const provider = this._configService.get<string>('LLM_PROVIDER', 'openai');
    const userPrompt = this._promptBuilder.buildUserPrompt(chunks, question);
    const systemPrompt = this._promptBuilder.SYSTEM_PROMPT;

    if (provider === 'anthropic') {
      return this._callAnthropic(systemPrompt, userPrompt);
    }

    if (provider === 'groq') {
      return this._callGroq(systemPrompt, userPrompt);
    }

    return this._callOpenAi(systemPrompt, userPrompt);
  }

  private async _callAnthropic(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const client = new Anthropic({
      apiKey: this._configService.get<string>('ANTHROPIC_API_KEY'),
    });

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    return (msg.content[0] as Anthropic.TextBlock).text;
  }

  private async _callOpenAi(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const client = new OpenAI({
      apiKey: this._configService.get<string>('OPENAI_API_KEY'),
    });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return completion.choices[0].message.content ?? '';
  }

  private async _callGroq(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<string> {
    const client = new OpenAI({
      apiKey: this._configService.get<string>('GROQ_API_KEY'),
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const completion = await client.chat.completions.create({
      model: this._configService.get<string>('GROQ_MODEL', 'llama-3.3-70b-versatile'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
    });

    return completion.choices[0].message.content ?? '';
  }
}
