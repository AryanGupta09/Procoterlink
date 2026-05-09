'use server';

import { getGroqClient, GROQ_MODEL } from '@/lib/groq';
import { getResumeReview } from '@/lib/resume';

/**
 * Analyze resume and provide review using Groq
 */
export async function analyzeResume(resumeText: string): Promise<string> {
  const groq = getGroqClient();

  const maxLength = 8000;
  const textToReview = resumeText.length > maxLength
    ? resumeText.substring(0, maxLength) + '\n\n[... Resume continues ...]'
    : resumeText;

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an expert resume reviewer and career advisor. Analyze resumes and give comprehensive feedback covering:
1. Overall structure and formatting
2. Content quality and clarity
3. Keywords and ATS optimization
4. Achievements and impact statements
5. Areas for improvement
6. Specific actionable recommendations

Be constructive, specific, and encouraging. Format your response in clear sections with markdown.`,
      },
      {
        role: 'user',
        content: `Please review this resume:\n\n${textToReview}`,
      },
    ],
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || 'Unable to analyze resume.';
}

/**
 * Chat with resume context using Groq
 */
export async function chatWithResume(
  resumeId: string,
  userMessage: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const groq = getGroqClient();

  const resume = await getResumeReview(resumeId);
  if (!resume) {
    throw new Error('Resume not found');
  }

  const resumeContext = resume.parsedText.substring(0, 2000);

  const messages = [
    {
      role: 'system' as const,
      content: `You are a helpful resume advisor. You have access to the user's resume and can answer questions about it, suggest improvements, and provide career advice.

Resume Context:
${resumeContext}

Answer questions based on the resume content. Be helpful, specific, and actionable.`,
    },
    ...chatHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || 'Unable to process your request.';
}

/**
 * Generate embeddings - fallback since Groq doesn't support embeddings
 * Using simple hash-based approach
 */
export async function generateResumeEmbedding(text: string): Promise<number[]> {
  const embedding = new Array(768).fill(0);
  for (let i = 0; i < text.length && i < 768; i++) {
    embedding[i] = (text.charCodeAt(i) % 100) / 100;
  }
  return embedding;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return generateResumeEmbedding(text);
}
