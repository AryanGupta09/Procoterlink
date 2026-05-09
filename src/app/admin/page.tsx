'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { Copy } from 'lucide-react';

interface ReferralCode {
    id: string;
    code: string;
    createdAt: string;
    active: boolean;
}

export default function AdminPage() {
    const { toast } = useToast();
    const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const fetchCodes = async () => {
            setIsLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "referralCodes"));
                const codes = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        code: data.code,
                        createdAt: data.createdAt.toDate().toLocaleString(),
                        active: data.active
                    };
                });
                setReferralCodes(codes);
            } catch (error) {
                console.error("Error fetching codes:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch referral codes.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchCodes();
    }, [toast]);

    const generateCode = async () => {
        setIsGenerating(true);
        try {
            const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            const docRef = await addDoc(collection(db, "referralCodes"), {
                code: newCode,
                active: true,
                createdAt: serverTimestamp(),
            });
            setReferralCodes(prev => [...prev, { id: docRef.id, code: newCode, createdAt: new Date().toLocaleString(), active: true }]);
            toast({ title: 'Success!', description: `Generated new code: ${newCode}`});
        } catch (error) {
             console.error("Error generating code:", error);
             toast({ variant: 'destructive', title: 'Error', description: 'Could not generate new code.' });
        } finally {
            setIsGenerating(false);
        }
    }

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({ title: 'Copied!', description: `${code} copied to clipboard.`});
    };

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-lg font-semibold md:text-2xl">Admin Panel</h1>
             <Card>
                <CardHeader>
                    <CardTitle>Generate Referral Code</CardTitle>
                    <CardDescription>Create a new referral code for new organizers to sign up.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={generateCode} disabled={isGenerating}>
                        {isGenerating ? 'Generating...' : 'Generate New Code'}
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Existing Referral Codes</CardTitle>
                    <CardDescription>List of all generated referral codes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                                </TableRow>
                            ) : (
                                referralCodes.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-mono">{c.code}</TableCell>
                                        <TableCell>{c.createdAt}</TableCell>
                                        <TableCell>{c.active ? 'Active' : 'Inactive'}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(c.code)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
