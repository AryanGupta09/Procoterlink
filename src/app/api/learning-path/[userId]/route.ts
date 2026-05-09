import { NextRequest, NextResponse } from 'next/server';
import { getUserLearningPaths } from '@/lib/learning-path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const learningPaths = await getUserLearningPaths(userId);

    return NextResponse.json({
      success: true,
      learningPaths,
    });
  } catch (error: any) {
    console.error('Error fetching learning paths:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch learning paths' },
      { status: 500 }
    );
  }
}

