import { NextRequest, NextResponse } from 'next/server';
import { getLearningPath } from '@/lib/learning-path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pathId = searchParams.get('id');

    if (!pathId) {
      return NextResponse.json(
        { error: 'Path ID is required as query parameter: ?id=pathId' },
        { status: 400 }
      );
    }

    const learningPath = await getLearningPath(pathId);

    if (!learningPath) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      learningPath,
    });
  } catch (error: any) {
    console.error('Error fetching learning path:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch learning path' },
      { status: 500 }
    );
  }
}

