import React from 'react';
import Sidebar from '@/components/layouts/Sidebar';
import TopNavBar from '@/components/layouts/TopNavBar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <TopNavBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pt-24 md:pt-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
