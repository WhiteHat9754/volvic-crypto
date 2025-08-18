'use client';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { SocketProvider } from '../contexts/SocketContext';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { NotificationProvider } from '../contexts/NotificationContext';
import GlobalNotifications from '../components/GlobalNotifications';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Check if current page is landing page
  const isLandingPage = pathname === '/';
  
  return (
    <html lang="en">
      <body className={isLandingPage ? "bg-gray-900" : "bg-slate-900"}>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen">
              {/* Conditionally render Navbar - only show on authenticated pages */}
              {!isLandingPage && <Navbar />}
              
              <main className={isLandingPage ? "" : ""}> 
                <NotificationProvider>
                  {children}
                  {/* Only show notifications on authenticated pages */}
                  {!isLandingPage && <GlobalNotifications />}
                </NotificationProvider>
              </main>
              
              {/* Conditionally render Footer */}
              {!isLandingPage && <Footer />}
            </div>
            <Toaster 
              position="top-right"
              toastOptions={{
                className: isLandingPage 
                  ? 'bg-gray-800 text-white border border-gray-700' 
                  : 'bg-slate-800 text-white',
                duration: 4000,
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
