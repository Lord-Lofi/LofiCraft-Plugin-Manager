import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { NavigationProvider } from '@/components/NavigationProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'LofiCraft Panel',
  description: 'Minecraft Plugin Manager',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavigationProvider>
          {children}
        </NavigationProvider>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              color: '#f9fafb',
            },
          }}
        />
      </body>
    </html>
  );
}
