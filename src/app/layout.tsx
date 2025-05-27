
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Link from 'next/link';
import { Image as ImageIcon } from 'lucide-react'; // Changed from ScanEye

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'UltronxGemini Image Review Tool',
  description: 'Upload photos, review them in a gallery, and ask questions using Gemini AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <header className="py-4 px-4 sm:px-6 lg:px-8 bg-card border-b sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
              <ImageIcon className="w-8 h-8" /> {/* Changed from ScanEye */}
              <span>UltronxGemini Image Review Tool</span>
            </Link>
            {/* Future navigation items can go here */}
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Toaster />
        <footer className="py-6 text-center text-muted-foreground text-sm border-t bg-card">
          <p className="mt-2">
            Built with love ❤️ by Ultron Developments. {}
            <a 
              href="https://ultrondevelopments.com.au" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="underline hover:text-primary transition-colors"
            >
              Contact Us
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
