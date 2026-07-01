import React, { useState, useEffect } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTheme } from '../context/theme.context';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Trash2, 
  Download, 
  Eye, 
  Search, 
  Filter, 
  Calendar, 
  Plus, 
  ArrowLeft, 
  Info,
  Bug, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  BookOpen, 
  Split, 
  Copy, 
  Check,
  ListFilter,
  Award,
  Coins,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

const SimpleMarkdown = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-2.5 font-sans text-sm text-gray-600 dark:text-gray-300">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-md font-bold text-gray-800 dark:text-white mt-4 border-b border-gray-100 dark:border-dark-800 pb-1">{line.slice(4)}</h3>;
        }
        if (line.startsWith('#### ')) {
          return <h4 key={i} className="text-sm font-semibold text-neon-indigo dark:text-neon-cyan mt-3">{line.slice(5)}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-lg font-bold text-gray-800 dark:text-white mt-5 border-b border-gray-250 dark:border-dark-800 pb-2">{line.slice(3)}</h2>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start pl-3 space-x-2">
              <span className="text-neon-indigo mt-1.5 font-bold text-xs">•</span>
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1.5" />;
        return <p key={i} className="leading-relaxed">{line}</p>;
      })}
    </div>
  );
};

const History = () => {
  const { isDark } = useTheme();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  
  // Search, Filters & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = newest, asc = oldest

  // Navigation tabs in details panel
  const [activeTab, setActiveTab] = useState('summary'); // summary, issues, fixed, explanation, performance, security
  const [diffView, setDiffView] = useState(false);
  const [copied, setCopied] = useState(false);

  // Score Animation in details
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, []);

  // Trigger score gauge animations when selected log changes
  useEffect(() => {
    if (selectedReview && selectedReview.feedback?.score !== undefined) {
      setAnimatedScore(0);
      const target = selectedReview.feedback.score;
      if (target === 0) return;
      
      const duration = 600;
      const steps = Math.max(1, target);
      const stepTime = Math.round(duration / steps);
      let count = 0;
      
      const timer = setInterval(() => {
        count++;
        setAnimatedScore(count);
        if (count >= target) {
          clearInterval(timer);
        }
      }, stepTime || 10);
      
      return () => clearInterval(timer);
    }
  }, [selectedReview]);

  const fetchHistory = async (autoSelectId = null) => {
    setLoading(true);
    try {
      const res = await api.get('/review/history');
      if (res.data.success) {
        const data = res.data.data;
        setReviews(data);
        
        if (data.length > 0) {
          if (autoSelectId) {
            const found = data.find(r => r._id === autoSelectId);
            setSelectedReview(found || data[0]);
          } else if (window.innerWidth >= 1024) {
            setSelectedReview(data[0]);
          }
        } else {
          setSelectedReview(null);
        }
      }
    } catch (error) {
      console.error('[Fetch History Error]', error);
      toast.error('Failed to load code review history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); 
    if (!window.confirm('Are you sure you want to delete this code review log?')) return;

    try {
      const res = await api.delete(`/review/${id}`);
      if (res.data.success) {
        toast.success('Code review log deleted.');
        const remaining = reviews.filter(r => r._id !== id);
        setReviews(remaining);
        
        if (selectedReview?._id === id) {
          if (remaining.length > 0) {
            setSelectedReview(remaining[0]);
          } else {
            setSelectedReview(null);
          }
        }
      } else {
        toast.error(res.data.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('[Delete Review Error]', error);
      toast.error('Failed to delete history log.');
    }
  };

  const handleCopyFixed = () => {
    if (!selectedReview?.optimizedCode) return;
    navigator.clipboard.writeText(selectedReview.optimizedCode);
    setCopied(true);
    toast.success('Optimized code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = (content, languageStr, typeLabel) => {
    const extensions = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      cpp: 'cpp',
      java: 'java',
      html: 'html',
      css: 'css',
      go: 'go'
    };
    const ext = extensions[languageStr.toLowerCase()] || 'txt';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `optimized_${typeLabel}_${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Download started.');
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreDetails = (score) => {
    const sc = score || 0;
    if (sc >= 90) return { color: 'text-green-500', border: 'border-green-500/20 dark:border-green-500/30', bg: 'bg-green-500/5', badge: 'Excellent', textClass: 'text-green-500', ringColor: 'stroke-green-500' };
    if (sc >= 70) return { color: 'text-blue-500', border: 'border-blue-500/20 dark:border-blue-500/30', bg: 'bg-blue-500/5', badge: 'Good', textClass: 'text-blue-500', ringColor: 'stroke-blue-500' };
    if (sc >= 50) return { color: 'text-yellow-500', border: 'border-yellow-500/20 dark:border-yellow-500/30', bg: 'bg-yellow-500/5', badge: 'Needs Improvement', textClass: 'text-yellow-500', ringColor: 'stroke-yellow-500' };
    return { color: 'text-red-500', border: 'border-red-500/20 dark:border-red-500/30', bg: 'bg-red-500/5', badge: 'Critical Risk', textClass: 'text-red-500', ringColor: 'stroke-red-500' };
  };

  const renderSeverityBadge = (severity) => {
    const sev = String(severity).toLowerCase();
    let label = 'Suggestion';
    let classes = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    if (sev === 'critical') {
      label = '🔴 Critical';
      classes = 'bg-red-500/10 text-red-500 border-red-500/20';
    } else if (sev === 'high') {
      label = '🟠 High';
      classes = 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    } else if (sev === 'medium') {
      label = '🟡 Medium';
      classes = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    } else if (sev === 'low') {
      label = '🟢 Low';
      classes = 'bg-green-500/10 text-green-500 border-green-500/20';
    }
    return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize tracking-wider ${classes}`}>{label}</span>;
  };

  // Filter & Sort logs
  const filteredReviews = reviews
    .filter((rev) => {
      const matchesSearch = 
        rev.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rev.reviewType && rev.reviewType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (rev.feedback?.summary && rev.feedback.summary.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLanguage = langFilter === 'all' || rev.language.toLowerCase() === langFilter.toLowerCase();
      return matchesSearch && matchesLanguage;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const uniqueLanguages = Array.from(new Set(reviews.map((r) => r.language.toLowerCase())));
  const scoreDetails = selectedReview ? getScoreDetails(selectedReview.feedback?.score) : null;
  const issuesList = selectedReview?.feedback?.issues || [];

  return (
    <div className="space-y-6 animate-fadeIn h-[calc(100vh-120px)] flex flex-col min-w-0">
      
      {/* Header Info */}
      <div className="flex-none">
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white">
          Inspections Archive
        </h1>
        <p className="text-gray-400 text-sm">
          Browse, review and compare previous code audits and refactoring metrics.
        </p>
      </div>

      {/* Primary Workspace Split View */}
      <div className="flex-1 flex overflow-hidden gap-6 items-stretch min-h-0 relative">
        
        {/* Left Side: Logs Gutter */}
        <div className={`w-full lg:w-[380px] flex-none flex flex-col bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-2xl overflow-hidden shadow-sm ${
          selectedReview && 'hidden lg:flex'
        }`}>
          
          <div className="h-12 border-b border-gray-200 dark:border-dark-800 px-4 flex items-center justify-between bg-gray-50/50 dark:bg-dark-900/50 flex-none">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center space-x-2">
              <Clock className="w-4 h-4 text-neon-indigo" />
              <span>Inspection Logs ({filteredReviews.length})</span>
            </span>
          </div>

          {/* Search/Filters */}
          <div className="p-3 border-b border-gray-150 dark:border-dark-800 bg-gray-50/20 dark:bg-dark-900/10 space-y-2 flex-none">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search language or summary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-950 border border-gray-200 dark:border-dark-850 focus:border-neon-indigo focus:ring-1 focus:ring-neon-indigo rounded-xl text-xs outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={langFilter}
                  onChange={(e) => setLangFilter(e.target.value)}
                  className="w-full py-1.5 px-2 bg-white dark:bg-dark-950 border border-gray-200 dark:border-dark-850 rounded-xl text-[11px] font-semibold outline-none text-gray-655 dark:text-gray-300"
                >
                  <option value="all">All Languages</option>
                  {uniqueLanguages.map((lang) => (
                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <ListFilter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full py-1.5 px-2 bg-white dark:bg-dark-955 border border-gray-200 dark:border-dark-850 rounded-xl text-[11px] font-semibold outline-none text-gray-655 dark:text-gray-300"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50/10 dark:bg-dark-950/20">
            {loading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="h-24 w-full bg-gray-150 dark:bg-dark-900 border border-gray-200 dark:border-dark-800 animate-pulse rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-250 dark:bg-dark-850 rounded"></div>
                    <div className="h-4 w-12 bg-gray-250 dark:bg-dark-850 rounded"></div>
                  </div>
                  <div className="h-3 w-full bg-gray-250 dark:bg-dark-850 rounded"></div>
                </div>
              ))
            ) : filteredReviews.length === 0 ? (
              
              /* EMPTY STATE */
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12 px-4">
                <div className="p-3 bg-neon-indigo/5 border border-neon-indigo/15 rounded-2xl text-neon-indigo">
                  <Clock className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">No Reviews Found</h3>
                <p className="text-xs text-gray-400 max-w-xs leading-normal">
                  {reviews.length === 0 
                    ? "Analyze your first program to build your review history." 
                    : "No historical logs match your filters and search query."}
                </p>
                {reviews.length === 0 && (
                  <Link
                    to="/review/new"
                    className="inline-flex items-center space-x-1 px-3.5 py-2 bg-gradient-to-r from-neon-indigo to-neon-cyan text-white text-xs font-bold rounded-xl shadow-md transition hover:opacity-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Run First Review</span>
                  </Link>
                )}
              </div>
            ) : (
              filteredReviews.map((rev) => {
                const cardDetails = getScoreDetails(rev.feedback?.score);
                const isSelected = selectedReview?._id === rev._id;
                return (
                  <div
                    key={rev._id}
                    onClick={() => {
                      setSelectedReview(rev);
                      setActiveTab('summary');
                    }}
                    className={`p-4 rounded-xl cursor-pointer border transition-all duration-250 flex flex-col justify-between group relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-r from-neon-indigo/10 to-neon-cyan/5 border-neon-indigo/50 shadow-inner'
                        : 'bg-white dark:bg-dark-900 border-gray-150 dark:border-dark-800/80 hover:border-neon-indigo/30 dark:hover:bg-dark-800/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold font-mono text-neon-cyan capitalize">
                        {rev.language}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold border uppercase tracking-wider ${cardDetails.border} ${cardDetails.color} ${cardDetails.bg}`}>
                        {rev.feedback?.score || 100} Grade {rev.feedback?.summaryCards?.overallGrade || 'B'}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 dark:text-gray-505 leading-relaxed line-clamp-2 truncate max-w-full mb-3">
                      {rev.feedback?.summary || 'No review summary generated.'}
                    </p>

                    <div className="flex justify-between items-center mt-auto border-t border-gray-100 dark:border-dark-805/60 pt-2.5">
                      <div className="flex items-center text-[10px] text-gray-400 space-x-1">
                        <Calendar className="w-3 h-3 text-neon-indigo" />
                        <span>{formatDate(rev.createdAt).split(',')[0]}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadCode(rev.optimizedCode, rev.language, rev.reviewType);
                          }}
                          className="p-1 rounded bg-gray-50 dark:bg-dark-950 border border-gray-200 dark:border-dark-850 hover:border-neon-indigo text-gray-400 hover:text-neon-indigo transition"
                          title="Download Optimized Code"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(rev._id, e)}
                          className="p-1 rounded bg-gray-50 dark:bg-dark-950 border border-gray-200 dark:border-dark-850 hover:border-red-500 text-gray-400 hover:text-red-500 transition"
                          title="Delete Inspection Log"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed Inspection Panel */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-2xl overflow-hidden shadow-sm min-w-0 ${
          !selectedReview && 'hidden lg:flex'
        }`}>
          {selectedReview ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              
              {/* Navigation Header Toolbar */}
              <div className="h-14 border-b border-gray-200 dark:border-dark-800 px-4 flex items-center justify-between bg-gray-50/50 dark:bg-dark-900/50 flex-none select-none overflow-x-auto">
                <div className="flex items-center space-x-3 flex-none mr-4">
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800 lg:hidden transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-gray-800 dark:text-white capitalize flex items-center space-x-1.5">
                    <span className="font-mono text-neon-cyan">{selectedReview.language}</span>
                    <span className="text-gray-400">({selectedReview.reviewType} Focus)</span>
                  </span>
                </div>

                <div className="flex items-center space-x-1 flex-none">
                  {[
                    { value: 'summary', label: 'Summary' },
                    { value: 'issues', label: 'Issues' },
                    { value: 'fixed', label: 'Fixed Code' },
                    { value: 'explanation', label: 'AI Explanation' },
                    { value: 'performance', label: 'Performance' },
                    { value: 'security', label: 'Security' }
                  ].map((subTab) => (
                    <button
                      key={subTab.value}
                      onClick={() => setActiveTab(subTab.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        activeTab === subTab.value
                          ? 'bg-neon-indigo/10 text-neon-indigo dark:text-neon-cyan font-bold border border-neon-indigo/25'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats telemetry bar */}
              <div className="border-b border-gray-150 dark:border-dark-850 p-4 bg-gray-50/10 dark:bg-dark-900/20 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 xl:grid-cols-9 gap-3 flex-none">
                {[
                  { label: 'Lines of Code', val: selectedReview.feedback?.stats?.linesOfCode || 'N/A' },
                  { label: 'Functions', val: selectedReview.feedback?.stats?.functions ?? 'N/A' },
                  { label: 'Classes', val: selectedReview.feedback?.stats?.classes ?? 'N/A' },
                  { label: 'Variables', val: selectedReview.feedback?.stats?.variables ?? 'N/A' },
                  { label: 'Errors', val: selectedReview.feedback?.stats?.errorsCount ?? 0, color: 'text-red-500 font-bold' },
                  { label: 'Warnings', val: selectedReview.feedback?.stats?.warningsCount ?? 0, color: 'text-yellow-500 font-bold' },
                  { label: 'Score', val: `${selectedReview.feedback?.score || 100}/100`, color: 'text-neon-indigo font-bold' },
                  { label: 'Complexity', val: selectedReview.feedback?.stats?.complexity || 'Low' },
                  { label: 'AI Model', val: selectedReview.feedback?.stats?.modelName?.split('-')[0] || 'Llama 3.3', color: 'text-neon-pink font-semibold' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-dark-950 border border-gray-150 dark:border-dark-850 rounded-xl p-2.5 flex flex-col justify-center min-w-0 shadow-sm">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none truncate mb-1">
                      {item.label}
                    </span>
                    <span className={`text-xs font-black truncate ${item.color || 'text-gray-800 dark:text-white'}`}>
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Dynamic scrollable sub view */}
              <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-white dark:bg-dark-900">
                
                {/* 1. Summary tab */}
                {activeTab === 'summary' && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Ring block */}
                    <div className="flex items-center space-x-6 p-5 border border-gray-150 dark:border-dark-800 rounded-2xl bg-gray-50/20 dark:bg-dark-900/30">
                      {/* Animated circular gauge */}
                      <div className="relative w-20 h-20 flex-none">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-gray-250 dark:text-dark-800"
                            strokeWidth="2.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={`transition-all duration-500 ease-out ${scoreDetails.ringColor}`}
                            strokeDasharray={`${animatedScore}, 100`}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                          <span className={`text-xl font-black ${scoreDetails.color}`}>{animatedScore}</span>
                          <span className="text-[8px] text-gray-400 dark:text-gray-505 font-bold uppercase tracking-wider mt-0.5">Quality</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 text-[9px] font-bold tracking-wider rounded-full uppercase bg-neon-indigo/10 text-neon-indigo border border-neon-indigo/20">
                            Assessment Grade {selectedReview.feedback?.summaryCards?.overallGrade || 'B'}
                          </span>
                          <span className="text-xs font-semibold text-gray-400">•</span>
                          <span className={`text-[10px] font-bold capitalize ${scoreDetails.textClass}`}>
                            {scoreDetails.badge}
                          </span>
                        </div>
                        <h3 className="text-lg font-extrabold text-gray-800 dark:text-white">Review Summary</h3>
                        <p className="text-xs text-gray-555 dark:text-gray-400 leading-relaxed">
                          {selectedReview.feedback?.summary}
                        </p>
                      </div>
                    </div>

                    {/* Analysis Mode & Compilation Telemetry Block */}
                    <div className="border border-gray-150 dark:border-dark-800 rounded-2xl p-4 bg-gray-50/10 dark:bg-dark-900/10 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-semibold">Analysis Mode:</span>
                        {selectedReview.analysisMode === 'enhanced' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                            🟢 Enhanced Analysis
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            🔵 AI Review Only
                          </span>
                        )}
                      </div>

                      {selectedReview.analysisMode === 'enhanced' ? (
                        <>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-semibold">Compiler Validator:</span>
                            <span className="font-mono font-bold dark:text-white">{selectedReview.compilerUsed || 'Linter'}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-semibold">Validation Status:</span>
                            {selectedReview.feedback?.summaryCards?.errors > 0 ? (
                              <span className="font-bold text-red-500 flex items-center space-x-1">
                                <span>❌ Failed</span>
                              </span>
                            ) : (
                              <span className="font-bold text-green-500 flex items-center space-x-1">
                                <span>✔ Passed</span>
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-xs border-t border-gray-150 dark:border-dark-850 pt-2 mt-1">
                            <span className="text-gray-400 font-semibold font-sans">Diagnostics Count:</span>
                            <span className="font-mono font-bold dark:text-white text-xs">
                              {selectedReview.feedback?.issues?.length || 0} found ({selectedReview.feedback?.summaryCards?.errors || 0} errors, {selectedReview.feedback?.summaryCards?.warnings || 0} warnings)
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400 font-semibold">Compiler Check:</span>
                            <span className="font-semibold text-gray-555 dark:text-gray-450 italic">None Performed</span>
                          </div>
                          <div className="flex justify-between items-center text-xs border-t border-gray-150 dark:border-dark-850 pt-2 mt-1">
                            <span className="text-gray-400 font-semibold font-sans">Inspector Mode:</span>
                            <span className="font-bold text-blue-500 font-sans">Static Analysis - No Compilation</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Breakdown list */}
                    {selectedReview.feedback?.breakdown && (
                      <div className="border border-gray-150 dark:border-dark-800 rounded-2xl p-4 space-y-3 bg-gray-50/[0.01]">
                        <div className="flex items-center space-x-2 border-b border-gray-155 dark:border-dark-850 pb-2 mb-1">
                          <Award className="w-4 h-4 text-neon-indigo" />
                          <span className="text-xs font-bold text-gray-850 dark:text-gray-200">Detailed Score Breakdown</span>
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: 'Syntax Accuracy', key: 'syntax' },
                            { label: 'Logic Safety', key: 'logic' },
                            { label: 'Performance Overhead', key: 'performance' },
                            { label: 'Security Vulnerability Score', key: 'security' },
                            { label: 'Maintainability Score', key: 'maintainability' },
                            { label: 'Readability Metric', key: 'readability' },
                            { label: 'Best Practices Conformity', key: 'bestPractices' },
                          ].map((breakItem, idx) => {
                            const val = selectedReview.feedback.breakdown[breakItem.key] || 100;
                            const colDetails = getScoreDetails(val);
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-[11px] font-semibold">
                                  <span className="text-gray-400">{breakItem.label}</span>
                                  <span className={colDetails.color}>{val}/100</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-dark-805 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                      val >= 90 ? 'bg-green-500' : val >= 70 ? 'bg-blue-500' : val >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${val}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Metrics grid */}
                    <div className="grid grid-cols-2 gap-4 border border-gray-150 dark:border-dark-800 rounded-xl p-4 bg-gray-50/[0.02]">
                      {[
                        { label: 'Readability', val: selectedReview.feedback?.stats?.linesOfCode > 100 ? 'Medium' : 'High' },
                        { label: 'Maintainability Index', val: selectedReview.feedback?.summaryCards?.maintainability || 'Excellent' },
                        { label: 'Cyclomatic Complexity', val: selectedReview.feedback?.stats?.complexity === 'O(1)' ? '1 (Low)' : '3 (Medium)' },
                        { label: 'Estimated Runtime', val: selectedReview.feedback?.stats?.complexity || 'O(1)' },
                        { label: 'Estimated Memory Usage', val: 'O(1) Static' },
                        { label: 'Imports Count', val: selectedReview.feedback?.stats?.importsCount ?? 0 },
                        { label: 'Comments lines', val: selectedReview.feedback?.stats?.commentsCount ?? 0 },
                      ].map((metric, i) => (
                        <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-dark-850">
                          <span className="text-gray-400 font-semibold">{metric.label}</span>
                          <span className="font-bold text-gray-800 dark:text-white">{metric.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Telemetry metadata */}
                    <div className="flex flex-col p-4 border border-gray-150 dark:border-dark-800 rounded-xl bg-gray-50/10 dark:bg-dark-900/10 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-1.5">
                          <Coins className="w-3.5 h-3.5 text-neon-cyan" />
                          <span className="text-gray-400">Tokens Consumed:</span>
                        </div>
                        <span className="font-mono font-bold dark:text-white">
                          {selectedReview.feedback?.stats?.tokensUsed?.total || 0} total <span className="text-gray-400 font-normal">({selectedReview.feedback?.stats?.tokensUsed?.prompt || 0} in, {selectedReview.feedback?.stats?.tokensUsed?.completion || 0} out)</span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-neon-pink" />
                          <span className="text-gray-400">Inference Latency:</span>
                        </div>
                        <span className="font-mono font-bold dark:text-white">
                          {selectedReview.feedback?.stats?.inferenceTime || 0.8}s <span className="text-gray-400 font-normal">(Response: {selectedReview.feedback?.stats?.reviewTime || 1.1}s)</span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-gray-400">Analysis Confidence:</span>
                        </div>
                        <span className="font-mono font-bold text-green-500">
                          {selectedReview.feedback?.confidence || 98}% Confidence
                        </span>
                      </div>
                    </div>

                    {/* Summary cards grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Errors Found', val: selectedReview.feedback?.summaryCards?.errors ?? 0, desc: 'Critical issues', color: 'border-red-500/25 bg-red-500/[0.02] text-red-500' },
                        { label: 'Warnings', val: selectedReview.feedback?.summaryCards?.warnings ?? 0, desc: 'Style / alerts', color: 'border-yellow-500/25 bg-yellow-500/[0.02] text-yellow-500' },
                        { label: 'Suggestions', val: selectedReview.feedback?.summaryCards?.suggestions ?? 0, desc: 'Improvements', color: 'border-blue-500/25 bg-blue-500/[0.02] text-blue-500' },
                        { label: 'Security Status', val: selectedReview.feedback?.summaryCards?.security || 'Secure', desc: 'Exploit audits', color: 'border-red-500/20 bg-red-500/[0.01] text-orange-500' },
                      ].map((card, i) => (
                        <div key={i} className={`border rounded-xl p-3.5 flex flex-col justify-between ${card.color}`}>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</span>
                          <div className="flex items-baseline justify-between mt-2">
                            <span className="text-lg font-black">{card.val}</span>
                            <span className="text-[9px] text-gray-400 dark:text-gray-505 font-medium">{card.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}

                {/* 2. Detected Issues tab (MENTOR STYLE) */}
                {activeTab === 'issues' && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Syntax Errors Section */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest border-b border-red-500/10 pb-1 flex items-center space-x-1.5">
                        <Bug className="w-3.5 h-3.5" />
                        <span>Syntax Errors</span>
                      </h4>
                      {issuesList.filter(i => i.type === 'syntax').length === 0 ? (
                        <p className="text-xs text-gray-400 italic pl-2">No syntax issues detected.</p>
                      ) : (
                        <div className="space-y-3">
                          {issuesList.filter(i => i.type === 'syntax').map((issue, idx) => (
                            <div key={idx} className="border border-red-500/20 bg-red-500/[0.02] p-4 rounded-xl space-y-3">
                              <div className="flex justify-between items-start">
                                <h5 className="text-xs font-bold text-red-400">❌ {issue.title}</h5>
                                {renderSeverityBadge(issue.severity)}
                              </div>
                              
                              <div className="space-y-2 text-xs text-gray-550 dark:text-gray-300">
                                <div><strong className="text-red-400">💡 Why it happened: </strong> {issue.message}</div>
                                <div><strong className="text-red-400">⚠️ Why it matters: </strong> The compiler will fail to parse this code structure, causing immediate program failure.</div>
                                <div className="flex items-center text-[10px] text-gray-400 font-mono space-x-3 bg-red-500/[0.05] p-2 rounded-lg">
                                  <span>Line: {issue.lineNumber}</span>
                                  <span>Col: {issue.column || 1}</span>
                                </div>
                              </div>

                              {issue.suggestedFix && (
                                <div className="mt-2 space-y-1">
                                  <span className="text-[10px] font-bold text-gray-400">🔧 How to fix it:</span>
                                  <pre className="text-[11px] font-mono bg-dark-950 p-2.5 rounded-lg text-green-400 overflow-x-auto max-w-full">
                                    {issue.suggestedFix}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Logical Issues Section */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-orange-500 uppercase tracking-widest border-b border-orange-500/10 pb-1 flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Logical Issues</span>
                      </h4>
                      {issuesList.filter(i => i.type === 'logical').length === 0 ? (
                        <p className="text-xs text-gray-400 italic pl-2">No logical errors found.</p>
                      ) : (
                        <div className="space-y-3">
                          {issuesList.filter(i => i.type === 'logical').map((issue, idx) => (
                            <div key={idx} className="border border-orange-500/20 bg-orange-500/[0.02] p-4 rounded-xl space-y-3">
                              <div className="flex justify-between items-start">
                                <h5 className="text-xs font-bold text-orange-400">{issue.title}</h5>
                                {renderSeverityBadge(issue.severity)}
                              </div>

                              <div className="space-y-2 text-xs text-gray-550 dark:text-gray-300">
                                <div><strong className="text-orange-450 dark:text-orange-400">💡 Why it happened: </strong> {issue.message}</div>
                                {issue.impact && (
                                  <div><strong className="text-orange-450 dark:text-orange-400">⚠️ Why it matters: </strong> {issue.impact}</div>
                                )}
                              </div>

                              {issue.suggestedFix && (
                                <div className="mt-2 space-y-1">
                                  <span className="text-[10px] font-bold text-gray-400">🔧 How to fix it:</span>
                                  <pre className="text-[11px] font-mono bg-dark-950 p-2.5 rounded-lg text-green-400 overflow-x-auto max-w-full">
                                    {issue.suggestedFix}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Type Safety Section */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest border-b border-yellow-500/10 pb-1 flex items-center space-x-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Type Safety Errors</span>
                      </h4>
                      {issuesList.filter(i => i.type === 'type').length === 0 ? (
                        <p className="text-xs text-gray-400 italic pl-2">No type safety concerns.</p>
                      ) : (
                        <div className="space-y-3">
                          {issuesList.filter(i => i.type === 'type').map((issue, idx) => (
                            <div key={idx} className="border border-yellow-500/20 bg-yellow-500/[0.02] p-4 rounded-xl space-y-3">
                              <div className="flex justify-between items-start">
                                <h5 className="text-xs font-bold text-yellow-500">{issue.title}</h5>
                                {renderSeverityBadge(issue.severity)}
                              </div>

                              <div className="space-y-2 text-xs text-gray-550 dark:text-gray-300">
                                <div><strong className="text-yellow-450 dark:text-yellow-400 font-bold">💡 Why it happened: </strong> {issue.message}</div>
                                <div><strong className="text-yellow-450 dark:text-yellow-400 font-bold">⚠️ Why it matters: </strong> Unsupported additions on mismatched operands yield type errors or execution exceptions.</div>
                              </div>

                              {issue.suggestedFix && (
                                <div className="mt-2 space-y-1">
                                  <span className="text-[10px] font-bold text-gray-400">🔧 How to fix it:</span>
                                  <pre className="text-[11px] font-mono bg-dark-950 p-2.5 rounded-lg text-green-400 overflow-x-auto max-w-full">
                                    {issue.suggestedFix}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Best Practices Section */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-green-500 uppercase tracking-widest border-b border-green-500/10 pb-1 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Best Practices & DRY</span>
                      </h4>
                      {issuesList.filter(i => i.type === 'best-practice').length === 0 ? (
                        <p className="text-xs text-gray-400 italic pl-2">No style recommendations.</p>
                      ) : (
                        <div className="space-y-3">
                          {issuesList.filter(i => i.type === 'best-practice').map((issue, idx) => (
                            <div key={idx} className="border border-green-500/20 bg-green-500/[0.02] p-4 rounded-xl space-y-3">
                              <div className="flex justify-between items-start">
                                <h5 className="text-xs font-bold text-green-500">{issue.title}</h5>
                                {renderSeverityBadge(issue.severity)}
                              </div>

                              <div className="space-y-2 text-xs text-gray-550 dark:text-gray-300">
                                <div><strong className="text-green-500">💡 Why it happened: </strong> {issue.message}</div>
                                <div><strong className="text-green-500">⚠️ Why it matters: </strong> Code style guidelines keep coding patterns uniform and readable.</div>
                              </div>

                              {issue.suggestedFix && (
                                <div className="mt-2 space-y-1">
                                  <span className="text-[10px] font-bold text-gray-400">🔧 How to fix it:</span>
                                  <pre className="text-[11px] font-mono bg-dark-950 p-2.5 rounded-lg text-green-400 overflow-x-auto max-w-full">
                                    {issue.suggestedFix}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* 3. Code comparison tab */}
                {activeTab === 'fixed' && (
                  <div className="h-full flex flex-col space-y-4 animate-fadeIn min-h-[380px]">
                    <div className="flex-none flex items-center justify-between">
                      <button
                        onClick={() => setDiffView(!diffView)}
                        className="px-3 py-1 bg-neon-indigo/10 text-neon-indigo border border-neon-indigo/20 hover:bg-neon-indigo/20 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                      >
                        {diffView ? <Eye className="w-3.5 h-3.5" /> : <Split className="w-3.5 h-3.5" />}
                        <span>{diffView ? 'Switch to Normal' : 'Compare View (Diff)'}</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleCopyFixed}
                          className="text-xs font-bold text-gray-500 hover:text-neon-indigo flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-dark-850 p-1.5 rounded-lg transition"
                        >
                          {copied ? <Check className="text-green-500 w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                        
                        <button
                          onClick={() => handleDownloadCode(selectedReview.optimizedCode, selectedReview.language, selectedReview.reviewType)}
                          className="text-xs font-bold text-gray-500 hover:text-neon-indigo flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-dark-850 p-1.5 rounded-lg transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 border border-gray-150 dark:border-dark-800 rounded-xl overflow-hidden bg-gray-50 dark:bg-dark-950 p-2 min-h-[480px]">
                      {diffView ? (
                        <DiffEditor
                          height="480px"
                          original={selectedReview.originalCode}
                          modified={selectedReview.optimizedCode}
                          language={selectedReview.language}
                          theme={isDark ? 'vs-dark' : 'light'}
                          options={{
                            readOnly: true,
                            originalEditable: false,
                            fontSize: 13,
                            fontFamily: 'Fira Code, monospace',
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            renderSideBySide: true,
                          }}
                        />
                      ) : (
                        <Editor
                          height="480px"
                          language={selectedReview.language}
                          theme={isDark ? 'vs-dark' : 'light'}
                          value={selectedReview.optimizedCode}
                          options={{
                            readOnly: true,
                            fontSize: 13,
                            fontFamily: 'Fira Code, monospace',
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* 4. AI Explanation tab */}
                {activeTab === 'explanation' && (
                  <div className="space-y-4 animate-fadeIn border border-gray-150 dark:border-dark-800 p-5 rounded-2xl bg-gray-50/20 dark:bg-dark-900/30 min-h-[300px]">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center space-x-1.5 border-b border-gray-200 dark:border-dark-800 pb-2">
                      <BookOpen className="text-neon-indigo w-4 h-4" />
                      <span>Analysis Deep Dive</span>
                    </h4>
                    <SimpleMarkdown text={selectedReview.feedback?.aiExplanation} />
                  </div>
                )}

                {/* 5. Performance optimizations tab */}
                {activeTab === 'performance' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-dark-800 pb-2">
                      <Cpu className="text-neon-cyan w-4 h-4" />
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white">Performance metrics</h4>
                    </div>

                    <div className="space-y-3">
                      {issuesList.filter(i => i.type === 'performance').length === 0 ? (
                        <div className="border border-green-500/10 bg-green-500/[0.02] p-4 rounded-xl text-xs text-green-400">
                          No obvious runtime execution bottlenecks identified.
                        </div>
                      ) : (
                        issuesList.filter(i => i.type === 'performance').map((issue, idx) => (
                          <div key={idx} className="border border-neon-cyan/20 bg-neon-cyan/[0.02] p-4 rounded-xl space-y-3 hover:border-neon-cyan/40 transition">
                            <div className="flex justify-between items-start">
                              <h5 className="text-xs font-bold text-neon-cyan">{issue.title}</h5>
                              {renderSeverityBadge(issue.severity)}
                            </div>

                            <div className="space-y-2 text-xs text-gray-550 dark:text-gray-300">
                              <div><strong className="text-neon-cyan font-bold">💡 Why it happened: </strong> {issue.message}</div>
                              <div><strong className="text-neon-cyan font-bold">⚠️ Why it matters: </strong> Suboptimal processing loops or unnecessary recursions increase CPU cycles.</div>
                            </div>

                            {issue.suggestedFix && (
                              <div className="mt-2 space-y-1">
                                <span className="text-[10px] font-bold text-gray-400">Refactoring:</span>
                                <pre className="text-[11px] font-mono bg-dark-950 p-2.5 rounded-lg text-green-400 overflow-x-auto max-w-full">
                                  {issue.suggestedFix}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Security tab */}
                {activeTab === 'security' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-dark-800 pb-2">
                      <ShieldAlert className="text-red-500 w-4 h-4" />
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white">Security Vulnerabilities sweep</h4>
                    </div>

                    <div className="space-y-3">
                      {issuesList.filter(i => i.type === 'security').length === 0 ? (
                        <div className="border border-green-500/10 bg-green-500/[0.02] p-4 rounded-xl text-xs text-green-400">
                          No obvious security flaws or vulnerabilities detected.
                        </div>
                      ) : (
                        issuesList.filter(i => i.type === 'security').map((issue, idx) => (
                          <div key={idx} className="border border-red-500/20 bg-red-500/[0.02] p-4 rounded-xl space-y-3 hover:border-red-500/40 transition">
                            <div className="flex justify-between items-start">
                              <h5 className="text-xs font-bold text-red-400">{issue.title}</h5>
                              {renderSeverityBadge(issue.severity)}
                            </div>

                            <div className="space-y-2 text-xs text-gray-550 dark:text-gray-300">
                              <div><strong className="text-red-400 font-bold">💡 Why it happened: </strong> {issue.message}</div>
                              <div><strong className="text-red-400 font-bold">⚠️ Why it matters: </strong> Exposes stack buffers or query parameters to external malicious manipulation.</div>
                            </div>

                            {issue.suggestedFix && (
                              <div className="mt-2 space-y-1">
                                <span className="text-[10px] font-bold text-gray-400">Remediation:</span>
                                <pre className="text-[11px] font-mono bg-dark-950 p-2.5 rounded-lg text-green-400 overflow-x-auto max-w-full">
                                  {issue.suggestedFix}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            
            /* Selection Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 animate-fadeIn bg-gray-50/10 dark:bg-dark-900/10">
              <div className="p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl text-neon-cyan animate-pulse">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Select an Inspection Log</h3>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                Choose a historical review from the archive list on the left to inspect details, scores, and refactored outputs.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default History;
