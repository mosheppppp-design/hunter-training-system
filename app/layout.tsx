import './globals.css';
import type { Metadata } from 'node_modules/@types/react'; // או ייבוא רגיל

export const metadata: Metadata = {
  title: 'Hunter Training System',
  description: 'מערכת אימונים אישית בסגנון Solo Leveling',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-gray-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
