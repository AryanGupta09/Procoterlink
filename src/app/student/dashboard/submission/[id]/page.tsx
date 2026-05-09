'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SubmissionData {
  examId: string;
  examTitle: string;
  participantName: string;
  participantEmail: string;
  answers: string[];
  score: number;
  totalQuestions: number;
  submittedAt: Date;
  percentage: number;
  examQuestions?: Question[];
  correctAnswers?: string[];
}

interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export default function SubmissionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const submissionId = params.id as string;
  
  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [examData, setExamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      try {
        // Fetch submission data
        const submissionDocRef = doc(db, 'submissions', submissionId);
        const submissionDoc = await getDoc(submissionDocRef);
        
        if (!submissionDoc.exists()) {
          toast({
            variant: 'destructive',
            title: 'Not Found',
            description: 'Submission not found.',
          });
          router.push('/student/dashboard');
          return;
        }

        const data = submissionDoc.data();
        const submittedAt = data.submittedAt ? data.submittedAt.toDate() : new Date();
        const percentage = (data.score / data.totalQuestions) * 100;

        setSubmission({
          examId: data.examId,
          examTitle: data.examTitle || 'Unknown Exam',
          participantName: data.participantName,
          participantEmail: data.participantEmail,
          answers: data.answers || [],
          score: data.score || 0,
          totalQuestions: data.totalQuestions || 0,
          submittedAt,
          percentage: Math.round(percentage),
        });

        // Fetch exam data to get questions
        try {
          const examDocRef = doc(db, 'exams', data.examId);
          const examDoc = await getDoc(examDocRef);
          
          if (examDoc.exists()) {
            setExamData(examDoc.data());
          }
        } catch (error) {
          console.error('Error fetching exam data:', error);
        }

      } catch (error) {
        console.error('Error fetching submission:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load submission details.',
        });
        router.push('/student/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionDetails();
  }, [submissionId, router, toast]);

  if (loading || !submission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading submission details...</p>
      </div>
    );
  }

  const questions = examData?.questions || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Exam Submission Details</h1>
          <p className="text-muted-foreground mt-1">
            Review your answers and performance
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>{submission.examTitle}</CardTitle>
          <CardDescription>
            Submitted on {submission.submittedAt.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <div className="text-sm text-muted-foreground">Score</div>
              <div className="text-2xl font-bold">
                {submission.score} / {submission.totalQuestions}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm text-muted-foreground">Percentage</div>
              <Badge 
                variant={submission.percentage >= 70 ? 'default' : submission.percentage >= 50 ? 'secondary' : 'destructive'}
                className="text-xl px-3 py-1 w-fit"
              >
                {submission.percentage}%
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="text-lg font-semibold">
                {submission.percentage >= 70 ? 'Pass' : submission.percentage >= 50 ? 'Fair' : 'Fail'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Review */}
      {questions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Answers Review</CardTitle>
            <CardDescription>
              Review each question and see which answers were correct
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question: Question, index: number) => {
              const userAnswer = submission.answers[index];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">
                        Question {index + 1}
                      </CardTitle>
                      {isCorrect ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Correct
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-4 w-4 mr-1" />
                          Incorrect
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium text-lg">{question.questionText}</p>
                    </div>
                    
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => {
                        const isUserChoice = option === userAnswer;
                        const isCorrectChoice = option === question.correctAnswer;
                        let variant = 'outline';
                        let label = option;

                        if (isCorrectChoice) {
                          variant = 'default';
                          label = `✓ ${option} (Correct Answer)`;
                        }
                        if (isUserChoice && !isCorrect) {
                          variant = 'destructive';
                          label = `✗ ${option} (Your Answer)`;
                        }

                        return (
                          <Badge
                            key={optIndex}
                            variant={variant as any}
                            className="w-full justify-start p-3 text-sm font-normal"
                          >
                            {label}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Question Details Unavailable</CardTitle>
            <CardDescription>
              Unable to load individual question details. Please contact support if you need this information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Score: {submission.score}/{submission.totalQuestions}</p>
              <p>Percentage: {submission.percentage}%</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

