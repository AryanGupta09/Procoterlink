'use server';

import { getGroqClient, GROQ_MODEL } from '@/lib/groq';

export type GenerateChapterContentInput = {
  chapterTitle: string;
  chapterDescription: string;
  weekTopics: string[];
  skillLevel: string;
  learningStyle: string;
};

export type GenerateChapterContentOutput = {
  introduction: string;
  mainContent: string;
  keyPoints: string[];
  exercises: string[];
  summary: string;
};

export async function generateChapterContent(
  input: GenerateChapterContentInput
): Promise<GenerateChapterContentOutput> {
  const groq = getGroqClient();

  const prompt = `Generate detailed educational content for the chapter: "${input.chapterTitle}"
Description: ${input.chapterDescription}
Related topics: ${input.weekTopics.join(', ')}
Skill Level: ${input.skillLevel}
Learning Style: ${input.learningStyle}

Return ONLY a valid JSON object:
{
  "introduction": "Brief introduction paragraph",
  "mainContent": "Main educational content in markdown format",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "exercises": ["exercise 1", "exercise 2"],
  "summary": "Brief summary paragraph"
}`;

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '{}';
  return JSON.parse(content);
}
