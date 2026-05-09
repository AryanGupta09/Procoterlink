import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'ProctorLink - Powered by LogikSutra AI Recruitment',
  description: 'Advanced online proctoring platform for secure exams. Intelligent exam creation, AI-powered proctoring, and comprehensive analytics powered by LogikSutra AI Recruitment.',
  keywords: 'online exams, proctoring, AI recruitment, secure testing, LogikSutra, exam platform',
  authors: [{ name: 'LogikSutra AI Recruitment' }],
  creator: 'LogikSutra AI Recruitment',
  publisher: 'LogikSutra AI Recruitment',
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
    title: 'ProctorLink - Advanced Online Proctoring',
    description: 'Secure online examination platform powered by LogikSutra AI Recruitment technology.',
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
    title: 'ProctorLink - Powered by LogikSutra AI',
    description: 'Advanced online proctoring platform for secure exams.',
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
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}


