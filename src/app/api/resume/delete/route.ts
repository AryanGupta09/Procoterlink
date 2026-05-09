import { NextRequest, NextResponse } from 'next/server';
import { deleteResumeReview } from '@/lib/resume';
import { getPineconeIndex } from '@/lib/pinecone';

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resumeId = searchParams.get('resumeId');
    const userId = searchParams.get('userId');

    if (!resumeId || !userId) {
      return NextResponse.json(
        { error: 'Resume ID and User ID are required' },
        { status: 400 }
      );
    }

    // Delete from Firestore (includes chat messages)
    await deleteResumeReview(resumeId, userId);

    // Delete from Pinecone (background, don't wait)
    try {
      const index = await getPineconeIndex();
      // Delete all vectors for this resume
      // Query to find all vectors with this resumeId
      const queryResponse = await index.query({
        vector: new Array(3072).fill(0), // Dummy vector for metadata-only query
        topK: 1000, // Get all vectors
        includeMetadata: true,
        filter: {
          resumeId: { $eq: resumeId },
        },
      });

      if (queryResponse.matches && queryResponse.matches.length > 0) {
        const idsToDelete = queryResponse.matches.map(match => match.id);
        // Delete in batches - Pinecone delete method accepts array of IDs
        for (let i = 0; i < idsToDelete.length; i += 1000) {
          const batch = idsToDelete.slice(i, i + 1000);
          await index.deleteMany(batch);
        }
      }
    } catch (error) {
      console.error('Error deleting from Pinecone:', error);
      // Continue even if Pinecone deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete resume' },
      { status: 500 }
    );
  }
}

