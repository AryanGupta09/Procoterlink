"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
export default function RoadmapPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Career Roadmaps</CardTitle>
          <CardDescription>
            Visualize your journey for in-demand roles like Frontend, Backend, Data Science, and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Soon, this feature will allow:</p>
          <ul className="list-disc pl-6">
            <li>Stepwise guides for popular career tracks</li>
            <li>Self-assessments to understand your gaps</li>
            <li>Resource lists and community Q&A</li>
          </ul>
          <p>Map your future—coming soon!</p>
        </CardContent>
      </Card>
    </div>
  );
}
