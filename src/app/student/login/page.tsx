'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';


export default function StudentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/student/dashboard');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
      });
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <div className="flex flex-col items-center mb-4">
            <GraduationCap className="w-12 h-12 text-brand-primary mb-2" />
            <div className="text-center">
              <div className="text-xl font-bold text-brand-dark">ProctorLink</div>
              <div className="text-xs text-brand-medium/80 font-medium">Powered by LogikSutra AI Recruitment</div>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Student Login</CardTitle>
          <CardDescription className="text-center">
            Enter your email to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline" prefetch={false}>
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
            <Button variant="outline" className="w-full" asChild>
                <Link href="/">Back to Home</Link>
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/student/signup" className="underline">
              Sign up
            </Link>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Are you an organizer?{' '}
            <Link href="/login" className="underline">
              Organizer Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

