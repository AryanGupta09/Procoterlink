import { NextRequest, NextResponse } from 'next/server';
import { parsePDFResume, parseTextResume, parseDOCXResume } from '@/lib/resume-parser';
import { createResumeReview, updateResumeEmbeddingsStatus } from '@/lib/resume';
import { analyzeResume, generateResumeEmbedding } from '@/ai/flows/resume-review';
import { getPineconeIndex } from '@/lib/pinecone';
import { chunkResumeText } from '@/lib/resume-parser';

// Background function to index resume in Pinecone (non-blocking)
async function indexResumeInBackground(resumeId: string, userId: string, resumeText: string) {
  try {
    const index = await getPineconeIndex();
    const chunks = chunkResumeText(resumeText, 1500, 300); // Larger chunks for small resumes
    
    // Limit chunks for small resumes (max 10 chunks)
    const limitedChunks = chunks.slice(0, 10);
    
    // Generate embeddings in parallel (but limit concurrency)
    const vectors = await Promise.all(
      limitedChunks.map(async (chunk, idx) => {
        try {
          const embedding = await generateResumeEmbedding(chunk);
          return {
            id: `${resumeId}-chunk-${idx}`,
            values: embedding,
            metadata: {
              resumeId,
              userId,
              chunkIndex: idx,
              text: chunk.substring(0, 500),
            },
          };
        } catch (error) {
          console.error(`Error generating embedding for chunk ${idx}:`, error);
          return null;
        }
      })
    );

    // Filter out null values
    const validVectors = vectors.filter(v => v !== null) as any[];

    if (validVectors.length > 0) {
      // Upsert to Pinecone in batches
      for (let i = 0; i < validVectors.length; i += 100) {
        const batch = validVectors.slice(i, i + 100);
        await index.upsert(batch);
      }

      await updateResumeEmbeddingsStatus(resumeId, true, true);
    }
  } catch (error) {
    console.error('Error indexing in Pinecone (background):', error);
    // Don't throw - this is background processing
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for 1-3 page resumes)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Please upload a resume that is 1-3 pages (max 5MB).' },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse resume based on file type
    let parsedResume;
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (fileExtension === 'pdf') {
      parsedResume = await parsePDFResume(buffer, fileName);
    } else if (fileExtension === 'docx') {
      parsedResume = await parseDOCXResume(buffer, fileName);
    } else if (fileExtension === 'txt') {
      parsedResume = await parseTextResume(buffer, fileName);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT file.' },
        { status: 400 }
      );
    }

    // Limit text length for small resumes (max 10,000 characters)
    const maxTextLength = 10000;
    const resumeText = parsedResume.text.length > maxTextLength 
      ? parsedResume.text.substring(0, maxTextLength) 
      : parsedResume.text;

    // Save to Firestore
    const resumeId = await createResumeReview(
      userId,
      fileName,
      resumeText,
      resumeText,
      parsedResume.metadata
    );

    // Generate AI review (this is the main operation - return immediately after)
    let review: string;
    try {
      review = await analyzeResume(resumeText);
    } catch (error: any) {
      // Handle rate limit errors gracefully
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
        return NextResponse.json(
          { 
            error: 'API rate limit exceeded. Please wait a moment and try again. If this persists, check your Google Gemini API quota.',
            errorCode: 'RATE_LIMIT',
            resumeId, // Still return resumeId so user can retry later
          },
          { status: 429 }
        );
      }
      throw error; // Re-throw other errors
    }

    // Start Pinecone indexing in background (don't wait for it)
    indexResumeInBackground(resumeId, userId, resumeText).catch(err => {
      console.error('Background indexing error:', err);
    });

    // Return immediately with review
    return NextResponse.json({
      success: true,
      resumeId,
      review,
      parsedResume: {
        text: resumeText.substring(0, 500), // Return preview
        metadata: parsedResume.metadata,
      },
      indexed: false, // Will be indexed in background
    });
  } catch (error: any) {
    console.error('Error uploading resume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload and process resume' },
      { status: 500 }
    );
  }
}
