declare module 'pdf-parse' {
  interface TextResult {
    text: string;
    numPages?: number;
  }

  interface LoadParameters {
    data?: Buffer;
    url?: string;
    password?: string;
  }

  class PDFParse {
    constructor(params: LoadParameters);
    getText(options?: { partial?: number[]; first?: number }): Promise<TextResult>;
    destroy(): Promise<void>;
  }

  export { PDFParse };
}
