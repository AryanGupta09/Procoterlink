'use server';

import { getGroqClient, GROQ_MODEL } from '@/lib/groq';

export type GenerateExamQuestionsInput = {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  numberOfQuestions: number;
};

export type GenerateExamQuestionsOutput = {
  questions: {
    questionText: string;
    options: string[];
    correctAnswer: string;
  }[];
};

export async function generateExamQuestions(
  input: GenerateExamQuestionsInput
): Promise<GenerateExamQuestionsOutput> {
  const groq = getGroqClient();

  const prompt = `Generate ${input.numberOfQuestions} multiple choice questions on the topic "${input.topic}" with difficulty level "${input.difficulty}".

Return ONLY a valid JSON object in this exact format:
{
  "questions": [
    {
      "questionText": "Question here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A"
    }
  ]
}

Rules:
- Each question must have exactly 4 options
- correctAnswer must exactly match one of the options
- Return only JSON, no extra text`;

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '{"questions":[]}';
  return JSON.parse(content);
}
