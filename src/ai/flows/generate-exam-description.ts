'use server';

import { getGroqClient, GROQ_MODEL } from '@/lib/groq';

export type GenerateExamDescriptionInput = {
  topic: string;
};

export type GenerateExamDescriptionOutput = {
  description: string;
};

export async function generateExamDescription(
  input: GenerateExamDescriptionInput
): Promise<GenerateExamDescriptionOutput> {
  const groq = getGroqClient();

  const prompt = `Write a concise, professional exam description for the topic: "${input.topic}".
The description should be 2-3 sentences, suitable for an online exam platform.
Return ONLY a JSON object: {"description": "your description here"}`;

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '{"description":""}';
  return JSON.parse(content);
}
