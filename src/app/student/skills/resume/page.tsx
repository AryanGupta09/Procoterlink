"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  MessageSquare, 
  Send, 
  Loader2,
  CheckCircle2,
  Sparkles,
  User,
  Bot,
  Trash2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResumeReview, ResumeChatMessage } from '@/lib/resume';
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

export default function ResumePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resumes, setResumes] = useState<ResumeReview[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeReview | null>(null);
  const [review, setReview] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ResumeChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      loadResumes();
    }
  }, [user]);

  useEffect(() => {
    if (selectedResume?.id) {
      loadChatMessages();
    }
  }, [selectedResume]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadResumes = async () => {
    if (!user?.uid) return;
    
    setLoadingResumes(true);
    try {
      const response = await fetch(`/api/resume?userId=${user.uid}`);
      const data = await response.json();
      
      if (data.success && data.resumes) {
        setResumes(data.resumes);
        if (data.resumes.length > 0 && !selectedResume) {
          setSelectedResume(data.resumes[0]);
        }
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
    } finally {
      setLoadingResumes(false);
    }
  };

  const loadChatMessages = async () => {
    if (!selectedResume?.id) return;
    
    try {
      const response = await fetch(`/api/resume/chat?resumeId=${selectedResume.id}`);
      const data = await response.json();
      
      if (data.success && data.messages) {
        setChatMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'txt', 'docx'].includes(fileExtension || '')) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: 'Please upload a PDF, TXT, or DOCX file.',
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a file and ensure you are logged in.',
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.uid);

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData,
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
        setReview(data.review);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Reload resumes
        await loadResumes();
        
        // Select the newly uploaded resume
        if (data.resumeId) {
          const resumeResponse = await fetch(`/api/resume?resumeId=${data.resumeId}`);
          const resumeData = await resumeResponse.json();
          if (resumeData.success && resumeData.resume) {
            setSelectedResume(resumeData.resume);
          }
        }

        toast({
          title: 'Success!',
          description: 'Resume uploaded and analyzed successfully.',
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload resume.';
      const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('429');
      
      toast({
        variant: 'destructive',
        title: isRateLimit ? 'Rate Limit Exceeded' : 'Upload Failed',
        description: errorMessage,
        duration: isRateLimit ? 8000 : 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedResume?.id || !user?.uid) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setSendingMessage(true);

    // Add user message to UI immediately
    const tempUserMessage: ResumeChatMessage = {
      resumeId: selectedResume.id,
      userId: user.uid,
      role: 'user',
      content: userMessage,
      createdAt: new Date(),
    };
    setChatMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch('/api/resume/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: selectedResume.id,
          userId: user.uid,
          message: userMessage,
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

      if (data.success && data.response) {
        // Reload messages to get the saved ones
        await loadChatMessages();
      }
    } catch (error: any) {
      // Remove temp message on error
      setChatMessages(prev => prev.slice(0, -1));
      
      const errorMessage = error.message || 'Failed to send message.';
      const isRateLimit = errorMessage.includes('rate limit') || errorMessage.includes('429');
      
      toast({
        variant: 'destructive',
        title: isRateLimit ? 'Rate Limit Exceeded' : 'Error',
        description: errorMessage,
        duration: isRateLimit ? 8000 : 5000,
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!user?.uid) return;
    
    setDeletingResumeId(resumeId);
    
    try {
      const response = await fetch(`/api/resume/delete?resumeId=${resumeId}&userId=${user.uid}`, {
        method: 'DELETE',
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
        // Remove from local state
        setResumes(prev => prev.filter(r => r.id !== resumeId));
        
        // If deleted resume was selected, clear selection
        if (selectedResume?.id === resumeId) {
          setSelectedResume(null);
          setReview(null);
          setChatMessages([]);
        }
        
        toast({
          title: 'Success!',
          description: 'Resume deleted successfully.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete resume. Please try again.',
      });
    } finally {
      setDeletingResumeId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 flex flex-col gap-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Resume
          </CardTitle>
          <CardDescription>
            Upload your resume (PDF, TXT, or DOCX) to get AI-powered feedback and chat about improvements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resume-file">Resume File</Label>
            <Input
              id="resume-file"
              type="file"
              accept=".pdf,.txt,.docx"
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={uploading}
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{file.name}</span>
                <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
              </div>
            )}
          </div>
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading and Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Upload & Analyze Resume
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resumes List */}
      {loadingResumes ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : resumes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Resumes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {resumes.map((resume) => (
                <Card
                  key={resume.id}
                  className={`cursor-pointer transition-all ${
                    selectedResume?.id === resume.id
                      ? 'ring-2 ring-primary'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedResume(resume)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{resume.fileName}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {resume.metadata.pageCount} page{resume.metadata.pageCount !== 1 ? 's' : ''} • {' '}
                          {(resume.metadata.fileSize / 1024).toFixed(1)} KB
                        </p>
                        <div className="flex gap-2 mt-2">
                          {resume.embeddingsGenerated && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Indexed
                            </Badge>
                          )}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{resume.fileName}"? This action cannot be undone and will also delete all associated chat messages.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteResume(resume.id!)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deletingResumeId === resume.id}
                            >
                              {deletingResumeId === resume.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                'Delete'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Section */}
      {review && selectedResume && (
        <Card>
          <CardHeader>
            <CardTitle>AI Resume Review</CardTitle>
            <CardDescription>
              Comprehensive feedback for: {selectedResume.fileName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full pr-4">
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {review}
                </ReactMarkdown>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Chat Section */}
      {selectedResume && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat About Your Resume
            </CardTitle>
            <CardDescription>
              Ask questions about your resume and get personalized improvement suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[400px] w-full pr-4 border rounded-lg p-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                  <p>Start a conversation about your resume!</p>
                  <p className="text-sm mt-2">Try asking: "How can I improve my resume?" or "What keywords should I add?"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id || Math.random()}
                      className={`flex gap-3 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-slate prose-sm max-w-none text-foreground">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </ScrollArea>
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask about your resume..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={sendingMessage}
                className="min-h-[60px]"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || sendingMessage}
                size="icon"
                className="h-[60px] w-[60px]"
              >
                {sendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
