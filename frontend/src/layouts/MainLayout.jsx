import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth.context';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const MainLayout = () => {
  const { user, loading } = useAuth();

  // Show loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-dark-950">
        <div className="w-12 h-12 border-4 border-neon-indigo border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect to login if user session does not exist
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Navigation sidebar */}
      <Sidebar />

      {/* Primary viewport frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header toolbar */}
        <Navbar />

        {/* Dynamic page contents */}
        <main className="flex-1 overflow-y-auto p-6 focus:outline-none">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
