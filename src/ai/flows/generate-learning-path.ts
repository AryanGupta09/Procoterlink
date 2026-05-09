'use server';

import { getGroqClient, GROQ_MODEL } from '@/lib/groq';

export type GenerateLearningPathInput = {
  goal: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  hoursPerWeek: number;
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'mixed';
};

export type GenerateLearningPathOutput = {
  goal: string;
  duration: string;
  weeks: {
    week: number;
    topics: string[];
    resources: string[];
    milestones?: string[];
  }[];
  summary?: string;
};

export async function generateLearningPath(
  input: GenerateLearningPathInput
): Promise<GenerateLearningPathOutput> {
  const groq = getGroqClient();

  const prompt = `Create a personalized week-by-week learning path for:
- Goal: ${input.goal}
- Skill Level: ${input.skillLevel}
- Hours per week: ${input.hoursPerWeek}
- Learning Style: ${input.learningStyle}

Return ONLY a valid JSON object in this format:
{
  "goal": "goal here",
  "duration": "X weeks",
  "summary": "brief summary",
  "weeks": [
    {
      "week": 1,
      "topics": ["topic1", "topic2"],
      "resources": ["resource1", "resource2"],
      "milestones": ["milestone1"]
    }
  ]
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
