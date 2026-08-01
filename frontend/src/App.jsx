import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import AuthModal from './components/common/AuthModal';
import ProductTour from './components/common/ProductTour';
import CreatorGuideModal from './components/common/CreatorGuideModal';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import HomePage from './pages/HomePage';
import AIToolsPage from './pages/AIToolsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import SettingsPage from './pages/SettingsPage';

import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import TermsOfServicePage from './pages/legal/TermsOfServicePage';
import RefundPolicyPage from './pages/legal/RefundPolicyPage';
import ContactUsPage from './pages/legal/ContactUsPage';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '42205160974-i9p2fss2bmh9drir0uefdp684dqtiig1.apps.googleusercontent.com';

function EditorRouteWrapper() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <EditorPage
      projectId={id}
      onBack={() => navigate('/dashboard')}
    />
  );
}

function DashboardRouteWrapper() {
  const navigate = useNavigate();

  return (
    <DashboardPage
      onSelectProject={(projectId) => navigate(`/editor/${projectId}`)}
    />
  );
}

function MainApp() {
  const { theme } = useTheme();
  const [tourOpen, setTourOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('auto_captions_tour_seen');
    if (!hasSeenTour) {
      setTourOpen(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300 w-full">
      <Header onOpenTour={() => setTourOpen(true)} />

      <main className="flex-1 pb-16 sm:pb-12 w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardRouteWrapper />} />
          <Route path="/ai-studio" element={<AIToolsPage />} />
          <Route path="/editor/:id" element={<EditorRouteWrapper />} />
          <Route path="/generation/:id" element={<EditorRouteWrapper />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />

          {/* Legal Compliance Routes for Razorpay / Cashfree / Stripe Approval */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/contact" element={<ContactUsPage />} />

          <Route path="*" element={<DashboardRouteWrapper />} />
        </Routes>
      </main>

      <Footer />
      <AuthModal />
      <ProductTour
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        onOpenGuide={() => setGuideOpen(true)}
      />
      <CreatorGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: theme === 'light' ? '#ffffff' : '#18181b',
            color: theme === 'light' ? '#0f172a' : '#f4f4f5',
            border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #27272a',
            borderRadius: '0.75rem',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#eab308',
              secondary: theme === 'light' ? '#ffffff' : '#18181b',
            },
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <MainApp />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
