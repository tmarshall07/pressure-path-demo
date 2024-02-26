import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Code Review Demo',
  description: 'A demo of rendering an SVG path with a "pressure" profile.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <Script src="/paper-full.js" />
      <body className={inter.className}>{children}</body>
    </html>
  );
}
