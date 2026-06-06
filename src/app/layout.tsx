import type { Metadata } from 'next';
import { Anton, JetBrains_Mono, Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { ThemeScope } from './theme-scope';

const anton = Anton({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono-stack',
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
});

const notoSansJP = Noto_Sans_JP({
  variable: '--font-jp',
  subsets: ['latin'],
  weight: ['500', '700'],
});

export const metadata: Metadata = {
  title: 'AI MEETS HER · activity card',
  description:
    'Vibe Coding Day To Visualize Your Dream. Drop your card and find your match.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${jetbrainsMono.variable} ${notoSansJP.variable} antialiased`}
    >
      <body className="min-h-screen">
        <ThemeScope />
        {children}
      </body>
    </html>
  );
}
