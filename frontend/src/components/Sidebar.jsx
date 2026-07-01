import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Code2, History, Sparkles } from 'lucide-react';

const Sidebar = () => {
  const links = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'New Review', path: '/review/new', icon: <Code2 className="w-5 h-5" /> },
    { name: 'History Logs', path: '/history', icon: <History className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-dark-800 bg-white dark:bg-dark-900 hidden lg:flex flex-col z-20 transition-all duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-dark-800 bg-gray-50/20 dark:bg-dark-900/40">
        <div className="relative flex items-center justify-center p-1.5 bg-neon-indigo/10 rounded-xl mr-2 text-neon-indigo">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <span className="font-extrabold tracking-tight text-lg gradient-text-indigo-cyan">
          AI Code Reviewer
        </span>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 p-4 space-y-1.5">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-neon-indigo/10 to-neon-cyan/5 text-neon-indigo dark:text-white font-medium border border-neon-indigo/25'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-dark-800/40 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active left indicator line */}
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-neon-indigo rounded-r-lg" />
                )}
                <span className={`transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? 'text-neon-indigo dark:text-neon-cyan' : 'text-gray-500'
                }`}>
                  {link.icon}
                </span>
                <span className="relative z-10">{link.name}</span>
                {/* Hover back glow */}
                <span className="absolute inset-0 bg-neon-indigo/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer metadata */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-800 text-center bg-gray-50/10 dark:bg-dark-900/20">
        <span className="text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
          v1.1.0 Premium Release
        </span>
      </div>
    </aside>
  );
};

export default Sidebar;
