import { NextRequest, NextResponse } from 'next/server';
import { generateLearningPath } from '@/ai/flows/generate-learning-path';
import { createLearningPath } from '@/lib/learning-path';

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
    message: error.message || 'Failed to generate learning path. Please try again later.',
    status: 500,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, goal, skillLevel, hoursPerWeek, learningStyle } = body;

    // Validate required fields
    if (!userId || !goal || !skillLevel || !hoursPerWeek) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, goal, skillLevel, hoursPerWeek' },
        { status: 400 }
      );
    }

    // Validate skill level
    if (!['beginner', 'intermediate', 'advanced'].includes(skillLevel)) {
      return NextResponse.json(
        { error: 'Invalid skillLevel. Must be beginner, intermediate, or advanced' },
        { status: 400 }
      );
    }

    // Validate learning style
    const validLearningStyles = ['visual', 'hands-on', 'reading', 'mixed'];
    const finalLearningStyle = learningStyle || 'mixed';
    if (!validLearningStyles.includes(finalLearningStyle)) {
      return NextResponse.json(
        { error: 'Invalid learningStyle. Must be visual, hands-on, reading, or mixed' },
        { status: 400 }
      );
    }

    // Generate learning path using Gemini
    const roadmap = await generateLearningPath({
      goal,
      skillLevel,
      hoursPerWeek: parseInt(hoursPerWeek),
      learningStyle: finalLearningStyle,
    });

    // Save to Firestore
    const pathId = await createLearningPath(
      userId,
      goal,
      skillLevel,
      parseInt(hoursPerWeek),
      finalLearningStyle,
      roadmap
    );

    return NextResponse.json({
      success: true,
      pathId,
      roadmap,
    });
  } catch (error: any) {
    console.error('Error generating learning path:', error);
    const { message, status } = getErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

