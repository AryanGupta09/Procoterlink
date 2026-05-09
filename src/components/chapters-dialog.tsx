"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { Chapter } from '@/lib/chapters';

interface ChaptersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathId: string;
  weekNumber: number;
}

export function ChaptersDialog({ open, onOpenChange, pathId, weekNumber }: ChaptersDialogProps) {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open && pathId && weekNumber) {
      loadChapters();
    }
  }, [open, pathId, weekNumber]);

  const loadChapters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chapters?pathId=${pathId}&weekNumber=${weekNumber}`);
      const data = await response.json();
      
      if (data.success && data.chapters) {
        setChapters(data.chapters);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    } finally {
      setLoading(false);
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

      const data = await response.json();

      if (data.success && data.chapters) {
        setChapters(data.chapters);
      } else {
        throw new Error(data.error || 'Failed to generate chapters');
      }
    } catch (error: any) {
      console.error('Error generating chapters:', error);
      alert(error.message || 'Failed to generate chapters');
    } finally {
      setGenerating(false);
    }
  };

  const handleChapterClick = (chapterId: string) => {
    router.push(`/student/skills/path/${pathId}/week/${weekNumber}/chapter/${chapterId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Week {weekNumber} Chapters</DialogTitle>
          <DialogDescription>
            Select a chapter to start learning, or generate chapters if none exist yet.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No chapters generated yet for this week.</p>
            <Button onClick={handleGenerateChapters} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Chapters...
                </>
              ) : (
                'Generate Chapters'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter) => (
              <Card 
                key={chapter.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => chapter.id && handleChapterClick(chapter.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-muted-foreground">
                          Chapter {chapter.order}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{chapter.title}</CardTitle>
                      <CardDescription className="mt-2">{chapter.description}</CardDescription>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

