"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  BookOpen, 
  Clock, 
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  Loader2,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { LearningPath } from '@/lib/learning-path';

export default function LearningPathDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const pathId = params.id as string;
  
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [motivationalTip, setMotivationalTip] = useState<{ message: string; emoji?: string } | null>(null);
  const [loadingTip, setLoadingTip] = useState(false);

  useEffect(() => {
    if (pathId && user?.uid) {
      loadLearningPath();
    }
  }, [pathId, user]);

  const loadLearningPath = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/learning-path/path?id=${pathId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load learning path');
      }
      
      if (data.success && data.learningPath) {
        // Verify ownership
        if (data.learningPath.userId !== user?.uid) {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have access to this learning path.',
          });
          router.push('/student/skills/path');
          return;
        }
        
        setLearningPath(data.learningPath);
      } else {
        throw new Error('Learning path not found');
      }
    } catch (error: any) {
      console.error('Error loading learning path:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load learning path.',
      });
      router.push('/student/skills/path');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWeek = async (weekNumber: number, isCompleted: boolean) => {
    if (!learningPath?.id) return;

    try {
      const response = await fetch('/api/learning-path/progress', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pathId: learningPath.id,
          weekNumber,
          isCompleted,
        }),
      });

      const data = await response.json();

      if (data.success && data.learningPath) {
        setLearningPath(data.learningPath);
        toast({
          title: isCompleted ? 'Week Completed!' : 'Week Unmarked',
          description: `Week ${weekNumber} ${isCompleted ? 'marked as complete' : 'unmarked'}.`,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update progress.',
      });
    }
  };

  const handleGetMotivation = async () => {
    if (!learningPath?.id) return;

    setLoadingTip(true);
    try {
      const response = await fetch('/api/learning-path/motivation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pathId: learningPath.id,
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

      if (data.success && data.tip) {
        setMotivationalTip(data.tip);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to generate motivational tip.';
      const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('429') || errorMessage.includes('Rate Limit');
      
      toast({
        variant: 'destructive',
        title: isRateLimit ? 'Rate Limit Exceeded' : 'Failed',
        description: errorMessage,
        duration: isRateLimit ? 8000 : 5000,
      });
    } finally {
      setLoadingTip(false);
    }
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

  const roadmap = learningPath.roadmap;

  return (
    <div className="max-w-5xl mx-auto p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/student/skills/path')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{roadmap.goal}</h1>
          <p className="text-muted-foreground mt-1">
            {roadmap.summary || `A ${roadmap.duration} personalized learning journey`}
          </p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-semibold">{learningPath.progress}%</span>
            </div>
            <Progress value={learningPath.progress} className="h-2" />
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{roadmap.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>{learningPath.completedWeeks.length} of {roadmap.weeks.length} weeks completed</span>
            </div>
            <Badge variant="secondary">{learningPath.skillLevel}</Badge>
            <Badge variant="outline">{learningPath.hoursPerWeek} hrs/week</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Generated Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Your Learning Roadmap
          </CardTitle>
          <CardDescription>
            Week-by-week breakdown of your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {roadmap.weeks.map((week, index) => {
            const isCompleted = learningPath.completedWeeks.includes(week.week);
            return (
              <div key={week.week} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isCompleted 
                        ? 'bg-green-100 border-green-500 text-green-700' 
                        : 'bg-gray-100 border-gray-300 text-gray-700'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="font-semibold">{week.week}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Week {week.week}</h3>
                      <p className="text-sm text-muted-foreground">
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isCompleted}
                    onCheckedChange={(checked) => handleToggleWeek(week.week, checked)}
                  />
                </div>

                <div className="ml-13 space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Topics to Cover:</h4>
                    <div className="flex flex-wrap gap-2">
                      {week.topics.map((topic, idx) => (
                        <Badge key={idx} variant="secondary">{topic}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Resources:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {week.resources.map((resource, idx) => (
                        <li key={idx}>{resource}</li>
                      ))}
                    </ul>
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

                  <div className="pt-2">
                    <Button
                      onClick={() => router.push(`/student/skills/path/${pathId}/week/${week.week}`)}
                      className="w-full sm:w-auto"
                    >
                      <GraduationCap className="mr-2 h-4 w-4" />
                      Learn
                    </Button>
                  </div>
                </div>

                {index < roadmap.weeks.length - 1 && <Separator className="mt-4" />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Motivational Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Motivational Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {motivationalTip ? (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <p className="text-lg">
                {motivationalTip.emoji && <span className="mr-2">{motivationalTip.emoji}</span>}
                {motivationalTip.message}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Get personalized encouragement based on your progress!
            </p>
          )}
          <Button 
            onClick={handleGetMotivation} 
            disabled={loadingTip}
            variant="outline"
            className="w-full"
          >
            {loadingTip ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get Motivational Tip
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

