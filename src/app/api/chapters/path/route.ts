import { NextRequest, NextResponse } from 'next/server';
import { getChapter } from '@/lib/chapters';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chapterId = searchParams.get('id');

    if (!chapterId) {
      return NextResponse.json(
        { error: 'Chapter ID is required as query parameter: ?id=chapterId' },
        { status: 400 }
      );
    }

    const chapter = await getChapter(chapterId);

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      chapter,
    });
  } catch (error: any) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}

