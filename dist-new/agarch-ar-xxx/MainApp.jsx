import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import DiscoverPage from '@/pages/DiscoverPage';
import ProfilePage from '@/pages/ProfilePage';
import MyProfilePage from '@/pages/MyProfilePage';
import ChatsPage from '@/pages/ChatsPage';
import ChatRoom from '@/pages/ChatRoom';
import SettingsPage from '@/pages/SettingsPage';
import CreatePostPage from '@/pages/CreatePostPage';
import PaymentsPage from '@/pages/PaymentsPage';
import AdvancedSearchPage from '@/pages/AdvancedSearchPage';
import PostPage from '@/pages/PostPage';
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
    
    // Usuario ya validado, puede acceder libremente

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/discover" replace />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/search" element={<AdvancedSearchPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/my-profile" element={<MyProfilePage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/chat/:id" element={<ChatRoom />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/create-post" element={<CreatePostPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/post/:id" element={<PostPage />} />
        <Route path="*" element={<Navigate to="/discover" replace />} />
      </Routes>
    </MainLayout>
  );
};

export default MainApp;
