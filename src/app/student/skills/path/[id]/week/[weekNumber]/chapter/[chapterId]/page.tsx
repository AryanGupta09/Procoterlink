"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, Code, BookOpen, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getChapter } from '@/lib/chapters';
import { GenerateChapterContentOutput } from '@/ai/flows/generate-chapter-content';

export default function ChapterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const pathId = params.id as string;
  const weekNumber = parseInt(params.weekNumber as string);
  const chapterId = params.chapterId as string;
  
  const [chapter, setChapter] = useState<any>(null);
  const [content, setContent] = useState<GenerateChapterContentOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingContent, setGeneratingContent] = useState(false);

  useEffect(() => {
    if (chapterId && user?.uid) {
      loadChapter();
    }
  }, [chapterId, user]);

  const loadChapter = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chapters/path?id=${chapterId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load chapter');
      }
      
      if (data.success && data.chapter) {
        setChapter(data.chapter);
        if (data.chapter.content) {
          setContent(data.chapter.content);
        }
      } else {
        throw new Error('Chapter not found');
      }
    } catch (error: any) {
      console.error('Error loading chapter:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to load chapter.',
      });
      router.push(`/student/skills/path/${pathId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    setGeneratingContent(true);
    try {
      const response = await fetch('/api/chapters/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapterId,
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

      if (data.success && data.content) {
        setContent(data.content);
        // Reload chapter to get updated content
        await loadChapter();
        toast({
          title: 'Success!',
          description: 'Chapter content generated successfully.',
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to generate chapter content.';
      const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('429') || errorMessage.includes('Rate Limit');
      
      toast({
        variant: 'destructive',
        title: isRateLimit ? 'Rate Limit Exceeded' : 'Generation Failed',
        description: errorMessage,
        duration: isRateLimit ? 8000 : 5000,
      });
    } finally {
      setGeneratingContent(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!chapter) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/student/skills/path/${pathId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">Week {weekNumber}</Badge>
            <Badge variant="outline">Chapter {chapter.order}</Badge>
          </div>
          <h1 className="text-3xl font-bold">{chapter.title}</h1>
          <p className="text-muted-foreground mt-1">{chapter.description}</p>
        </div>
      </div>

      {!content ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Content Not Generated Yet</h3>
            <p className="text-muted-foreground mb-6">
              Generate detailed content for this chapter including explanations, code examples, and definitions.
            </p>
            <Button onClick={handleGenerateContent} disabled={generatingContent} size="lg">
              {generatingContent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Code className="mr-2 h-4 w-4" />
                  Generate Chapter Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle>Introduction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content.introduction}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          {content.sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{section.heading}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {section.content}
                  </ReactMarkdown>
                </div>

                {/* Code Examples */}
                {section.codeExamples && section.codeExamples.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Code Examples
                    </h4>
                    {section.codeExamples.map((example, idx) => (
                      <div key={idx} className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{example.language}</Badge>
                        </div>
                        <pre className="text-sm text-slate-100">
                          <code>{example.code}</code>
                        </pre>
                        {example.explanation && (
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <p className="text-sm text-slate-300">{example.explanation}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Definitions */}
                {section.definitions && section.definitions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Key Definitions</h4>
                    {section.definitions.map((def, idx) => (
                      <div key={idx} className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          {def.term}
                        </h5>
                        <p className="text-sm text-blue-800 dark:text-blue-200">{def.definition}</p>
                        {def.example && (
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 italic">
                            Example: {def.example}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Key Takeaways */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Key Takeaways
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {content.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Practice Exercises */}
          {content.practiceExercises && content.practiceExercises.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Practice Exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 list-decimal list-inside">
                  {content.practiceExercises.map((exercise, idx) => (
                    <li key={idx} className="pl-2">{exercise}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content.summary}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

