'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';


export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password || !referralCode) {
      toast({
        variant: "destructive",
        title: "Sign-up Failed",
        description: "Please fill in all fields.",
      });
      return;
    }
     try {
      // Check if referral code is valid
      const referralDocRef = doc(db, "referralCodes", referralCode);
      const referralDoc = await getDoc(referralDocRef);

      if (!referralDoc.exists() || !referralDoc.data().active) {
        toast({
          variant: "destructive",
          title: "Sign-up Failed",
          description: "Invalid or inactive referral code.",
        });
        return;
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create a document in 'users' collection
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date(),
        role: 'organizer'
      });

      router.push('/dashboard');
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Sign-up Failed",
        description: error.message || "Could not create an account. Please try again.",
      });
      console.error("Sign up failed:", error);
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
          <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Enter your details and referral code to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="referral">Referral Code</Label>
              <Input 
                id="referral" 
                type="text" 
                required 
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter your referral code"
              />
            </div>
            <Button type="submit" className="w-full">
              Sign Up
            </Button>
             <Button variant="outline" className="w-full" asChild>
                <Link href="/">Back to Home</Link>
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
