import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
            <Link href="/" className="flex items-center justify-center" prefetch={false}>
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="ml-2 text-xl font-bold font-headline">ProctorLink</span>
            </Link>
            <nav className="ml-auto flex items-center gap-4">
                <Button asChild variant="outline">
                    <Link href="/login">Organizer Login</Link>
                </Button>
                 <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                </Button>
            </nav>
        </div>
      </header>
      <main className="flex-1 py-12 md:py-16 lg:py-20">
        <div className="container prose prose-gray dark:prose-invert max-w-4xl mx-auto">
          {children}
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-card">
        <p className="text-xs text-muted-foreground">&copy; 2024 ProctorLink. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/legal/terms" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="/legal/privacy" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
