import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import { Inter, Lexend } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-body' });
const lexend = Lexend({ subsets: ['latin'], variable: '--font-headline' });


export const metadata: Metadata = {
  title: 'EnglishCourse',
  description: 'Learn English with EnglishCourse',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} ${lexend.variable} dark`}>
      <body className="font-body antialiased bg-background text-foreground">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
