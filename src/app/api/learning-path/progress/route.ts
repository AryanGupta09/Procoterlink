import { NextRequest, NextResponse } from 'next/server';
import { toggleWeekCompletion, getLearningPath } from '@/lib/learning-path';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { pathId, weekNumber, isCompleted } = body;

    // Validate required fields
    if (!pathId || weekNumber === undefined || isCompleted === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: pathId, weekNumber, isCompleted' },
        { status: 400 }
      );
    }

    // Toggle week completion
    await toggleWeekCompletion(pathId, parseInt(weekNumber), isCompleted);

    // Fetch updated path
    const updatedPath = await getLearningPath(pathId);

    return NextResponse.json({
      success: true,
      learningPath: updatedPath,
    });
  } catch (error: any) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update progress' },
      { status: 500 }
    );
  }
}

