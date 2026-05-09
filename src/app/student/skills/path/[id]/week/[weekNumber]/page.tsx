"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BookOpen, Loader2, ArrowRight, GraduationCap } from 'lucide-react';
import { Chapter } from '@/lib/chapters';
import { getLearningPath } from '@/lib/learning-path';
import { LearningPath } from '@/lib/learning-path';

export default function WeekChaptersPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const pathId = params.id as string;
  const weekNumber = parseInt(params.weekNumber as string);
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (pathId && weekNumber && user?.uid) {
      loadData();
    }
  }, [pathId, weekNumber, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load learning path
      const pathResponse = await fetch(`/api/learning-path/path?id=${pathId}`);
      const pathData = await pathResponse.json();
      
      if (!pathResponse.ok || !pathData.success) {
        throw new Error(pathData.error || 'Failed to load learning path');
      }
      
      if (pathData.learningPath.userId !== user?.uid) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have access to this learning path.',
        });
        router.push('/student/skills/path');
        return;
      }
      
      setLearningPath(pathData.learningPath);
      
      // Load chapters
      await loadChapters();
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load data.',
      });
      router.push(`/student/skills/path/${pathId}`);
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async () => {
    try {
      const response = await fetch(`/api/chapters?pathId=${pathId}&weekNumber=${weekNumber}`);
      const data = await response.json();
      
      if (data.success && data.chapters) {
        setChapters(data.chapters);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const handleGenerateChapters = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/chapters/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pathId,
          weekNumber,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(`Server error (${response.status}). Please try again later.`);
      }

      if (!response.ok) {
        const errorMessage = data?.error || `Server error (${response.status})`;
        throw new Error(errorMessage);
      }

      if (data.success && data.chapters) {
        // Reload chapters
        await loadChapters();
        toast({
          title: 'Success!',
          description: 'Chapters generated successfully.',
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to generate chapters.';
      const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('429') || errorMessage.includes('Rate Limit');
      
      toast({
        variant: 'destructive',
        title: isRateLimit ? 'Rate Limit Exceeded' : 'Generation Failed',
        description: errorMessage,
        duration: isRateLimit ? 8000 : 5000,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleChapterClick = (chapterId: string) => {
    router.push(`/student/skills/path/${pathId}/week/${weekNumber}/chapter/${chapterId}`);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!learningPath) {
    return null;
  }

  const week = learningPath.roadmap.weeks.find(w => w.week === weekNumber);

  return (
    <div className="max-w-5xl mx-auto p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/student/skills/path/${pathId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">Week {weekNumber}</Badge>
            <Badge variant="outline">{learningPath.roadmap.goal}</Badge>
          </div>
          <h1 className="text-3xl font-bold">Week {weekNumber} Chapters</h1>
          {week && (
            <p className="text-muted-foreground mt-1">
              {week.topics.join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Week Overview */}
      {week && (
        <Card>
          <CardHeader>
            <CardTitle>Week Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Topics to Cover:</h4>
              <div className="flex flex-wrap gap-2">
                {week.topics.map((topic, idx) => (
                  <Badge key={idx} variant="secondary">{topic}</Badge>
                ))}
              </div>
            </div>
            {week.milestones && week.milestones.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Milestones:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {week.milestones.map((milestone, idx) => (
                    <li key={idx}>{milestone}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chapters List */}
      {chapters.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Chapters Yet</h3>
            <p className="text-muted-foreground mb-6">
              Generate chapters for this week to start your learning journey.
            </p>
            <Button onClick={handleGenerateChapters} disabled={generating} size="lg">
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Chapters...
                </>
              ) : (
                <>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Generate Chapters
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Chapters</h2>
            <Badge variant="secondary">{chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {chapters.map((chapter) => (
              <Card 
                key={chapter.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => chapter.id && handleChapterClick(chapter.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Chapter {chapter.order}</Badge>
                      </div>
                      <CardTitle className="text-lg">{chapter.title}</CardTitle>
                      <CardDescription className="mt-2">{chapter.description}</CardDescription>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      chapter.id && handleChapterClick(chapter.id);
                    }}
                  >
                    Start Learning
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

