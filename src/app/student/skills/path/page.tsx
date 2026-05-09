"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Target, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  Clock, 
  TrendingUp,
  Loader2,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { LearningPath } from '@/lib/learning-path';
import { format } from 'date-fns';

export default function LearningPathPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [goal, setGoal] = useState('');
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [hoursPerWeek, setHoursPerWeek] = useState('10');
  const [learningStyle, setLearningStyle] = useState<'visual' | 'hands-on' | 'reading' | 'mixed'>('mixed');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loadingPath, setLoadingPath] = useState(false);

  // Load existing learning paths on mount
  useEffect(() => {
    if (user?.uid) {
      loadUserLearningPaths();
    }
  }, [user]);

  const loadUserLearningPaths = async () => {
    if (!user?.uid) return;
    
    setLoadingPath(true);
    try {
      const response = await fetch(`/api/learning-path/${user.uid}`);
      const data = await response.json();
      
      if (data.success && data.learningPaths) {
        setLearningPaths(data.learningPaths);
        // Pre-fill form with most recent path if exists
        if (data.learningPaths.length > 0) {
          const latest = data.learningPaths[0];
          setGoal(latest.goal);
          setSkillLevel(latest.skillLevel);
          setHoursPerWeek(latest.hoursPerWeek.toString());
          setLearningStyle(latest.learningStyle);
        }
      }
    } catch (error) {
      console.error('Error loading learning paths:', error);
    } finally {
      setLoadingPath(false);
    }
  };

  const handleGenerate = async () => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to generate a learning path.',
      });
      return;
    }

    if (!goal.trim()) {
      toast({
        variant: 'destructive',
        title: 'Goal Required',
        description: 'Please enter your learning goal.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/learning-path/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          goal: goal.trim(),
          skillLevel,
          hoursPerWeek: parseInt(hoursPerWeek),
          learningStyle,
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

      if (data.success) {
        // Reload paths and navigate to the new path
        await loadUserLearningPaths();
        toast({
          title: 'Success!',
          description: 'Your personalized learning path has been generated.',
        });
        // Navigate to the new path detail page
        if (data.pathId) {
          router.push(`/student/skills/path/${data.pathId}`);
        }
      } else {
        throw new Error(data.error || 'Failed to generate learning path');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to generate learning path. Please try again.';
      const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('429') || errorMessage.includes('Rate Limit');
      
      toast({
        variant: 'destructive',
        title: isRateLimit ? 'Rate Limit Exceeded' : 'Generation Failed',
        description: errorMessage,
        duration: isRateLimit ? 8000 : 5000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (date: Date | any) => {
    if (!date) return 'Unknown';
    try {
      if (date instanceof Date) {
        return format(date, 'MMM d, yyyy');
      }
      if (date?.toDate) {
        return format(date.toDate(), 'MMM d, yyyy');
      }
      if (date?.toMillis) {
        return format(new Date(date.toMillis()), 'MMM d, yyyy');
      }
      return 'Unknown';
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 flex flex-col gap-6">
      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Learning Path Generator
          </CardTitle>
          <CardDescription>
            Get a step-by-step personalized plan to master new skills or reach career goals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal">Learning Goal</Label>
            <Input
              id="goal"
              placeholder="e.g., Become a React Developer, Master Python, Learn Data Science"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="skillLevel">Current Skill Level</Label>
              <Select value={skillLevel} onValueChange={(value: any) => setSkillLevel(value)} disabled={isGenerating}>
                <SelectTrigger id="skillLevel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoursPerWeek">Hours per Week</Label>
              <Input
                id="hoursPerWeek"
                type="number"
                min="1"
                max="40"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="learningStyle">Learning Style</Label>
              <Select value={learningStyle} onValueChange={(value: any) => setLearningStyle(value)} disabled={isGenerating}>
                <SelectTrigger id="learningStyle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visual">Visual</SelectItem>
                  <SelectItem value="hands-on">Hands-on</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !goal.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Your Path...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Learning Path
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Generated Learning Paths */}
      {loadingPath ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : learningPaths.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Learning Paths</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {learningPaths.map((path) => (
              <Card 
                key={path.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/student/skills/path/${path.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{path.roadmap.goal}</CardTitle>
                      <CardDescription className="mt-2">
                        {path.roadmap.summary || `${path.roadmap.duration} journey`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-semibold">{path.progress}%</span>
                    </div>
                    <Progress value={path.progress} className="h-2" />
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{path.roadmap.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span>{path.completedWeeks.length}/{path.roadmap.weeks.length} weeks</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{path.skillLevel}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Created {formatDate(path.createdAt)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/student/skills/path/${path.id}`);
                  }}>
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Learning Paths Yet</h3>
            <p className="text-sm text-muted-foreground">
              Generate your first personalized learning path to get started on your journey!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
