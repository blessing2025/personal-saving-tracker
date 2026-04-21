import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { I18nProvider } from 'react-aria';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register'; // Import Register
import Login from './pages/Login';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import IncomePage from './pages/IncomePage';
import ExpensePage from './pages/ExpensePage';
import GoalPage from './pages/GoalPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import VoiceRecords from './pages/VoiceRecords';
import { db } from './lib/db';
import { useOfflineSync } from './hooks/useOfflineSync'; // Import the offline sync hook
import { Toaster } from 'react-hot-toast';
import { translations } from './lib/translations';
// Helper to protect private routes
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// Shared layout for all authenticated pages to avoid repetitive JSX
const AppLayout = () => (
  <>
    <Navbar />
    <main className="container mx-auto px-4 py-8">
      <Outlet />
    </main>
  </>
);

const TranslationContext = createContext();
export const useTranslation = () => useContext(TranslationContext);

// This internal component ensures hooks that use AuthContext are inside the Provider
const AppContent = () => {
  useOfflineSync(); // Initialize offline synchronization
  const { user } = useAuth();

  const profile = useLiveQuery(
    () => (user ? db.profiles.get(user.id) : null),
    [user]
  );

  // Apply Dark Mode class to the document root
  useEffect(() => {
    // Default to 'light' if profile or theme is missing
    const currentTheme = profile?.theme || 'light';
    const isDark = currentTheme === 'dark';

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [profile?.theme]);

  // Memoize the translation function and add robust locale matching
  const t = useCallback((key) => {
    const lang = profile?.language || 'en-US';
    
    // 1. Try exact match (e.g., 'es-ES')
    // 2. Try base language match (e.g., if lang is 'es', find 'es-ES')
    const matchedLang = translations[lang] ? lang : 
                        Object.keys(translations).find(l => l.startsWith(lang.split('-')[0])) || 'en-US';

    return translations[matchedLang]?.[key] || translations['en-US']?.[key] || key;
  }, [profile?.language]);

  return (
    <I18nProvider locale={profile?.language || 'en-US'}>
      <TranslationContext.Provider value={{ t, profile }}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Private Routes wrapped in both Authentication and the App Shell Layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/income" element={<IncomePage />} />
            <Route path="/expenses" element={<ExpensePage />} />
            <Route path="/goals" element={<GoalPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/voice-notes" element={<VoiceRecords />} />
          </Route>
        </Routes>
      </div>
      </TranslationContext.Provider>
    </I18nProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
