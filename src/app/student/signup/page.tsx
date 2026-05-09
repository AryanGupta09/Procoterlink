'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';


export default function StudentSignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast({
        variant: "destructive",
        title: "Sign-up Failed",
        description: "Please fill in all required fields.",
      });
      return;
    }
    try {
      let userCredential;
      
      // Try to create a new account
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create a document in 'users' collection with student role
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          fullName,
          college: college || 'N/A',
          graduationYear: graduationYear || 'N/A',
          role: 'student',
          createdAt: new Date(),
          profileCompleted: true
        });

        toast({
          title: "Account Created!",
          description: "Welcome to ProctorLink! Your account has been created successfully.",
        });

        router.push('/student/dashboard');
      } catch (createError: any) {
        // If email already exists, sign in instead and add student role
        if (createError.code === 'auth/email-already-in-use') {
          // Sign in with existing credentials
          userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // Check if user document exists
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Update role to include both student and organizer if needed
            if (userData.role === 'organizer' || userData.admin) {
              await updateDoc(userDocRef, {
                role: 'both',
                studentProfile: {
                  fullName,
                  college: college || 'N/A',
                  graduationYear: graduationYear || 'N/A',
                  profileCompleted: true
                }
              });
              toast({
                title: "Welcome Back!",
                description: "Your organizer account now has student access too.",
              });
            } else {
              // Already a student, just update profile
              await updateDoc(userDocRef, {
                fullName,
                college: college || 'N/A',
                graduationYear: graduationYear || 'N/A'
              });
              toast({
                title: "Welcome Back!",
                description: "Profile updated successfully.",
              });
            }
          } else {
            // User exists in Auth but not in Firestore, create the document
            await setDoc(userDocRef, {
              email: user.email,
              fullName,
              college: college || 'N/A',
              graduationYear: graduationYear || 'N/A',
              role: 'student',
              createdAt: new Date(),
              profileCompleted: true
            });
            toast({
              title: "Welcome!",
              description: "Your student profile has been created.",
            });
          }

          router.push('/student/dashboard');
        } else {
          // Other errors (wrong password, etc.)
          throw createError;
        }
      }
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Sign-up Failed",
        description: error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential'
          ? "Incorrect password. If you already have an account, please login instead."
          : error.message || "Could not create an account. Please try again.",
      });
      console.error("Sign up failed:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader>
          <div className="flex flex-col items-center mb-4">
            <GraduationCap className="w-12 h-12 text-brand-primary mb-2" />
            <div className="text-center">
              <div className="text-xl font-bold text-brand-dark">ProctorLink</div>
              <div className="text-xs text-brand-medium/80 font-medium">Powered by LogikSutra AI Recruitment</div>
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Create Student Account</CardTitle>
          <CardDescription className="text-center">
            Create your free student account to take exams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="college">College/University (Optional)</Label>
              <Input 
                id="college" 
                type="text" 
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="Your institution name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="graduationYear">Graduation Year (Optional)</Label>
              <Input 
                id="graduationYear" 
                type="number" 
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="2025"
              />
            </div>
            <Button type="submit" className="w-full">
              Create Account
            </Button>
            <Button variant="outline" className="w-full" asChild>
                <Link href="/">Back to Home</Link>
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/student/login" className="underline">
              Login
            </Link>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Are you an organizer?{' '}
            <Link href="/signup" className="underline">
              Organizer Signup
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

