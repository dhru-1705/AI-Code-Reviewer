import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth.context';
import api from '../services/api';
import { 
  Code, 
  ShieldAlert, 
  Activity, 
  Clock, 
  ArrowRight, 
  PlusCircle, 
  Sparkles, 
  FileCode2, 
  TrendingUp,
  Bug,
  LineChart,
  Calendar,
  Languages
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    favLang: 'N/A',
    criticalBugsFixed: 0,
    reviewsToday: 0,
    weeklyProgress: '0%',
    weeklyTrend: 'neutral',
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/review/history');
        if (res.data.success) {
          const fetchedReviews = res.data.data;
          setReviews(fetchedReviews);
          
          if (fetchedReviews.length > 0) {
            const total = fetchedReviews.length;
            const sumScore = fetchedReviews.reduce((acc, curr) => acc + (curr.feedback?.score || 0), 0);
            const avgScore = Math.round(sumScore / total);
            
            // Favorite Language
            const langCounts = {};
            fetchedReviews.forEach(r => {
              const lang = r.language.toLowerCase();
              langCounts[lang] = (langCounts[lang] || 0) + 1;
            });
            let favLang = 'N/A';
            let maxCount = 0;
            Object.entries(langCounts).forEach(([lang, count]) => {
              if (count > maxCount) {
                maxCount = count;
                favLang = lang;
              }
            });

            // Critical Bugs Fixed (count of critical/high issues resolved across history)
            const criticalBugsFixed = fetchedReviews.reduce((acc, curr) => {
              const statsErrors = curr.feedback?.stats?.errorsCount || 0;
              const issuesErrors = curr.feedback?.issues?.filter(i => ['critical', 'high'].includes(i.severity)).length || 0;
              const oldSecurity = curr.feedback?.security?.filter(s => !s.toLowerCase().includes('none detected')).length || 0;
              return acc + Math.max(statsErrors, issuesErrors, oldSecurity);
            }, 0);

            // AI Reviews Today
            const today = new Date().toDateString();
            const reviewsToday = fetchedReviews.filter(r => new Date(r.createdAt).toDateString() === today).length;

            // Weekly Progress
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

            const reviewsThisWeek = fetchedReviews.filter(r => {
              const d = new Date(r.createdAt);
              return d >= sevenDaysAgo && d <= now;
            }).length;

            const reviewsLastWeek = fetchedReviews.filter(r => {
              const d = new Date(r.createdAt);
              return d >= fourteenDaysAgo && d < sevenDaysAgo;
            }).length;

            let weeklyProgress = '0%';
            let weeklyTrend = 'neutral';
            if (reviewsLastWeek === 0) {
              if (reviewsThisWeek > 0) {
                weeklyProgress = `+${reviewsThisWeek} reviews`;
                weeklyTrend = 'up';
              } else {
                weeklyProgress = '0%';
                weeklyTrend = 'neutral';
              }
            } else {
              const pct = Math.round(((reviewsThisWeek - reviewsLastWeek) / reviewsLastWeek) * 100);
              weeklyProgress = pct >= 0 ? `+${pct}%` : `${pct}%`;
              weeklyTrend = pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral';
            }

            setStats({
              total,
              avgScore,
              favLang: favLang.toUpperCase(),
              criticalBugsFixed,
              reviewsToday,
              weeklyProgress,
              weeklyTrend
            });
          }
        }
      } catch (error) {
        console.error('[Dashboard Fetch Error]', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (score >= 70) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    if (score >= 50) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome banner grid */}
      <div className="relative overflow-hidden bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-cyan p-8 rounded-3xl text-white shadow-xl shadow-neon-indigo/15">
        <div className="absolute right-[-10%] top-[-30%] w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute left-[30%] bottom-[-20%] w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <span className="bg-white/20 backdrop-blur-md text-white border border-white/15 font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Developer Workspace v1.1</span>
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-sans">
            Welcome, {user?.name || 'Developer'}!
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-xl leading-relaxed">
            Clean up code quality, check logic loops, run security vulnerability sweeps, and generate optimized code blocks instantaneously.
          </p>
          <div className="pt-2">
            <Link
              to="/review/new"
              className="inline-flex items-center space-x-2 bg-white text-neon-indigo font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 active:scale-95 transition-all shadow-md cursor-pointer text-sm"
            >
              <PlusCircle className="w-4 h-4 text-neon-indigo" />
              <span>Review New Code</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Advanced Telemetry Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
          { label: 'Total Reviews', val: stats.total, icon: <FileCode2 className="w-5 h-5" />, color: 'bg-neon-indigo/10 text-neon-indigo', desc: 'Runs in history' },
          { label: 'Average Score', val: `${stats.avgScore}/100`, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-neon-cyan/10 text-neon-cyan', desc: 'Codebase quality' },
          { label: 'Favorite Language', val: stats.favLang, icon: <Languages className="w-5 h-5" />, color: 'bg-neon-pink/10 text-neon-pink', desc: 'Top workspace tech' },
          { label: 'Bugs Resolved', val: stats.criticalBugsFixed, icon: <Bug className="w-5 h-5" />, color: 'bg-red-500/10 text-red-500', desc: 'Critical/high issues' },
          { label: 'Reviews Today', val: stats.reviewsToday, icon: <Calendar className="w-5 h-5" />, color: 'bg-neon-violet/10 text-neon-violet', desc: 'Completed today' },
          { 
            label: 'Weekly Progress', 
            val: stats.weeklyProgress, 
            icon: <LineChart className="w-5 h-5" />, 
            color: 'bg-green-500/10 text-green-500', 
            desc: stats.weeklyTrend === 'up' ? 'Increase vs last week' : stats.weeklyTrend === 'down' ? 'Decrease vs last week' : 'No variance',
            extra: (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 ${
                stats.weeklyTrend === 'up' ? 'text-green-500 bg-green-500/10' : stats.weeklyTrend === 'down' ? 'text-red-500 bg-red-500/10' : 'text-gray-400 bg-gray-500/10'
              }`}>
                {stats.weeklyTrend === 'up' ? '▲' : stats.weeklyTrend === 'down' ? '▼' : '■'}
              </span>
            )
          },
        ].map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 relative group overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                {card.label}
              </span>
              <div className={`p-2 rounded-xl transition-all duration-300 group-hover:scale-110 ${card.color}`}>
                {card.icon}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-baseline">
                <span className="text-xl font-black text-gray-800 dark:text-white">
                  {loading ? '...' : card.val}
                </span>
                {!loading && card.extra}
              </div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium leading-none">
                {card.desc}
              </p>
            </div>
            {/* Subtle glow border hover */}
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Recent Reviews Table */}
      <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-2xl p-6 shadow-sm overflow-hidden relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-extrabold text-gray-800 dark:text-white flex items-center space-x-2">
            <Clock className="text-neon-indigo w-4.5 h-4.5" />
            <span>Recent Code Evaluations</span>
          </h2>
          {reviews.length > 0 && (
            <Link
              to="/history"
              className="text-xs font-bold text-neon-indigo hover:text-neon-cyan flex items-center space-x-1 transition-colors"
            >
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 w-full bg-gray-50 dark:bg-dark-950 border border-gray-150 dark:border-dark-850 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          
          /* EMPTY STATE ILLUSTRATION */
          <div className="text-center py-16 space-y-4 max-w-sm mx-auto">
            <div className="p-4 bg-neon-indigo/5 border border-neon-indigo/15 rounded-2xl text-neon-indigo w-14 h-14 mx-auto flex items-center justify-center animate-bounce">
              <Code className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">No Reviews Completed Yet</h3>
            <p className="text-gray-400 text-xs leading-normal">
              Analyze your first program to build your review history. Open up the editor and submit your code to get started.
            </p>
            <div className="pt-2">
              <Link
                to="/review/new"
                className="inline-flex items-center space-x-1.5 px-4 py-2 border border-neon-indigo/40 hover:border-neon-indigo hover:bg-neon-indigo/5 text-neon-indigo text-xs font-bold rounded-xl transition-all"
              >
                <span>Run First Review</span>
              </Link>
            </div>
          </div>
        ) : (
          
          /* Review List Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-800 text-[10px] font-bold text-gray-450 uppercase tracking-widest pb-3">
                  <th className="pb-3 pr-4">Language</th>
                  <th className="pb-3 pr-4">Review Type</th>
                  <th className="pb-3 pr-4">Score</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-800 text-xs">
                {reviews.slice(0, 5).map((review) => (
                  <tr key={review._id} className="hover:bg-gray-50/50 dark:hover:bg-dark-800/20 transition-colors group">
                    <td className="py-4 pr-4 font-mono font-bold text-neon-cyan">
                      {review.language.toUpperCase()}
                    </td>
                    <td className="py-4 pr-4">
                      <span className="px-2.5 py-0.5 text-[9px] rounded font-bold uppercase tracking-wider bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-gray-400 border border-gray-200/20 dark:border-dark-800">
                        {review.reviewType}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getScoreColor(review.feedback?.score)}`}>
                        {review.feedback?.score || 100}/100 Grade {review.feedback?.summaryCards?.overallGrade || 'B'}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-gray-400">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        to="/history"
                        className="text-neon-indigo hover:text-neon-cyan font-bold transition-colors inline-flex items-center space-x-1"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
