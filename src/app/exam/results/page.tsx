'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, GraduationCap } from 'lucide-react';

export default function ExamResultsPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-lg text-center border-0 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-brand-primary to-brand-dark text-white py-8 rounded-t-lg">
          <div className="flex flex-col items-center mb-4">
            <GraduationCap className="w-12 h-12 text-white mb-2" />
            <div className="text-center">
              <div className="text-xl font-bold text-white">ProctorLink</div>
              <div className="text-xs text-brand-light/90 font-medium">Powered by LogikSutra AI Recruitment</div>
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-300" />
          </div>
          <CardTitle className="text-3xl text-white">Exam Completed!</CardTitle>
          <CardDescription className="text-lg text-brand-light/90">
            Thank you for taking the exam. Your results have been submitted successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <p className="text-brand-dark mb-4">You may now close this window.</p>
            <div className="bg-brand-light/20 border border-brand-medium/30 rounded-lg p-4 mb-6">
              <p className="text-xs text-brand-primary/80 font-medium">
                🏆 Exam processed by LogikSutra AI Recruitment Technology
              </p>
              <p className="text-xs text-brand-medium/80 mt-1">
                Advanced proctoring and anti-cheating measures were active
              </p>
            </div>
          </div>
          <Button asChild className="w-full bg-brand-primary hover:bg-brand-dark">
            <Link href="/">Back to Homepage</Link>
          </Button>
        </CardContent>
        <div className="border-t bg-gray-50 px-8 py-4 rounded-b-lg">
          <div className="text-center">
            <p className="text-xs text-brand-medium/80 font-medium">
              ✨ Thank you for using LogikSutra AI Recruitment Platform
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
