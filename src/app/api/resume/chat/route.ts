import { NextRequest, NextResponse } from 'next/server';
import { chatWithResume } from '@/ai/flows/resume-review';
import { addChatMessage, getResumeChatMessages } from '@/lib/resume';

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
    message: error.message || 'Failed to process chat message. Please try again later.',
    status: 500,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeId, userId, message } = body;

    if (!resumeId || !userId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeId, userId, message' },
        { status: 400 }
      );
    }

    // Get chat history
    const chatHistory = await getResumeChatMessages(resumeId);
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Save user message
    await addChatMessage(resumeId, userId, 'user', message);

    // Get AI response
    const aiResponse = await chatWithResume(resumeId, message, formattedHistory);

    // Save AI response
    await addChatMessage(resumeId, userId, 'assistant', aiResponse);

    return NextResponse.json({
      success: true,
      response: aiResponse,
    });
  } catch (error: any) {
    console.error('Error in chat:', error);
    const { message, status } = getErrorMessage(error);
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const resumeId = searchParams.get('resumeId');

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Resume ID is required' },
        { status: 400 }
      );
    }

    const messages = await getResumeChatMessages(resumeId);

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error: any) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}
