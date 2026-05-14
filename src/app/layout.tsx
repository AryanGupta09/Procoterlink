import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'ProctorLink: Secure Online Examinations with a Student-Focused Grow & Career Hub',
  description: 'ProctorLink offers secure online examinations with AI-powered proctoring and a student-focused Grow & Career Hub for skill development and career growth.',
  keywords: 'online exams, proctoring, AI, secure testing, exam platform, career hub, student growth, skill development',
  authors: [{ name: 'ProctorLink' }],
  creator: 'ProctorLink',
  publisher: 'ProctorLink',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    apple: [
      { url: '/apple-touch-icon.svg', type: 'image/svg+xml' }
    ],
  },
  openGraph: {
    title: 'ProctorLink: Secure Online Examinations with a Student-Focused Grow & Career Hub',
    description: 'Secure online examinations with a student-focused Grow & Career Hub.',
    type: 'website',
    images: [
      {
        url: '/logo.svg',
        width: 120,
        height: 40,
        alt: 'ProctorLink Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'ProctorLink: Secure Online Examinations with a Student-Focused Grow & Career Hub',
    description: 'Secure online examinations with AI-powered proctoring and a student-focused Grow & Career Hub.',
    images: ['/icon.svg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B38A0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ProctorLink" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


