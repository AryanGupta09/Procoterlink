/**
 * @fileOverview Resume parsing utilities
 */

export interface ParsedResume {
  text: string;
  metadata: {
    fileName: string;
    pageCount: number;
    fileSize: number;
  };
}

/**
 * Parse PDF resume file using pdf-parse (server-side only)
 */
export async function parsePDFResume(fileBuffer: Buffer, fileName: string): Promise<ParsedResume> {
  try {
    // Use require for pdf-parse to avoid ESM issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(fileBuffer);

    return {
      text: data.text || '',
      metadata: {
        fileName,
        pageCount: data.numpages || 1,
        fileSize: fileBuffer.length,
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse DOCX resume file
 */
export async function parseDOCXResume(fileBuffer: Buffer, fileName: string): Promise<ParsedResume> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: fileBuffer });

    const wordCount = result.value.split(/\s+/).length;
    const estimatedPages = Math.max(1, Math.ceil(wordCount / 500));

    return {
      text: result.value,
      metadata: {
        fileName,
        pageCount: estimatedPages,
        fileSize: fileBuffer.length,
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse plain text resume file
 */
export async function parseTextResume(fileBuffer: Buffer, fileName: string): Promise<ParsedResume> {
  return {
    text: fileBuffer.toString('utf-8'),
    metadata: {
      fileName,
      pageCount: 1,
      fileSize: fileBuffer.length,
    },
  };
}

/**
 * Chunk resume text for embedding
 */
export function chunkResumeText(text: string, chunkSize = 1000, overlap = 200): string[] {
  if (!text || text.length === 0) return [];

  chunkSize = Math.max(100, Math.min(chunkSize, 5000));
  overlap = Math.max(0, Math.min(overlap, chunkSize - 1));

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length && chunks.length < 100) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    const nextStart = end - overlap;
    start = nextStart <= start ? end : nextStart;
    if (start >= text.length) break;
  }

  return chunks;
}
