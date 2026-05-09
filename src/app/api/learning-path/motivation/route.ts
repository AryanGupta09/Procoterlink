import { NextRequest, NextResponse } from 'next/server';
import { generateMotivationalTip } from '@/ai/flows/generate-motivational-tip';
import { getLearningPath } from '@/lib/learning-path';

function getErrorMessage(error: any): { message: string; status: number } {
  // Check for rate limiting (429)
  if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
    return {
      message: 'API rate limit exceeded. Please wait a moment and try again.',
      status: 429,
    };
  }

  // Check for bad request (400)
  if (error.status === 400 || error.message?.includes('400')) {
    return {
      message: 'Invalid request. Please check your input and try again.',
      status: 400,
    };
  }

  // Check for authentication errors
  if (error.status === 401 || error.message?.includes('API key') || error.message?.includes('authentication')) {
    return {
      message: 'API authentication failed. Please check your API configuration.',
      status: 401,
    };
  }

  // Generic error
  return {
    message: error.message || 'Failed to generate motivational tip. Please try again later.',
    status: 500,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pathId } = body;

    if (!pathId) {
      return NextResponse.json(
        { error: 'Missing required field: pathId' },
        { status: 400 }
      );
    }

    // Get learning path
    const learningPath = await getLearningPath(pathId);
    if (!learningPath) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      );
    }

    // Generate motivational tip
    const tip = await generateMotivationalTip({
      goal: learningPath.goal,
      progress: learningPath.progress,
      completedWeeks: learningPath.completedWeeks.length,
      totalWeeks: learningPath.roadmap.weeks.length,
    });

    return NextResponse.json({
      success: true,
      tip,
    });
  } catch (error: any) {
    console.error('Error generating motivational tip:', error);
    const { message, status } = getErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

