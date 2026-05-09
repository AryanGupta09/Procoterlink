'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, School, Calendar, Save } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFullName(userData.fullName || '');
          setEmail(userData.email || user.email || '');
          setCollege(userData.college || '');
          setGraduationYear(userData.graduationYear || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load your profile.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        fullName,
        college,
        graduationYear,
      });

      toast({
        title: 'Profile Updated!',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to update your profile. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account information and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information. Email cannot be changed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email address cannot be changed
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="college" className="flex items-center gap-2">
              <School className="h-4 w-4" />
              College/University
            </Label>
            <Input
              id="college"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="Enter your institution name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="graduationYear" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Graduation Year
            </Label>
            <Input
              id="graduationYear"
              type="number"
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              placeholder="e.g. 2025"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

