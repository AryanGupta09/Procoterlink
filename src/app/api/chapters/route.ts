import { NextRequest, NextResponse } from 'next/server';
import { getWeekChapters } from '@/lib/chapters';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pathId = searchParams.get('pathId');
    const weekNumber = searchParams.get('weekNumber');

    if (!pathId || !weekNumber) {
      return NextResponse.json(
        { error: 'Missing required query parameters: pathId, weekNumber' },
        { status: 400 }
      );
    }

    const chapters = await getWeekChapters(pathId, parseInt(weekNumber));

    return NextResponse.json({
      success: true,
      chapters,
    });
  } catch (error: any) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chapters' },
      { status: 500 }
    );
  }
}

