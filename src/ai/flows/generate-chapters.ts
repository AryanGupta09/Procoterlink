'use server';

import { getGroqClient, GROQ_MODEL } from '@/lib/groq';

export type GenerateChaptersInput = {
  weekNumber: number;
  topics: string[];
  skillLevel: string;
  learningStyle: string;
};

export type GenerateChaptersOutput = {
  chapters: {
    title: string;
    description: string;
    order: number;
  }[];
};

export async function generateChapters(
  input: GenerateChaptersInput
): Promise<GenerateChaptersOutput> {
  const groq = getGroqClient();

  const prompt = `Generate chapters for Week ${input.weekNumber} of a learning path.
Topics to cover: ${input.topics.join(', ')}
Skill Level: ${input.skillLevel}
Learning Style: ${input.learningStyle}

Return ONLY a valid JSON object:
{
  "chapters": [
    {
      "order": 1,
      "title": "Chapter title",
      "description": "Brief description of what this chapter covers"
    }
  ]
}

Generate 3-5 chapters that cover the topics progressively.`;

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '{"chapters":[]}';
  return JSON.parse(content);
}
