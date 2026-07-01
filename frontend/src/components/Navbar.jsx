import React from 'react';
import { useAuth } from '../context/auth.context';
import { useTheme } from '../context/theme.context';
import { Sun, Moon, LogOut, Sparkles, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <nav className="h-16 border-b border-gray-200 dark:border-dark-800 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md px-6 flex items-center justify-between z-20 sticky top-0">
      {/* Mobile Brand Title */}
      <div className="flex items-center space-x-2 lg:hidden">
        <div className="relative flex items-center justify-center p-1.5 bg-neon-indigo/10 rounded-xl text-neon-indigo">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <span className="font-extrabold tracking-tight text-md gradient-text-indigo-cyan">AI Reviewer</span>
      </div>
      
      {/* Desktop Path Breadcrumbs */}
      <div className="hidden lg:flex items-center space-x-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        <span>Workspace</span>
        <span>/</span>
        <span className="text-neon-indigo dark:text-neon-cyan font-bold">Analysis Engine</span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-dark-800/60 dark:hover:bg-dark-700/60 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-all duration-200 border border-gray-200/40 dark:border-dark-800/40 focus:outline-none focus:ring-2 focus:ring-neon-indigo/40"
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Card */}
        {user && (
          <div className="flex items-center space-x-3 pl-3 border-l border-gray-200 dark:border-dark-800">
            {/* User Profile Avatar Icon */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-neon-indigo to-neon-cyan p-0.5 flex items-center justify-center shadow-sm">
              <div className="w-full h-full bg-white dark:bg-dark-900 rounded-[10px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                <User className="w-4 h-4 text-neon-indigo dark:text-neon-cyan" />
              </div>
            </div>
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-tight">{user.name}</span>
              <span className="text-[10px] text-gray-400 font-mono tracking-tighter leading-none mt-0.5">{user.email}</span>
            </div>
            
            <button
              onClick={logout}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/10 transition-all duration-200 border border-transparent hover:border-red-500/20 focus:outline-none"
              title="Logout Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
