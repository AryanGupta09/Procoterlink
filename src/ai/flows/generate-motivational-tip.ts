'use server';

import { getGroqClient, GROQ_MODEL } from '@/lib/groq';

export type GenerateMotivationalTipInput = {
  goal: string;
  progress: number;
  completedWeeks: number;
  totalWeeks: number;
};

export type GenerateMotivationalTipOutput = {
  tip: string;
};

export async function generateMotivationalTip(
  input: GenerateMotivationalTipInput
): Promise<GenerateMotivationalTipOutput> {
  const groq = getGroqClient();

  const prompt = `Generate a short motivational tip for a student:
- Learning goal: ${input.goal}
- Progress: ${input.progress}%
- Completed ${input.completedWeeks} out of ${input.totalWeeks} weeks

Return ONLY a JSON object: {"tip": "your motivational tip here"}
Keep it encouraging, specific, and under 3 sentences.`;

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '{"tip":"Keep going!"}';
  return JSON.parse(content);
}
