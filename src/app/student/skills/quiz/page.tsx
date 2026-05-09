"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
export default function QuizPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Practice Quizzes</CardTitle>
          <CardDescription>
            Take topic-wise quizzes and get instant explanations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>This section will offer:</p>
          <ul className="list-disc pl-6">
            <li>Short, focused quizzes on weak areas or topics</li>
            <li>Instant answer feedback and concept breakdowns</li>
            <li>Quiz history with progress analytics</li>
          </ul>
          <p>Sharpen your skills—coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
