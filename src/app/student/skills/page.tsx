
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Compass, FileText, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';

export default function SkillsAndCareerHubPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [recommendedTags, setRecommendedTags] = useState<Array<{ tag: string; count: number }>>([]);

  useEffect(() => {
    if (!user?.email) return;

    const fetchRecommendations = async () => {
      setLoadingRecs(true);
      try {
        // Fetch student's submissions
        const submissionsQ = query(
          collection(db, 'submissions'),
          where('participantEmail', '==', user.email)
        );
        const submissionsSnap = await getDocs(submissionsQ);

        // For each low-score submission, pull exam tags
        const tagCounts: Record<string, number> = {};
        for (const subDoc of submissionsSnap.docs) {
          const data = subDoc.data() as any;
          if (!data || typeof data.score !== 'number' || typeof data.totalQuestions !== 'number') continue;
          const percentage = (data.score / (data.totalQuestions || 1)) * 100;
          if (percentage >= 60) continue;

          if (!data.examId) continue;
          const examRef = doc(db, 'exams', data.examId);
          const examSnap = await getDoc(examRef);
          if (examSnap.exists()) {
            const exam = examSnap.data() as any;
            const tags: string[] = Array.isArray(exam?.tags) ? exam.tags : [];
            for (const rawTag of tags) {
              const tag = String(rawTag || '').trim();
              if (!tag) continue;
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
          }
        }

        const sorted = Object.entries(tagCounts)
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
        setRecommendedTags(sorted);
      } catch (e) {
        console.error('Failed to build recommendations', e);
        setRecommendedTags([]);
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  return (
    <div className="flex flex-col gap-8 px-2 sm:px-0">
      <div className="rounded-2xl border bg-gradient-to-br from-primary/5 via-primary/0 to-primary/5 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Grow & Career Hub</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Personalized learning paths, curated courses, resume improvements, and AI mock interviews to help you level up.
            </p>
          </div>
          <div className="hidden sm:block">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>Recommended Courses</CardTitle>
            </div>
            <CardDescription>
              Curated courses based on your recent exam performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0">
            {loadingRecs ? (
              <div className="text-sm text-muted-foreground">Analyzing your results and preparing suggestions...</div>
            ) : recommendedTags.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm font-medium">Suggested topics to focus on:</div>
                <div className="flex flex-wrap gap-2">
                  {recommendedTags.map(({ tag, count }) => (
                    <span key={tag} className="text-xs rounded-full border px-3 py-1 bg-background">
                      {tag} <span className="text-muted-foreground">×{count}</span>
                    </span>
                  ))}
                </div>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 leading-relaxed">
                  {recommendedTags.map(({ tag }) => (
                    <li key={tag}>Start with fundamentals of {tag}, then build a mini project using {tag}.</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  No personalized suggestions yet. Take an exam or improve further to see tailored recommendations.
                </div>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 leading-relaxed">
                  <li>Core concepts refreshers</li>
                  <li>Practice quizzes with solutions</li>
                  <li>Hands-on projects</li>
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button asChild variant="default" className="bg-brand-primary hover:bg-brand-dark text-white">
              <Link href="/student/skills/courses">View Courses</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-6">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              <CardTitle>Learning Path Generator</CardTitle>
            </div>
            <CardDescription>
              Generate a personalized plan to reach your target skills
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0">
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 leading-relaxed">
              <li>Adaptive milestones</li>
              <li>Daily/weekly goals</li>
              <li>Track progress over time</li>
            </ul>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button asChild variant="outline">
              <Link href="/student/skills/path">Open Generator</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Resume Improvement</CardTitle>
            </div>
            <CardDescription>
              Get targeted suggestions to strengthen your resume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0">
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 leading-relaxed">
              <li>ATS-friendly formatting</li>
              <li>Impactful bullet points</li>
              <li>Skill gap highlights</li>
            </ul>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button asChild variant="default" className="bg-brand-primary hover:bg-brand-dark text-white">
              <Link href="/student/skills/resume">Improve Resume</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-6">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle>AI Mock Interviews</CardTitle>
            </div>
            <CardDescription>
              Practice interviews with instant feedback and coaching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0">
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 leading-relaxed">
              <li>Behavioral and technical questions</li>
              <li>Real-time hints and scoring</li>
              <li>Actionable improvement tips</li>
            </ul>
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button asChild variant="outline">
              <Link href="/student/skills/interview">Start Mock Interview</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* More features row */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-6">
            <CardTitle className="text-base">Practice Quizzes</CardTitle>
            <CardDescription>Topic-wise quizzes with instant explanations</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 text-sm text-muted-foreground">
            Sharpen skills with short, focused sets.
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button asChild variant="outline">
              <Link href="/student/skills/quiz">Practice Now</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-6">
            <CardTitle className="text-base">Interview Question Bank</CardTitle>
            <CardDescription>Handpicked behavioral and technical prompts</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 text-sm text-muted-foreground">
            Prepare fast with scenario-based Q&A.
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button asChild variant="outline">
              <Link href="/student/skills/questions">Browse Questions</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-6">
            <CardTitle className="text-base">Career Roadmaps</CardTitle>
            <CardDescription>Milestones for roles like Frontend, Backend, DS</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 text-sm text-muted-foreground">
            Clear next steps with curated resources.
          </CardContent>
          <CardFooter className="p-6 pt-0">
            <Button asChild variant="outline">
              <Link href="/student/skills/roadmap">View Roadmaps</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="rounded-xl border bg-muted/40 p-5">
        <div className="flex items-start gap-3">
          <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <div className="text-sm font-semibold">Keep Improving</div>
            <p className="text-sm text-muted-foreground mt-1">New features will roll out here. Check back soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
}


