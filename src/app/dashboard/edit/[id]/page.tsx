
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from "date-fns";
import {
  File,
  PlusCircle,
  Trash2,
  Wand2,
  Clock,
  Repeat,
  AlertCircle,
  ArrowLeft,
  Tag,
  Calendar as CalendarIcon,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { generateExamQuestions } from '@/ai/flows/generate-exam-questions';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  timeLimit?: number;
}

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const { toast } = useToast();

  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [tags, setTags] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [timeLimit, setTimeLimit] = useState(30);
  const [allowedAttempts, setAllowedAttempts] = useState(1);
  const [perQuestionTimer, setPerQuestionTimer] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date>();
  
  // Access Control Settings
  const [restrictToEmails, setRestrictToEmails] = useState(false);
  const [allowedEmails, setAllowedEmails] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!examId) return;
    
    const fetchExam = async () => {
        setIsLoading(true);
        try {
            const docRef = doc(db, "exams", examId);
            const docSnap = await getDoc(docRef);

            if(docSnap.exists()){
                const data = docSnap.data();
                setExamTitle(data.title);
                setExamDescription(data.description);
                setTags((data.tags || []).join(', '));
                setQuestions(data.questions.map((q: any, index: number) => ({...q, id: `q-${Date.now()}-${index}`})));
                setTimeLimit(data.timeLimit || 30);
                setAllowedAttempts(data.allowedAttempts || 1);
                setPerQuestionTimer(data.perQuestionTimer || false);
                setRestrictToEmails(data.restrictToEmails || false);
                setAllowedEmails((data.allowedEmails || []).join(', '));
                if (data.expiryDate) {
                  setExpiryDate((data.expiryDate as Timestamp).toDate());
                }
            } else {
                toast({ variant: "destructive", title: "Error", description: "Exam not found." });
                router.push('/dashboard');
            }
        } catch (error) {
            console.error("Failed to fetch exam", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to load exam data." });
        } finally {
            setIsLoading(false);
        }
    }

    fetchExam();
  }, [examId, router, toast]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}`,
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        timeLimit: 60,
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };
  
  const handleQuestionChange = (id: string, field: keyof Question, value: any) => {
    const newQuestions = questions.map((q) => {
      if (q.id === id) {
        return { ...q, [field]: value };
      }
      return q;
    });
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qId: string, optIndex: number, value: string) => {
    const newQuestions = questions.map((q) => {
      if (q.id === qId) {
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    });
    setQuestions(newQuestions);
  }

  const handleCorrectAnswerChange = (qId: string, value: string) => {
     const newQuestions = questions.map((q) => {
      if (q.id === qId) {
        return { ...q, correctAnswer: value };
      }
      return q;
    });
    setQuestions(newQuestions);
  }

  const handleAiGenerate = async (topic: string, difficulty: 'easy' | 'medium' | 'hard', numberOfQuestions: number) => {
    setIsGenerating(true);
    try {
      const result = await generateExamQuestions({ topic, difficulty, numberOfQuestions });
       const newQuestions: Question[] = result.questions.map((q, index) => ({
        id: `ai-q-${Date.now()}-${index}`,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        timeLimit: 60
      }));
      setQuestions(prev => [...prev, ...newQuestions]);
      toast({
          title: "Success!",
          description: `${numberOfQuestions} questions have been generated.`,
      });
    } catch (error) {
      console.error('AI generation failed', error);
       toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "Failed to generate questions. Please try again.",
        });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateExam = async () => {
     if(!examTitle || questions.length === 0) {
      toast({
        variant: "destructive",
        title: "Incomplete Exam",
        description: "Please provide an exam title and at least one question.",
      });
      return;
    }
    setIsSaving(true);
    try {
        const examRef = doc(db, "exams", examId);
        const examData = {
            title: examTitle,
            description: examDescription,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
            questions: questions.map(({id, ...rest}) => rest), // remove temporary id
            timeLimit: perQuestionTimer ? null : timeLimit,
            perQuestionTimer,
            allowedAttempts,
            expiryDate: expiryDate || null,
            restrictToEmails,
            allowedEmails: restrictToEmails ? allowedEmails.split(',').map(email => email.trim()).filter(Boolean) : [],
            updatedAt: serverTimestamp(),
        };
        await updateDoc(examRef, examData);
        toast({
            title: "Exam Updated!",
            description: "Your exam has been updated successfully.",
        });
        router.push('/dashboard');
    } catch(error) {
        console.error("Error updating exam: ", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "There was an error updating your exam.",
        });
    } finally {
        setIsSaving(false);
    }
  }

  if (isLoading) {
      return <div className="flex items-center justify-center min-h-screen">Loading Exam...</div>
  }

  return (
    <div className="grid flex-1 items-start gap-4 sm:py-0">
      <div className="mx-auto grid w-full max-w-5xl flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div className="flex-1 flex flex-col">
            <h1 className="text-xl font-semibold tracking-tight">Edit Exam</h1>
            <div className="text-xs text-brand-primary/80 font-medium">
              🛠️ Powered by LogikSutra AI Recruitment
            </div>
          </div>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
              Cancel
            </Button>
            <Button size="sm" onClick={updateExam} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Exam Details</CardTitle>
                <CardDescription>
                  Update the title, description, and tags for your exam.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="name">Title</Label>
                    <Input
                      id="name"
                      type="text"
                      className="w-full"
                      placeholder="e.g. React Fundamentals Quiz"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="A short description about the exam."
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                    />
                  </div>
                   <div className="grid gap-3">
                    <Label htmlFor="tags" className="flex items-center"><Tag className="mr-2 h-4 w-4"/>Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      type="text"
                      className="w-full"
                      placeholder="e.g. React, Intermediate, Q3-Hiring"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
                <CardDescription>Add or modify questions for your exam.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((q, index) => (
                  <Card key={q.id} className="p-4">
                     <div className="flex justify-between items-center mb-4">
                        <Label htmlFor={`q-text-${q.id}`} className="text-base font-medium">Question {index + 1}</Label>
                        <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                     </div>
                      <Textarea id={`q-text-${q.id}`} placeholder="Enter your question" value={q.questionText} onChange={e => handleQuestionChange(q.id, 'questionText', e.target.value)} />
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {q.options.map((opt, optIndex) => (
                          <Input key={optIndex} placeholder={`Option ${optIndex + 1}`} value={opt} onChange={e => handleOptionChange(q.id, optIndex, e.target.value)}/>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Label>Correct Answer</Label>
                        <Select onValueChange={(value) => handleCorrectAnswerChange(q.id, value)} value={q.correctAnswer}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select correct answer" />
                            </SelectTrigger>
                            <SelectContent>
                                {q.options.filter(o => o && o.trim() !== '').map((opt, optIndex) => (
                                    <SelectItem key={optIndex} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      </div>
                       {perQuestionTimer && (
                         <div className="mt-4">
                            <Label htmlFor={`q-time-${q.id}`} className="flex items-center"><Clock className="mr-2 h-4 w-4" />Time Limit (seconds)</Label>
                            <Input id={`q-time-${q.id}`} type="number" placeholder="e.g. 60" value={q.timeLimit} onChange={e => handleQuestionChange(q.id, 'timeLimit', Number(e.target.value))} min="10" />
                        </div>
                      )}
                  </Card>
                ))}
                <div className="flex gap-2 pt-4">
                    <Button onClick={addQuestion} variant="outline" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Question
                    </Button>
                    <AiQuestionGenerator onGenerate={handleAiGenerate} isGenerating={isGenerating} />
                </div>
              </CardContent>
            </Card>

          </div>
           <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Exam Settings</CardTitle>
              </CardHeader>
               <CardContent className="grid gap-6">
                 <div className="flex items-center space-x-2">
                    <Switch id="per-question-timer" checked={perQuestionTimer} onCheckedChange={setPerQuestionTimer} />
                    <Label htmlFor="per-question-timer">Per-Question Timer</Label>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="time-limit" className="flex items-center"><Clock className="mr-2 h-4 w-4"/>Time Limit (minutes)</Label>
                    <Input id="time-limit" type="number" placeholder="e.g. 60" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} min="1" disabled={perQuestionTimer} />
                </div>
                 <div className="grid gap-3">
                    <Label htmlFor="attempts" className="flex items-center"><Repeat className="mr-2 h-4 w-4"/>Allowed Attempts</Label>
                    <Input id="attempts" type="number" placeholder="e.g. 1" value={allowedAttempts} onChange={e => setAllowedAttempts(Number(e.target.value))} min="1"/>
                </div>
                 <div className="grid gap-3">
                    <Label htmlFor="expiry" className="flex items-center"><CalendarIcon className="mr-2 h-4 w-4"/>Expiry Date</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !expiryDate && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={expiryDate}
                            onSelect={setExpiryDate}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                
                {/* Access Control Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Access Control</Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Switch id="restrict-emails" checked={restrictToEmails} onCheckedChange={setRestrictToEmails} />
                    <Label htmlFor="restrict-emails">Restrict to specific emails</Label>
                  </div>
                  {restrictToEmails && (
                    <div className="grid gap-3">
                      <Label htmlFor="allowed-emails" className="text-sm">Allowed Email Addresses</Label>
                      <Textarea
                        id="allowed-emails"
                        placeholder="Enter email addresses separated by commas&#10;e.g. john@example.com, jane@example.com"
                        value={allowedEmails}
                        onChange={(e) => setAllowedEmails(e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Only users with these email addresses will be able to take this exam.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-destructive/10 border-destructive">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5"/>Proctoring Settings</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-destructive-foreground">
                    <p>Screen, tab, and copy-paste restrictions will be automatically enabled for all exams to ensure a fair testing environment.</p>
                </CardContent>
            </Card>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 md:hidden">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
            Cancel
          </Button>
          <Button size="sm" onClick={updateExam} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}


function AiQuestionGenerator({ onGenerate, isGenerating }: { onGenerate: (topic: string, difficulty: 'easy' | 'medium' | 'hard', num: number) => void, isGenerating: boolean }) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState(5);

  const handleGenerateClick = () => {
    if (topic.trim()) {
      onGenerate(topic, difficulty, numQuestions);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full bg-brand-medium hover:bg-brand-primary text-white">
            <Wand2 className="mr-2 h-4 w-4" /> Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Questions with AI</DialogTitle>
          <DialogDescription>
            Provide a topic and our AI will generate questions for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="topic" className="text-right">
              Topic
            </Label>
            <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. JavaScript Promises" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="difficulty" className="text-right">
              Difficulty
            </Label>
            <Select onValueChange={(val: 'easy' | 'medium' | 'hard') => setDifficulty(val)} defaultValue={difficulty}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="num-questions" className="text-right">
              Number
            </Label>
            <Input id="num-questions" type="number" value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} className="col-span-3" min="1" max="10" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={handleGenerateClick} disabled={isGenerating || !topic.trim()}>
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    