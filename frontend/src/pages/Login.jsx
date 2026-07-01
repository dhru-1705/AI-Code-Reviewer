import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth.context';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiArrowRight } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please fill in all credentials.');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      toast.success('Successfully logged in!');
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="w-full space-y-8 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 p-8 sm:p-10 rounded-2xl shadow-xl neon-glow-indigo transition-all duration-300">
      {/* Title Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-white">
          Welcome Back
        </h2>
        <p className="text-gray-400 text-sm">
          Access your secure code review dashboard
        </p>
      </div>

      {/* Form Submission */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Email input field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <FiMail className="w-5 h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-950 border border-gray-200 dark:border-dark-800 focus:border-neon-indigo focus:ring-1 focus:ring-neon-indigo rounded-xl text-sm placeholder-gray-400 outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <FiLock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark-950 border border-gray-200 dark:border-dark-800 focus:border-neon-indigo focus:ring-1 focus:ring-neon-indigo rounded-xl text-sm placeholder-gray-400 outline-none transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-cyan text-white font-semibold rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all duration-200 cursor-pointer shadow-lg shadow-neon-indigo/25"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Sign In</span>
              <FiArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Redirect registration block */}
      <div className="text-center pt-2 border-t border-gray-100 dark:border-dark-800">
        <span className="text-sm text-gray-400">
          New to the platform?{' '}
          <Link
            to="/register"
            className="text-neon-indigo hover:text-neon-cyan hover:underline font-semibold transition-colors duration-200"
          >
            Create an Account
          </Link>
        </span>
      </div>
    </div>
  );
};

export default Login;
