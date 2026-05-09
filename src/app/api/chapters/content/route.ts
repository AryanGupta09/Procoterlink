import { NextRequest, NextResponse } from 'next/server';
import { generateChapterContent } from '@/ai/flows/generate-chapter-content';
import { updateChapterContent, getChapter } from '@/lib/chapters';
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
    message: error.message || 'Failed to generate chapter content. Please try again later.',
    status: 500,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapterId } = body;

    if (!chapterId) {
      return NextResponse.json(
        { error: 'Missing required field: chapterId' },
        { status: 400 }
      );
    }

    // Get chapter
    const chapter = await getChapter(chapterId);
    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    // Get learning path for context
    const learningPath = await getLearningPath(chapter.pathId);
    if (!learningPath) {
      return NextResponse.json(
        { error: 'Learning path not found' },
        { status: 404 }
      );
    }

    // Find the week
    const week = learningPath.roadmap.weeks.find(w => w.week === chapter.weekNumber);
    if (!week) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      );
    }

    // Generate detailed content using Gemini
    const content = await generateChapterContent({
      chapterTitle: chapter.title,
      chapterDescription: chapter.description,
      weekTopics: week.topics,
      skillLevel: learningPath.skillLevel,
      learningStyle: learningPath.learningStyle,
    });

    // Save content to Firestore
    await updateChapterContent(chapterId, content);

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error: any) {
    console.error('Error generating chapter content:', error);
    const { message, status } = getErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

