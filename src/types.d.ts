declare module "pdf-parse" {
  export default function pdfParse(
    dataBuffer: Buffer,
    options?: any
  ): Promise<{
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }>;
}

declare module "vitest" {
  export const describe: any;
  export const it: any;
  export const expect: any;
  export const beforeEach: any;
}
