import type { Metadata } from 'next';
import { Archivo_Black, Space_Mono } from 'next/font/google';
import './globals.css';

const archivoBlack = Archivo_Black({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
});

const spaceMono = Space_Mono({
  variable: '--font-mono-stack',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'AI MEETS HER — Digital Name Card',
  description:
    'Vibe Coding Day To Visualize Your Dream. Find your collab match at AI MEETS HER.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${spaceMono.variable} antialiased`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
