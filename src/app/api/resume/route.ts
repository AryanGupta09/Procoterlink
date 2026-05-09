import { NextRequest, NextResponse } from 'next/server';
import { getUserResumeReviews, getResumeReview } from '@/lib/resume';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const resumeId = searchParams.get('resumeId');

    if (resumeId) {
      // Get single resume
      const resume = await getResumeReview(resumeId);
      if (!resume) {
        return NextResponse.json(
          { error: 'Resume not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        resume,
      });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get all resumes for user
    const resumes = await getUserResumeReviews(userId);

    return NextResponse.json({
      success: true,
      resumes,
    });
  } catch (error: any) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch resumes' },
      { status: 500 }
    );
  }
}

