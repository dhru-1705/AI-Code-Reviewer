import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth.context';

const AuthLayout = () => {
  const { user, loading } = useAuth();

  // Show loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-950">
        <div className="w-12 h-12 border-4 border-neon-indigo border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user is already logged in, redirect them to the home dashboard page
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-dark-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Visual branding block side (hidden on small viewports) */}
      <div className="hidden lg:flex lg:w-1/2 bg-dark-900 border-r border-dark-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Glow circles backgrounds */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-neon-indigo/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-neon-cyan/10 rounded-full blur-[120px]"></div>

        <div className="flex items-center space-x-2 z-10">
          <span className="text-3xl">🔍</span>
          <span className="text-xl font-bold tracking-tight gradient-text-indigo-cyan">AI Code Reviewer</span>
        </div>

        <div className="space-y-6 z-10">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Write better code. <br />
            Backed by <span className="gradient-text-indigo-cyan">AI intelligence</span>.
          </h1>
          <p className="text-gray-400 max-w-md">
            Get instant security reviews, runtime optimization analysis, and performance tips with Monaco code comparison editor.
          </p>
        </div>

        <div className="text-xs text-gray-500 z-10">
          © {new Date().getFullYear()} AI Code Reviewer. Production ready release.
        </div>
      </div>

      {/* Forms contents block side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Background glow for small devices */}
        <div className="absolute inset-0 bg-neon-indigo/5 dark:bg-neon-indigo/[0.02] lg:hidden"></div>
        <div className="w-full max-w-md z-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
