'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Camera, Timer, CheckCircle, GraduationCap, Bookmark, BookmarkCheck, Save, Maximize, Minimize } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
  timeLimit?: number;
}

interface Exam {
  title: string;
  timeLimit?: number;
  perQuestionTimer: boolean;
  questions: Question[];
  isPaused?: boolean;
}

const MAX_WARNINGS = 10;

export default function TakeExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const { toast } = useToast();
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [examReady, setExamReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const examContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  // Use refs for values needed inside timer callback to avoid stale closures
  const examRef = useRef<Exam | null>(null);
  const answersRef = useRef<(string | null)[]>([]);
  const currentQuestionIndexRef = useRef(0);
  const isSubmittingRef = useRef(false);
  const warningCountRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { examRef.current = exam; }, [exam]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);
  useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);
  useEffect(() => { warningCountRef.current = warningCount; }, [warningCount]);

  // ── Fullscreen helpers ──────────────────────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if ((elem as any).webkitRequestFullscreen) await (elem as any).webkitRequestFullscreen();
      setIsFullscreen(true);
    } catch (e) { /* user may deny */ }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) await (document as any).webkitExitFullscreen();
      setIsFullscreen(false);
    } catch (e) { /* ignore */ }
  }, []);

  // ── Submit exam ─────────────────────────────────────────────────────────────
  const submitExam = useCallback(async (currentAnswers?: (string | null)[]) => {
    if (isSubmittingRef.current || !examRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    const examData = examRef.current;
    const finalAnswers = currentAnswers ?? answersRef.current;

    let score = 0;
    examData.questions.forEach((q, i) => {
      if (q.correctAnswer === finalAnswers[i]) score++;
    });

    const participantName = user?.displayName || localStorage.getItem('proctorlink-participant-name') || 'Anonymous';
    const participantEmail = user?.email || localStorage.getItem('proctorlink-participant-email') || 'No Email';
    const collegeName = localStorage.getItem('proctorlink-participant-college') || 'N/A';
    const passingYear = localStorage.getItem('proctorlink-participant-year') || 'N/A';

    try {
      await addDoc(collection(db, 'submissions'), {
        examId,
        examTitle: examData.title,
        participantName,
        participantEmail,
        collegeName,
        passingYear,
        userId: user?.uid || null,
        answers: finalAnswers,
        score,
        totalQuestions: examData.questions.length,
        submittedAt: serverTimestamp(),
        warningCount: warningCountRef.current,
      });

      ['proctorlink-participant-name','proctorlink-participant-email',
       'proctorlink-participant-college','proctorlink-participant-year',
       'proctorlink-student-photo','proctorlink-id-photo',
       `proctorlink-exam-${examId}-progress`].forEach(k => localStorage.removeItem(k));

      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }

      // Exit fullscreen before navigating
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});

      router.push(`/exam/results?examId=${examId}`);
    } catch (error) {
      console.error('Submission error:', error);
      toast({ title: 'Submission Failed', description: 'Could not submit. Please try again.', variant: 'destructive' });
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [examId, user, router, toast]);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goToQuestion = (index: number) => {
    if (examRef.current && index >= 0 && index < examRef.current.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleNext = useCallback(() => {
    setCurrentQuestionIndex(prev => {
      if (examRef.current && prev < examRef.current.questions.length - 1) return prev + 1;
      return prev;
    });
  }, []);

  const handlePrev = () => setCurrentQuestionIndex(prev => (prev > 0 ? prev - 1 : prev));

  const toggleBookmark = (questionIndex: number) => {
    setBookmarkedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(questionIndex)) {
        next.delete(questionIndex);
        toast({ title: 'Bookmark Removed', description: `Question ${questionIndex + 1} unmarked.` });
      } else {
        next.add(questionIndex);
        toast({ title: 'Question Bookmarked', description: `Question ${questionIndex + 1} marked for review.` });
      }
      return next;
    });
  };

  // ── Auto-save ───────────────────────────────────────────────────────────────
  const autoSave = useCallback(() => {
    if (!examRef.current || !examId) return;
    const data = {
      examId,
      answers: answersRef.current,
      bookmarkedQuestions: Array.from(bookmarkedQuestions),
      currentQuestionIndex: currentQuestionIndexRef.current,
      timeLeft,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(`proctorlink-exam-${examId}-progress`, JSON.stringify(data));
    setLastSaved(new Date());
  }, [examId, bookmarkedQuestions, timeLeft]);


  // ── Fetch exam ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!examId) return;
    const fetchExam = async () => {
      try {
        const snap = await getDoc(doc(db, 'exams', examId));
        if (!snap.exists()) {
          toast({ title: 'Error', description: 'Exam not found.', variant: 'destructive' });
          router.push('/');
          return;
        }
        const data = snap.data() as Exam;
        if (data.isPaused) {
          toast({ variant: 'destructive', title: 'Exam is Over', description: 'This exam has been paused.' });
          router.push(`/exam/${examId}`);
          return;
        }

        setExam(data);
        examRef.current = data;

        const saved = localStorage.getItem(`proctorlink-exam-${examId}-progress`);
        if (saved) {
          try {
            const p = JSON.parse(saved);
            const restoredAnswers = p.answers || new Array(data.questions.length).fill(null);
            setAnswers(restoredAnswers);
            answersRef.current = restoredAnswers;
            setBookmarkedQuestions(new Set(p.bookmarkedQuestions || []));
            const restoredIdx = p.currentQuestionIndex || 0;
            setCurrentQuestionIndex(restoredIdx);
            currentQuestionIndexRef.current = restoredIdx;
            if (!data.perQuestionTimer) {
              setTimeLeft(p.timeLeft || (data.timeLimit || 30) * 60);
            } else {
              setTimeLeft(data.questions[restoredIdx]?.timeLimit || 60);
            }
            toast({ title: 'Progress Restored', description: 'Your previous progress has been restored.' });
          } catch {
            setAnswers(new Array(data.questions.length).fill(null));
            setTimeLeft(data.perQuestionTimer ? (data.questions[0]?.timeLimit || 60) : (data.timeLimit || 30) * 60);
          }
        } else {
          const initAnswers = new Array(data.questions.length).fill(null);
          setAnswers(initAnswers);
          answersRef.current = initAnswers;
          setTimeLeft(data.perQuestionTimer ? (data.questions[0]?.timeLimit || 60) : (data.timeLimit || 30) * 60);
        }
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Failed to load exam.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId, router, toast]);

  // ── Camera + event listeners ────────────────────────────────────────────────
  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setHasCameraPermission(false);
        toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions.' });
      }
    };
    getCameraPermission();

    const handleFullscreenChange = () => {
      const fs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(fs);
      if (!fs) {
        const wc = warningCountRef.current + 1;
        warningCountRef.current = wc;
        setWarningCount(wc);
        if (wc >= MAX_WARNINGS) {
          setDialogMessage(`You have received too many violations. Your exam is being auto-submitted.`);
          setShowWarningDialog(true);
          setTimeout(() => submitExam(answersRef.current), 2000);
        } else {
          setDialogMessage(`You exited fullscreen. This is warning #${wc}. Please return to fullscreen.`);
          setShowWarningDialog(true);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const wc = warningCountRef.current + 1;
        warningCountRef.current = wc;
        setWarningCount(wc);
        if (wc >= MAX_WARNINGS) {
          setDialogMessage(`You have received too many violations. Your exam is being auto-submitted.`);
          setShowWarningDialog(true);
          setTimeout(() => submitExam(answersRef.current), 2000);
        } else {
          setDialogMessage(`Tab switch detected. This is warning #${wc}.`);
          setShowWarningDialog(true);
          toast({ title: `Warning #${wc}: Tab Switch Detected`, variant: 'destructive' });
        }
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const wc = warningCountRef.current + 1;
      warningCountRef.current = wc;
      setWarningCount(wc);
      if (wc >= MAX_WARNINGS) {
        toast({ title: `Auto-submitting: Too many violations`, variant: 'destructive' });
        setTimeout(() => submitExam(answersRef.current), 2000);
      } else {
        toast({ title: `Warning #${wc}: Copy/Paste Disabled`, variant: 'destructive' });
      }
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleBookmark(currentQuestionIndexRef.current);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyPress);
    window.addEventListener('copy', handleCopyPaste);
    window.addEventListener('paste', handleCopyPaste);
    window.addEventListener('cut', handleCopyPaste);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('copy', handleCopyPaste);
      window.removeEventListener('paste', handleCopyPaste);
      window.removeEventListener('cut', handleCopyPaste);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []); // empty deps — uses refs for all mutable values

  // ── Auto-enter fullscreen once exam + camera are ready ──────────────────────
  useEffect(() => {
    if (!loading && exam) {
      setExamReady(true);
      enterFullscreen();
    }
  }, [loading, exam, enterFullscreen]);

  // ── Auto-save interval ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!exam || loading || isSubmitting) return;
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    autoSaveRef.current = setInterval(autoSave, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [exam, loading, isSubmitting, autoSave]);

  // Debounced save on answer/bookmark change
  useEffect(() => {
    if (!exam || loading) return;
    const t = setTimeout(autoSave, 2000);
    return () => clearTimeout(t);
  }, [answers, bookmarkedQuestions, autoSave, exam, loading]);


  // ── Timer logic (fixed) ─────────────────────────────────────────────────────
  // For per-question timer: reset when question changes
  const prevQuestionIndexRef = useRef(-1);
  useEffect(() => {
    if (!exam || loading || isSubmitting) return;
    if (!exam.perQuestionTimer) return;
    if (prevQuestionIndexRef.current !== currentQuestionIndex) {
      prevQuestionIndexRef.current = currentQuestionIndex;
      setTimeLeft(exam.questions[currentQuestionIndex]?.timeLimit || 60);
    }
  }, [currentQuestionIndex, exam, loading, isSubmitting]);

  // Main countdown — runs independently, uses refs to avoid stale closures
  useEffect(() => {
    if (!examReady || !exam || loading || isSubmitting) return;
    if (timeLeft <= 0) return; // wait for timeLeft to be set

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Time's up
          if (examRef.current?.perQuestionTimer) {
            const idx = currentQuestionIndexRef.current;
            const total = examRef.current.questions.length;
            if (idx < total - 1) {
              setCurrentQuestionIndex(i => i + 1);
              // timeLeft will be reset by the per-question effect above
              return examRef.current.questions[idx + 1]?.timeLimit || 60;
            } else {
              submitExam(answersRef.current);
              return 0;
            }
          } else {
            submitExam(answersRef.current);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // Only restart timer when examReady, exam loaded, or timeLeft is freshly set (not every tick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examReady, exam, loading, isSubmitting, submitExam]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTime = exam
    ? exam.perQuestionTimer
      ? (exam.questions[currentQuestionIndex]?.timeLimit || 60)
      : (exam.timeLimit || 30) * 60
    : 1;

  const timerPct = totalTime > 0 ? (timeLeft / totalTime) * 100 : 100;

  const getTimerColor = () => {
    if (timerPct > 50) return 'text-green-600';
    if (timerPct > 25) return 'text-yellow-600';
    if (timerPct > 10) return 'text-orange-600';
    return 'text-red-600 animate-pulse';
  };

  const getTimerBgColor = () => {
    if (timerPct > 50) return 'bg-green-50 border-green-200';
    if (timerPct > 25) return 'bg-yellow-50 border-yellow-200';
    if (timerPct > 10) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading || !exam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-medium">Loading exam...</p>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];

  return (
    <div ref={examContainerRef} className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-brand-light/10 to-brand-medium/5 p-4 md:p-8">

      {!hasCameraPermission && (
        <Card className="w-full max-w-4xl z-20 mb-4">
          <CardHeader><CardTitle>Camera &amp; Microphone Required</CardTitle></CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>Please grant camera and microphone access to begin the exam.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 w-full max-w-7xl">

        {/* ── Main question card ── */}
        <Card className="w-full z-10 order-2 lg:order-1">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              <CardTitle>{exam.title} — Question {currentQuestionIndex + 1}</CardTitle>
              <Button
                onClick={() => toggleBookmark(currentQuestionIndex)}
                variant="ghost" size="sm"
                className="flex items-center gap-2"
                title="Bookmark (Ctrl+B)"
              >
                {bookmarkedQuestions.has(currentQuestionIndex)
                  ? <BookmarkCheck className="h-4 w-4 text-yellow-600" />
                  : <Bookmark className="h-4 w-4 text-gray-400" />}
                <span className="text-sm">{bookmarkedQuestions.has(currentQuestionIndex) ? 'Bookmarked' : 'Bookmark'}</span>
                <span className="text-xs text-gray-400 hidden md:inline">(Ctrl+B)</span>
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer */}
              <div className="flex flex-col items-end gap-1">
                <div className={cn('flex items-center gap-2 text-lg font-medium px-3 py-2 rounded-lg border-2 transition-all', getTimerColor(), getTimerBgColor())}>
                  <Timer className="h-5 w-5" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
                {lastSaved && (
                  <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    <Save className="h-3 w-3" />
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {/* Fullscreen toggle */}
              <Button
                variant="outline" size="icon"
                onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>

              {/* Submit */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isSubmitting}>Submit Exam</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>This cannot be undone. Your answers will be submitted.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => submitExam()} disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting…' : 'Yes, submit my exam'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-6">{currentQuestion.questionText}</h2>
            <RadioGroup
              className="space-y-4"
              value={answers[currentQuestionIndex] || ''}
              onValueChange={(value) => {
                setAnswers(prev => {
                  const next = [...prev];
                  next[currentQuestionIndex] = value;
                  answersRef.current = next;
                  return next;
                });
              }}
              disabled={isSubmitting}
            >
              {currentQuestion.options.map((option, i) => (
                <div key={i} className="flex items-center space-x-2 p-4 border rounded-lg transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                  <RadioGroupItem value={option} id={`opt-${i}`} />
                  <Label htmlFor={`opt-${i}`} className="text-base w-full cursor-pointer">{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-4">
            <Button onClick={handlePrev} disabled={currentQuestionIndex === 0 || isSubmitting}>Previous</Button>
            {currentQuestionIndex < exam.questions.length - 1 ? (
              <Button onClick={handleNext} disabled={isSubmitting}>Next Question</Button>
            ) : (
              <Button onClick={() => submitExam()} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Finish & Submit'}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* ── Question palette ── */}
        <Card className="w-full z-10 order-1 lg:order-2">
          <CardHeader><CardTitle>Question Palette</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-5 gap-2">
            {exam.questions.map((_, index) => (
              <Button
                key={index}
                variant={currentQuestionIndex === index ? 'default' : (answers[index] ? 'secondary' : 'outline')}
                className={cn('h-10 w-10 p-0 relative', answers[index] && 'border-green-500', bookmarkedQuestions.has(index) && 'ring-2 ring-yellow-400')}
                onClick={() => goToQuestion(index)}
              >
                {answers[index] ? <CheckCircle className="h-5 w-5" /> : index + 1}
                {bookmarkedQuestions.has(index) && (
                  <Bookmark className="absolute -top-1 -right-1 h-3 w-3 text-yellow-600 fill-yellow-600" />
                )}
              </Button>
            ))}
          </CardContent>
          <CardFooter className="flex-col gap-2 items-start text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-secondary border border-green-500" /> Answered</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full border" /> Unanswered</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-primary" /> Current</div>
            <div className="flex items-center gap-2 mt-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>{warningCount} Warning{warningCount !== 1 ? 's' : ''}</span>
            </div>
            {bookmarkedQuestions.size > 0 && (
              <Button
                onClick={() => {
                  const arr = Array.from(bookmarkedQuestions).sort((a, b) => a - b);
                  const ci = arr.indexOf(currentQuestionIndex);
                  goToQuestion(ci >= 0 && ci < arr.length - 1 ? arr[ci + 1] : arr[0]);
                }}
                variant="outline" size="sm" className="w-full text-xs mt-2"
              >
                <Bookmark className="h-3 w-3 mr-1" /> Review Bookmarked ({bookmarkedQuestions.size})
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* ── Proctor camera ── */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative w-32 h-24 md:w-48 md:h-36 rounded-lg overflow-hidden border-2 border-brand-primary shadow-xl bg-gray-900">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <div className="absolute top-1 left-1 bg-black/80 text-white px-1 py-0.5 rounded text-xs flex items-center gap-1">
            <Camera className="h-3 w-3" />
            <span>{hasCameraPermission ? 'PROCTOR ON' : 'CAMERA OFF'}</span>
          </div>
          <div className="absolute bottom-1 left-1 bg-black/70 text-white px-1 rounded text-xs flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            <span>ProcterLink</span>
          </div>
          <div className="absolute top-1 right-1">
            <div className={`w-2 h-2 rounded-full ${hasCameraPermission ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          </div>
          {hasCameraPermission && (
            <div className="absolute bottom-1 right-1 bg-red-500 text-white text-xs px-1 rounded flex items-center gap-1">
              <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
              REC
            </div>
          )}
        </div>
      </div>

      {/* ── Warning dialog ── */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" /> Proctoring Warning
            </AlertDialogTitle>
            <AlertDialogDescription>{dialogMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => { setShowWarningDialog(false); enterFullscreen(); }}>
              Return to Fullscreen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
