"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
export default function CoursesPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Recommended Courses</CardTitle>
          <CardDescription>
            Curated courses based on your recent exam performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            This section will provide you with:
          </p>
          <ul className="list-disc pl-6">
            <li>Personalized course recommendations to improve weak topics</li>
            <li>Video tutorials, interactive exercises, and readings</li>
            <li>Progress tracking and certificates</li>
            <li>Ability to bookmark, join, and review courses</li>
          </ul>
          <p>Built for your learning journey—coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
