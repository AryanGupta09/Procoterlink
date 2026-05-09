'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, FileText, TrendingUp, Clock } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, DocumentData } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface StudentSubmission {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  submittedAt: Date;
  percentage: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableExams, setAvailableExams] = useState<Array<{ id: string; title: string; description?: string | null }>>([]);
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    if (!user?.email && !user?.uid) return;

    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        // Query without orderBy to avoid composite index requirement
        const q = query(
          collection(db, 'submissions'),
          where('participantEmail', '==', user.email)
        );
        const querySnapshot = await getDocs(q);
        
        console.log('Found submissions:', querySnapshot.docs.length, 'for user:', user.email);
        
        const results = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const submittedAt = data.submittedAt as Timestamp;
          const percentage = (data.score / data.totalQuestions) * 100;
          
          return {
            id: doc.id,
            examId: data.examId,
            examTitle: data.examTitle || 'Unknown Exam',
            score: data.score || 0,
            totalQuestions: data.totalQuestions || 0,
            submittedAt: submittedAt ? submittedAt.toDate() : new Date(),
            percentage: Math.round(percentage)
          };
        });
        
        // Sort by date descending (newest first)
        results.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
        
        setSubmissions(results);
      } catch (error: any) {
        console.error('Error fetching submissions:', error);
        console.error('Error details:', error.message, error.code);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to fetch your exam submissions.',
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchAvailableExams = async () => {
      setLoadingExams(true);
      try {
        // Public exams: restrictToEmails == false OR field missing
        const publicQuery = query(
          collection(db, 'exams'),
          where('restrictToEmails', '==', false)
        );
        const publicSnapshot = await getDocs(publicQuery);

        // Restricted exams that include this user's email
        const restrictedQuery = query(
          collection(db, 'exams'),
          where('restrictToEmails', '==', true),
          where('allowedEmails', 'array-contains', user.email)
        );
        const restrictedSnapshot = await getDocs(restrictedQuery);

        const mapDoc = (doc: DocumentData) => {
          const data = doc.data();
          if (data.isPaused) return null;
          return {
            id: doc.id,
            title: data.title || 'Untitled Exam',
            description: data.description || null,
          };
        };

        const exams = [
          ...publicSnapshot.docs.map(mapDoc),
          ...restrictedSnapshot.docs.map(mapDoc),
        ].filter(Boolean) as Array<{ id: string; title: string; description?: string | null }>;

        // De-duplicate in case of any overlap (by id)
        const deduped = Array.from(new Map(exams.map(e => [e.id, e])).values());
        setAvailableExams(deduped);
      } catch (error: any) {
        console.error('Error fetching available exams:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to fetch available exams.',
        });
      } finally {
        setLoadingExams(false);
      }
    };

    fetchSubmissions();
    fetchAvailableExams();
  }, [user, toast]);

  const averageScore = submissions.length > 0
    ? submissions.reduce((acc, sub) => acc + sub.percentage, 0) / submissions.length
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/student/skills')}>
            Grow & Career Hub
          </Button>
        </div>
      </div>

      {/* Suggestion if marks < 60% */}
      {submissions.some(s => s.percentage < 60) && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-sm text-amber-900">
                Your recent performance is below 60%. Visit the Grow & Career Hub to learn, practice, and improve your skills.
              </div>
              <Button variant="outline" onClick={() => router.push('/student/skills')}>
                Explore Improvements
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Exams */}
      <Card>
        <CardHeader>
          <CardTitle>Available Exams</CardTitle>
          <CardDescription>
            Exams you can take now. Public exams are visible to all students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingExams ? (
            <div className="flex items-center justify-center py-12">
              <p>Loading exams...</p>
            </div>
          ) : availableExams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No available exams</h3>
              <p className="text-muted-foreground">If you were invited to a restricted exam, ensure you are using the invited email.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {availableExams.map((exam) => (
                <Card key={exam.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">{exam.title}</CardTitle>
                    {exam.description ? (
                      <CardDescription>{exam.description}</CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end">
                      <Button onClick={() => router.push(`/exam/${exam.id}`)}>View & Start</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams Taken</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">
              You've completed {submissions.length} exam{submissions.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageScore)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all your exams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Exam</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {submissions.length > 0 ? (
              <>
                <div className="text-2xl font-bold">{submissions[0].percentage}%</div>
                <p className="text-xs text-muted-foreground">
                  {submissions[0].submittedAt.toLocaleDateString()}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  No exams taken yet
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Exam Submissions</CardTitle>
          <CardDescription>
            View all the exams you've taken and your results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p>Loading your submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No exams taken yet</h3>
              <p className="text-muted-foreground mb-4">
                Start taking exams to see your results here.
              </p>
              <Button onClick={() => router.push('/')} variant="outline">
                Browse Available Exams
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{submission.examTitle}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Score: {submission.score}/{submission.totalQuestions}</span>
                          <span>•</span>
                          <span>{submission.submittedAt.toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{submission.submittedAt.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={submission.percentage >= 70 ? 'default' : submission.percentage >= 50 ? 'secondary' : 'destructive'}
                          className="text-lg px-3 py-1"
                        >
                          {submission.percentage}%
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/student/dashboard/submission/${submission.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

