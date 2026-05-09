'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, User, CreditCard, RefreshCw, CheckCircle, ArrowLeft, ArrowRight, GraduationCap } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

export default function ExamVerificationPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<'student' | 'id'>('student');
  const [studentPhoto, setStudentPhoto] = useState<string | null>(null);
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure video plays after setting source
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Error playing video:', playError);
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions to continue with verification.',
      });
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);
    setCountdown(3);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownInterval);
          
          // Actually capture the photo
          setTimeout(() => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (!canvas || !video) {
              setIsCapturing(false);
              setCountdown(null);
              return;
            }
            
            // Check if video is ready and has dimensions
            if (video.videoWidth === 0 || video.videoHeight === 0) {
              toast({
                variant: 'destructive',
                title: 'Camera Error',
                description: 'Video feed not ready. Please try again.',
              });
              setIsCapturing(false);
              setCountdown(null);
              return;
            }
            
            const context = canvas.getContext('2d');
            if (!context) {
              toast({
                variant: 'destructive',
                title: 'Canvas Error',
                description: 'Unable to initialize photo capture. Please refresh and try again.',
              });
              setIsCapturing(false);
              setCountdown(null);
              return;
            }

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw the video frame to canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to base64 string
            const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            // Validate that we actually captured something
            if (!photoDataUrl || photoDataUrl === 'data:,') {
              toast({
                variant: 'destructive',
                title: 'Capture Failed',
                description: 'Failed to capture photo. Please try again.',
              });
              setIsCapturing(false);
              setCountdown(null);
              return;
            }

            if (currentStep === 'student') {
              setStudentPhoto(photoDataUrl);
              toast({
                title: '📸 Student Photo Captured!',
                description: 'Great! Now please capture your ID document.',
              });
              setCurrentStep('id');
              // Keep camera active for ID photo
            } else {
              setIdPhoto(photoDataUrl);
              toast({
                title: '🆔 ID Photo Captured!',
                description: 'Perfect! Both photos captured successfully.',
              });
              // Don't stop camera immediately, let user see the captured photo
              setTimeout(() => {
                stopCamera();
              }, 1000);
            }

            setIsCapturing(false);
            setCountdown(null);
          }, 200);
          
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [currentStep, stopCamera, toast, isCapturing]);

  const retakePhoto = useCallback(() => {
    if (currentStep === 'student') {
      setStudentPhoto(null);
    } else {
      setIdPhoto(null);
    }
    
    if (!isCameraActive) {
      startCamera();
    }
  }, [currentStep, isCameraActive, startCamera]);

  const proceedToExam = useCallback(() => {
    if (!studentPhoto || !idPhoto) {
      toast({
        variant: 'destructive',
        title: 'Photos Required',
        description: 'Please capture both student and ID photos before proceeding.',
      });
      return;
    }

    // Store photos in localStorage
    localStorage.setItem('proctorlink-student-photo', studentPhoto);
    localStorage.setItem('proctorlink-id-photo', idPhoto);

    // Navigate to exam
    router.push(`/exam/${examId}/take`);
  }, [studentPhoto, idPhoto, examId, router, toast]);

  const goBack = useCallback(() => {
    stopCamera();
    router.back();
  }, [stopCamera, router]);

  const switchStep = useCallback((step: 'student' | 'id') => {
    setCurrentStep(step);
    // Always ensure camera is active when switching steps
    if (!isCameraActive) {
      startCamera();
    }
  }, [isCameraActive, startCamera]);

  // Effect to handle video stream changes
  useEffect(() => {
    if (stream && videoRef.current && isCameraActive) {
      videoRef.current.srcObject = stream;
      
      const playVideo = async () => {
        try {
          if (videoRef.current) {
            await videoRef.current.play();
          }
        } catch (error) {
          // Silently handle video play errors
        }
      };
      
      playVideo();
    }
  }, [stream, isCameraActive]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light/20 to-brand-medium/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="text-center border-b bg-gradient-to-r from-brand-primary to-brand-dark text-white rounded-t-lg">
          <div className="flex flex-col items-center mb-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-6 w-6" />
              <span className="text-lg font-bold">ProctorLink</span>
            </div>
            <span className="text-xs text-brand-light/90 font-medium">Powered by LogikSutra AI Recruitment</span>
          </div>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Camera className="h-6 w-6" />
            Identity Verification
          </CardTitle>
          <CardDescription className="text-brand-light/90">
            Please capture clear photos for identity verification before starting your exam
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                currentStep === 'student' || studentPhoto 
                  ? "bg-brand-primary border-brand-primary text-white" 
                  : "border-gray-300 text-gray-400"
              )}>
                {studentPhoto ? <CheckCircle className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </div>
              <div className="text-sm font-medium text-gray-600">Student Photo</div>
              
              <div className="w-16 h-0.5 bg-gray-300 mx-4" />
              
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                currentStep === 'id' || idPhoto 
                  ? "bg-brand-primary border-brand-primary text-white" 
                  : "border-gray-300 text-gray-400"
              )}>
                {idPhoto ? <CheckCircle className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
              </div>
              <div className="text-sm font-medium text-gray-600">ID Document</div>
            </div>
          </div>

          {/* Step Buttons */}
          <div className="flex justify-center gap-4 mb-6">
            <Button
              variant={currentStep === 'student' ? 'default' : 'outline'}
              onClick={() => switchStep('student')}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Student Photo {studentPhoto && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Button>
            <Button
              variant={currentStep === 'id' ? 'default' : 'outline'}
              onClick={() => switchStep('id')}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              ID Document {idPhoto && <CheckCircle className="h-4 w-4 text-green-500" />}
            </Button>
          </div>

          {/* Instructions */}
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Camera className="h-4 w-4" />
            <AlertTitle className="text-blue-800">
              {currentStep === 'student' ? 'Capture Your Photo' : 'Capture Your ID Document'}
            </AlertTitle>
            <AlertDescription className="text-blue-700">
              {currentStep === 'student' 
                ? 'Position yourself in front of the camera. Make sure your face is clearly visible and well-lit.'
                : 'Hold your ID document (driver\'s license, passport, or student ID) clearly in front of the camera. Ensure all text is readable.'
              }
            </AlertDescription>
          </Alert>

          {/* Live Camera Preview - Main Section */}
          <div className="mb-8">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {currentStep === 'student' ? '📸 Position Yourself for Student Photo' : '🆔 Position Your ID Document'}
              </h3>
              <p className="text-gray-600">
                {currentStep === 'student' 
                  ? 'Make sure your face is clearly visible and well-lit. Look directly at the camera.'
                  : 'Hold your ID document flat and ensure all text is clearly readable.'
                }
              </p>
            </div>
            
            {/* Large Live Camera Preview */}
            <div className="flex justify-center mb-6">
              <div className="relative w-full max-w-2xl aspect-[4/3] bg-gray-900 rounded-2xl overflow-hidden border-4 border-brand-medium/40 shadow-2xl">
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          videoRef.current.play().catch(() => {
                            // Silently handle play errors
                          });
                        }
                      }}
                    />
                    {/* Live Indicator */}
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      LIVE PREVIEW
                    </div>
                    
                    {/* Current Step Indicator */}
                    <div className="absolute top-4 left-4 bg-brand-primary text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      {currentStep === 'student' ? '👤 STUDENT MODE' : '🆔 ID MODE'}
                    </div>

                    
                    {/* Overlay Guide */}
                    {currentStep === 'student' ? (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Face guide overlay */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-white border-dashed rounded-full opacity-50"></div>
                        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                          Position your face within the oval guide
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* ID guide overlay */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-52 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                          Position your ID within the rectangle guide
                        </div>
                      </div>
                    )}
                    
                    {/* Countdown Overlay */}
                    {countdown !== null && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-8xl font-bold text-white mb-4 animate-pulse">
                            {countdown}
                          </div>
                          <div className="text-white text-xl font-semibold">
                            Get ready for capture!
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Capture Button Overlay */}
                    <div className="absolute bottom-4 right-4">
                      <Button 
                        onClick={capturePhoto} 
                        size="lg" 
                        disabled={isCapturing}
                        className="bg-brand-primary hover:bg-brand-dark disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all"
                      >
                        <Camera className="h-5 w-5" />
                        {isCapturing ? 'Capturing...' : `Capture ${currentStep === 'student' ? 'Photo' : 'ID'}`}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                    <div className="text-center">
                      <Camera className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                      <p className="text-xl font-medium text-gray-500 mb-2">Camera Preview</p>
                      <p className="text-gray-400 mb-4">Click "Start Camera" to see live preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Camera Controls and Status */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Camera Controls */}
            <div className="flex-1 flex flex-col items-center">
              <div className="flex gap-4 mb-6">
                {!isCameraActive ? (
                  <Button 
                    onClick={startCamera} 
                    size="lg"
                    className="flex items-center gap-3 bg-brand-medium hover:bg-brand-primary text-white font-semibold px-8 py-4 text-lg"
                  >
                    <Camera className="h-6 w-6" />
                    Start Camera Preview
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={capturePhoto} 
                      size="lg" 
                      disabled={isCapturing}
                      className="flex items-center gap-3 bg-brand-primary hover:bg-brand-dark disabled:bg-gray-400 text-white font-semibold px-8 py-4 text-lg transition-all"
                    >
                      <Camera className="h-6 w-6" />
                      {isCapturing ? '⏱️ Capturing...' : `📸 Capture ${currentStep === 'student' ? 'Student Photo' : 'ID Photo'}`}
                    </Button>
                    <Button 
                      onClick={stopCamera} 
                      variant="outline" 
                      size="lg"
                      className="px-6 py-4 text-lg"
                    >
                      Stop Camera
                    </Button>
                  </>
                )}
              </div>
              
              {/* Tips */}
              <div className="bg-brand-light/20 border border-brand-medium/30 rounded-lg p-4 max-w-md">
                <h4 className="font-semibold text-brand-dark mb-2">📝 Tips for Best Results:</h4>
                <ul className="text-sm text-brand-dark/80 space-y-1">
                  {currentStep === 'student' ? (
                    <>
                      <li>• Ensure good lighting on your face</li>
                      <li>• Look directly at the camera</li>
                      <li>• Remove glasses if they cause glare</li>
                      <li>• Keep a neutral expression</li>
                    </>
                  ) : (
                    <>
                      <li>• Hold ID flat and steady</li>
                      <li>• Ensure all text is readable</li>
                      <li>• Avoid shadows or glare</li>
                      <li>• Fill the frame with your ID</li>
                    </>
                  )}
                </ul>
                <div className="mt-3 pt-3 border-t border-brand-medium/20">
                  <p className="text-xs text-brand-primary/80 font-medium text-center">
                    🤖 AI-Powered Identity Verification by LogikSutra
                  </p>
                </div>
              </div>
            </div>

            {/* Captured Photos Status */}
            <div className="flex-1 space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-2 text-center">📋 Capture Status</h4>
                <p className="text-xs text-brand-primary/70 font-medium text-center mb-4 bg-brand-light/10 px-2 py-1 rounded">
                  Powered by LogikSutra AI Recruitment
                </p>
                
                {/* Student Photo Status */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <User className="h-5 w-5 text-brand-primary" />
                      Student Photo
                    </Label>
                    {studentPhoto ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Captured ✓</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600">
                        <Camera className="h-5 w-5" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                    {studentPhoto ? (
                      <div className="relative w-full h-full">
                        <img src={studentPhoto} alt="Student" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            onClick={() => {
                              setStudentPhoto(null);
                              setCurrentStep('student');
                              if (!isCameraActive) startCamera();
                            }}
                            size="sm"
                            variant="secondary"
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Retake
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm text-gray-500">Student photo will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ID Photo Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-brand-primary" />
                      ID Document
                    </Label>
                    {idPhoto ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Captured ✓</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600">
                        <Camera className="h-5 w-5" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                    {idPhoto ? (
                      <div className="relative w-full h-full">
                        <img src={idPhoto} alt="ID Document" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            onClick={() => {
                              setIdPhoto(null);
                              setCurrentStep('id');
                              if (!isCameraActive) startCamera();
                            }}
                            size="sm"
                            variant="secondary"
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Retake
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm text-gray-500">ID document will appear here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between border-t bg-gray-50 rounded-b-lg p-6">
          <Button onClick={goBack} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Details
          </Button>
          
          <Button 
            onClick={proceedToExam} 
            disabled={!studentPhoto || !idPhoto}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-dark hover:from-brand-primary/90 hover:to-brand-dark/90"
          >
            Proceed to Exam
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
