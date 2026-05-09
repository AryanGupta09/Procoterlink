
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Clock, HelpCircle, Repeat, School, Calendar, AlertTriangle, Pause } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, getCountFromServer, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

interface ExamDetails {
    title: string;
    description: string;
    questions: any[];
    timeLimit?: number;
    perQuestionTimer: boolean;
    allowedAttempts: number;
    expiryDate?: Timestamp;
    restrictToEmails?: boolean;
    allowedEmails?: string[];
    isPaused?: boolean;
}

export default function ExamTakerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [passingYear, setPassingYear] = useState('');


  useEffect(() => {
    if(!examId) return;

    const fetchExamDetails = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, 'exams', examId);
            const docSnap = await getDoc(docRef);
            if(docSnap.exists()){
                const data = docSnap.data() as ExamDetails;
                setExamDetails(data);
                
                if (data.expiryDate) {
                  const expiry = data.expiryDate.toDate();
                  const now = new Date();
                  // Set time to end of day for comparison
                  expiry.setHours(23, 59, 59, 999);
                  if (now > expiry) {
                    setIsExpired(true);
                  }
                }
                
                // Check if exam is paused
                if (data.isPaused) {
                  setIsPaused(true);
                }

            } else {
                // Handle exam not found
                toast({ variant: "destructive", title: "Not Found", description: "The exam you are looking for does not exist." });
                router.push('/');
            }
        } catch(error) {
            console.error("Error fetching exam details:", error);
        } finally {
            setLoading(false);
        }
    }
    fetchExamDetails();
  }, [examId, router, toast]);

  // Autofill from student profile
  useEffect(() => {
    if (!user?.uid) return;
    const loadProfile = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data() as any;
          setFullName(prev => prev || data.fullName || '');
          setEmail(prev => prev || data.email || user.email || '');
          setCollegeName(prev => prev || data.college || '');
          setPassingYear(prev => prev || data.graduationYear || '');
        } else {
          // Fallback to auth email if profile doc missing
          setEmail(prev => prev || user.email || '');
        }
      } catch (e) {
        // Non-fatal: keep form editable
        setEmail(prev => prev || user?.email || '');
      }
    };
    loadProfile();
  }, [user]);


  const startExam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!examDetails || isExpired || isPaused) return;
    
    setIsChecking(true);
    try {
        // Check if email restriction is enabled and validate email
        if (examDetails.restrictToEmails && examDetails.allowedEmails) {
            const normalizedEmail = email.toLowerCase().trim();
            const allowedEmailsList = examDetails.allowedEmails.map(e => e.toLowerCase().trim());
            
            if (!allowedEmailsList.includes(normalizedEmail)) {
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "Your email address is not authorized to take this exam. Please contact the exam administrator.",
                });
                return;
            }
        }

        const submissionsRef = collection(db, "submissions");
        const q = query(submissionsRef, where("examId", "==", examId), where("participantEmail", "==", email));
        const querySnapshot = await getCountFromServer(q);
        const attemptCount = querySnapshot.data().count;

        if (attemptCount >= examDetails.allowedAttempts) {
            toast({
                variant: "destructive",
                title: "Attempts Exceeded",
                description: `You have already attempted this exam ${attemptCount} time(s). No more attempts are allowed.`,
            });
            return;
        }

        // Store participant details in localStorage to be retrieved on the exam page
        localStorage.setItem('proctorlink-participant-name', fullName);
        localStorage.setItem('proctorlink-participant-email', email);
        localStorage.setItem('proctorlink-participant-college', collegeName);
        localStorage.setItem('proctorlink-participant-year', passingYear);
        router.push(`/exam/${examId}/verify`);
        
    } catch (error) {
        console.error("Error checking for previous submissions:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not verify your submission status. Please try again.",
        });
    } finally {
        setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light/20 via-brand-medium/10 to-brand-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0 overflow-hidden">
        <CardHeader className="text-center bg-gradient-to-r from-brand-primary to-brand-dark text-white py-8">
           <div className="flex flex-col items-center mb-4">
            <GraduationCap className="w-16 h-16 text-white drop-shadow-lg mb-2" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">ProctorLink</div>
              <div className="text-xs text-brand-light/90 font-medium">Powered by LogikSutra AI Recruitment</div>
            </div>
          </div>
          {loading ? (
              <div className="space-y-2">
                  <Skeleton className="h-8 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-full mx-auto" />
                  <Skeleton className="h-4 w-5/6 mx-auto" />
              </div>
          ) : (
            <>
                <CardTitle className="text-3xl font-bold text-white drop-shadow-md">{examDetails?.title}</CardTitle>
                <CardDescription className="text-blue-100 text-lg mt-2">
                    {examDetails?.description || 'Please enter your details to begin the exam.'}
                </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-3 gap-6 text-center mb-8">
             <div className="bg-gradient-to-br from-brand-light/30 to-brand-medium/20 p-4 rounded-xl border border-brand-medium/30">
                <dt className="flex items-center justify-center gap-1 text-sm font-medium text-brand-dark mb-2">
                  <Clock className="w-5 h-5"/> Time Limit
                </dt>
                <dd className="text-xl font-bold text-brand-dark">{loading ? <Skeleton className="h-6 w-16 mx-auto" /> : (
                    examDetails?.perQuestionTimer ? "Per Question" : `${examDetails?.timeLimit} mins`
                )}</dd>
             </div>
             <div className="bg-gradient-to-br from-brand-medium/30 to-brand-primary/20 p-4 rounded-xl border border-brand-primary/30">
                <dt className="flex items-center justify-center gap-1 text-sm font-medium text-brand-dark mb-2">
                  <HelpCircle className="w-5 h-5"/> Questions
                </dt>
                <dd className="text-xl font-bold text-brand-dark">{loading ? <Skeleton className="h-6 w-16 mx-auto" /> : `${examDetails?.questions.length}`}</dd>
             </div>
             <div className="bg-gradient-to-br from-brand-primary/30 to-brand-dark/20 p-4 rounded-xl border border-brand-dark/30">
                <dt className="flex items-center justify-center gap-1 text-sm font-medium text-brand-dark mb-2">
                  <Repeat className="w-5 h-5"/> Attempts
                </dt>
                <dd className="text-xl font-bold text-brand-dark">{loading ? <Skeleton className="h-6 w-16 mx-auto" /> : `${examDetails?.allowedAttempts}`}</dd>
             </div>
          </div>
          {examDetails?.expiryDate && (
             <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="flex items-center justify-center gap-2 text-amber-800 font-medium">
                    <Calendar className="w-5 h-5" />
                    Available until: {format(examDetails.expiryDate.toDate(), "PPP")}
                  </p>
             </div>
          )}
          {isExpired && (
            <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-lg text-sm flex items-center gap-2 mb-6">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">This exam has expired and can no longer be taken.</p>
            </div>
          )}
          {isPaused && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-8 text-center mb-6 shadow-lg">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <Pause className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-orange-800">Exam is Over</h3>
                  <p className="text-orange-700 font-medium max-w-md mx-auto">
                    This exam has been paused by the administrator and is no longer accepting new participants.
                  </p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-orange-200">
                  <p className="text-sm text-orange-600 font-medium">
                    Please contact your exam administrator for more information
                  </p>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={startExam} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">Full Name</Label>
                  <Input 
                    id="fullName" 
                    placeholder="Enter your full name" 
                    required 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    disabled={isExpired || isPaused}
                    className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    disabled={isExpired || isPaused}
                    className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                 <div className="space-y-3">
                  <Label htmlFor="collegeName" className="flex items-center text-sm font-semibold text-gray-700">
                    <School className="mr-2 h-4 w-4 text-blue-600"/>College/University
                  </Label>
                  <Input 
                    id="collegeName" 
                    placeholder="Your institution name" 
                    required 
                    value={collegeName} 
                    onChange={e => setCollegeName(e.target.value)} 
                    disabled={isExpired || isPaused}
                    className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="passingYear" className="flex items-center text-sm font-semibold text-gray-700">
                    <Calendar className="mr-2 h-4 w-4 text-blue-600"/>Graduation Year
                  </Label>
                  <Input 
                    id="passingYear" 
                    type="number" 
                    placeholder="e.g. 2025" 
                    required 
                    value={passingYear} 
                    onChange={e => setPassingYear(e.target.value)} 
                    disabled={isExpired || isPaused}
                    className="h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox id="terms" required disabled={isExpired || isPaused} className="mt-1"/>
                <div className="grid gap-2 leading-none">
                  <label
                    htmlFor="terms"
                    className="text-sm font-semibold text-gray-800 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the exam terms and conditions
                  </label>
                  <p className="text-sm text-gray-600">
                    By proceeding, you consent to camera monitoring, screen recording, and our anti-cheating measures during the exam.
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-brand-primary/80 font-medium text-center bg-brand-light/20 px-2 py-1 rounded">
                      🔒 Secured by LogikSutra AI Recruitment Technology
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-primary to-brand-dark hover:from-brand-primary/90 hover:to-brand-dark/90 transition-all duration-200 shadow-lg hover:shadow-xl" 
              disabled={loading || isChecking || isExpired || isPaused}
            >
              {isExpired ? 'Exam Expired' : (isPaused ? 'Exam is Over' : (isChecking ? 'Verifying...' : 'Proceed to Verification'))}
            </Button>
          </form>
        </CardContent>
        <div className="border-t bg-gray-50 px-8 py-4 rounded-b-lg">
          <div className="text-center">
            <p className="text-xs text-brand-medium/80 font-medium">
              ⚡ Powered by LogikSutra AI Recruitment - Intelligent Proctoring System
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

    