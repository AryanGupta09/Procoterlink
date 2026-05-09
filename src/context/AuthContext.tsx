'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

interface UserProfile extends User {
  isAdmin?: boolean;
  isStudent?: boolean;
  role?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  userRole?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isStudent: false,
  userRole: undefined,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role || (userData.admin ? 'organizer' : 'student');
          
          setUser({ ...user, isAdmin: userData.admin || false, isStudent: role === 'student' || role === 'both', role });
          setIsAdmin(userData.admin || false);
          setIsStudent(role === 'student' || role === 'both');
          setUserRole(role);
        } else {
          setUser(user);
          setIsAdmin(false);
          setIsStudent(false);
          setUserRole(undefined);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsStudent(false);
        setUserRole(undefined);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/student/login' || pathname === '/student/signup';
    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/student/dashboard');

    if (!user && isProtectedRoute) {
        router.replace('/login');
    }
    if (user && isAuthRoute) {
        if (userRole === 'student') {
          router.replace('/student/dashboard');
        } else if (userRole === 'both') {
          // Users with both roles go to organizer dashboard by default
          router.replace('/dashboard');
        } else {
          router.replace('/dashboard');
        }
    }

  }, [user, loading, pathname, router, userRole]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isStudent, userRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);