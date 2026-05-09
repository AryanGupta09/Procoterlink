"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
export default function InterviewPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Mock Interviews</CardTitle>
          <CardDescription>
            Practice interviews in a real-world scenario and get instant AI-based coaching.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Planned features include:</p>
          <ul className="list-disc pl-6">
            <li>Behavioral, situational, and technical mock interview simulations</li>
            <li>Immediate performance feedback and improvement tips</li>
            <li>Playback and review of recorded answers</li>
            <li>Question bank tailored to your targeted job role</li>
          </ul>
          <p>Prepare for success—coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
