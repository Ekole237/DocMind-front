declare module 'mammoth' {
  interface ExtractionResult {
    value: string;
    messages: unknown[];
  }

  function extractRawText(options: {
    buffer: Buffer;
  }): Promise<ExtractionResult>;
  function convertToHtml(options: {
    buffer: Buffer;
  }): Promise<ExtractionResult>;
}
