import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import DiscoverPage from '@/pages/DiscoverPage';
import ProfilePage from '@/pages/ProfilePage';
import ChatPage from '@/pages/ChatPage';
import SettingsPage from '@/pages/SettingsPage';
import CreatePostPage from '@/pages/CreatePostPage';
import PaymentsPage from '@/pages/PaymentsPage';
import AdvancedSearchPage from '@/pages/AdvancedSearchPage';
import CompleteProfilePage from '@/pages/CompleteProfilePage';
import { useAuth } from '@/hooks/useAuth';

const MainApp = () => {
    const { profile, loading } = useAuth();
    
    if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="loading-spinner" />
          </div>
        );
    }
    
    // This check is now a fallback, primary routing is in App.jsx
    if (!profile?.alias) {
        return <Navigate to="/complete-profile" replace />;
    }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/discover" replace />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/search" element={<AdvancedSearchPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:userId" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/create-post" element={<CreatePostPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="*" element={<Navigate to="/discover" replace />} />
      </Routes>
    </MainLayout>
  );
};

export default MainApp;