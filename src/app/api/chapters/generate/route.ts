import { NextRequest, NextResponse } from 'next/server';
import { generateChapters } from '@/ai/flows/generate-chapters';
import { createChapters } from '@/lib/chapters';
import { getLearningPath } from '@/lib/learning-path';

function getErrorMessage(error: any): { message: string; status: number } {
  if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
    return {
      message: 'API rate limit exceeded. Please wait a moment and try again.',
      status: 429,
    };
  }
  if (error.status === 400 || error.message?.includes('400')) {
    return {
      message: 'Invalid request. Please check your input and try again.',
      status: 400,
    };
  }
  return {
    message: error.message || 'Failed to generate chapters. Please try again later.',
    status: 500,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pathId, weekNumber } = body;

    if (!pathId || !weekNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: pathId, weekNumber' },
        { status: 400 }
      );
    }

    // Get learning path to get week details
    const learningPath = await getLearningPath(pathId);
    if (!learningPath) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      );
    }

    // Find the week
    const week = learningPath.roadmap.weeks.find(w => w.week === parseInt(weekNumber));
    if (!week) {
      return NextResponse.json(
        { error: 'Week not found in learning path' },
        { status: 404 }
      );
    }

    // Generate chapters using Gemini
    const chaptersData = await generateChapters({
      weekNumber: week.week,
      topics: week.topics,
      skillLevel: learningPath.skillLevel,
      learningStyle: learningPath.learningStyle,
    });

    // Save chapters to Firestore
    const chapterIds = await createChapters(pathId, week.week, chaptersData.chapters);

    return NextResponse.json({
      success: true,
      chapters: chaptersData.chapters.map((ch, idx) => ({
        ...ch,
        id: chapterIds[idx],
      })),
    });
  } catch (error: any) {
    console.error('Error generating chapters:', error);
    const { message, status } = getErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

