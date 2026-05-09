"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
export default function InterviewQuestionsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Interview Question Bank</CardTitle>
          <CardDescription>
            Access a collection of technical and behavioral questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>This space will feature:</p>
          <ul className="list-disc pl-6">
            <li>Scenario-based, job-specific sample questions</li>
            <li>Model answers and expert reasoning</li>
            <li>Bookmark, search, and organize Q&As</li>
          </ul>
          <p>Prepare smarter—coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
