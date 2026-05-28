import type { Metadata } from 'next';
import { Anton, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const anton = Anton({
  variable: '--font-anton',
  subsets: ['latin'],
  weight: '400',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
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
      className={`${anton.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
