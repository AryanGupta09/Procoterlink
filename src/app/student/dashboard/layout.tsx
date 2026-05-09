'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useEffect } from 'react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, userRole } = useAuth();
  const router = useRouter();

  // Link old exam submissions to user account when they login
  useEffect(() => {
    const linkOldSubmissions = async () => {
      if (!user?.uid || !user?.email) return;

      try {
        // Find all submissions with this email that don't have a userId
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('participantEmail', '==', user.email)
        );
        
        const querySnapshot = await getDocs(submissionsQuery);
        
        // Update each submission to link it to the user
        const updatePromises = querySnapshot.docs
          .filter(doc => !doc.data().userId) // Only update submissions without userId
          .map(docSnapshot => {
            return updateDoc(doc(db, 'submissions', docSnapshot.id), {
              userId: user.uid
            });
          });

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          console.log(`Linked ${updatePromises.length} old submissions to user account`);
        }
      } catch (error) {
        console.error('Error linking old submissions:', error);
      }
    };

    linkOldSubmissions();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between gap-2">
          <Link href="/student/dashboard" className="flex items-center space-x-2 shrink-0">
            <GraduationCap className="h-5 w-5 text-brand-primary" />
            <span className="font-bold text-base sm:text-xl">ProctorLink</span>
            <span className="hidden sm:inline text-xs text-brand-medium/80 ml-1">Student Portal</span>
          </Link>
          
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/student/dashboard">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                <LayoutDashboard className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">My Exams</span>
              </Button>
            </Link>
            <Link href="/student/profile">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                <User className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
            </Link>
            {userRole === 'both' && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <LayoutDashboard className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Organizer</span>
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" className="px-2 sm:px-3" onClick={handleLogout}>
              <LogOut className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto">
        <div className="container py-4 sm:py-6 px-3 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}

