import { type EmbeddingService } from './embedding.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const HF_DEFAULT_MODEL = 'BAAI/bge-small-en-v1.5';
const HF_BASE_URL = 'https://router.huggingface.co/hf-inference/models';

@Injectable()
export class EmbeddingServiceImplementation implements EmbeddingService {
  private readonly logger = new Logger(EmbeddingServiceImplementation.name);
  private readonly _model: string;
  private readonly _apiKey: string;

  constructor(private readonly _config: ConfigService) {
    this._model = this._config.get<string>('EMBEDDING_MODEL', HF_DEFAULT_MODEL);
    this._apiKey = this._config.getOrThrow<string>('HUGGINGFACE_API_KEY');

    this.logger.log(`Embedding provider: huggingface | model: ${this._model}`);
  }

  async embed(text: string): Promise<number[]> {
    const results = await this._call([text]);
    return results[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this._call(texts);
  }

  private async _call(inputs: string[]): Promise<number[][]> {
    const response = await fetch(`${HF_BASE_URL}/${this._model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this._apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs,
        options: { wait_for_model: true },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HuggingFace embedding error ${response.status}: ${body}`);
    }

    return response.json() as Promise<number[][]>;
  }
}
