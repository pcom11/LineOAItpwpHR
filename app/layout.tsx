import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'LINE OA ITPWP HR',
  description: 'LINE Official Account webhook bridge — Gemini-powered HR assistant.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          margin: 0,
          padding: 0,
          backgroundColor: '#0b1020',
          color: '#e6eaf2',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
