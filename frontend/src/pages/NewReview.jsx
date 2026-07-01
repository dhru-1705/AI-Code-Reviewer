import React, { useState, useEffect, useRef } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTheme } from '../context/theme.context';
import { 
  Sparkles, 
  Copy, 
  Download, 
  Maximize2, 
  Minimize2, 
  Check, 
  AlertTriangle, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  FileCode2, 
  Info, 
  Clock, 
  Split, 
  Eye, 
  BookOpen, 
  Bug,
  HelpCircle,
  AlertCircle,
  Coins,
  ShieldCheck,
  Award,
  ListCollapse
} from 'lucide-react';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'go', label: 'Go' },
];

const REVIEW_TYPES = [
  { value: 'general', label: 'General Review' },
  { value: 'security', label: 'Security Audit' },
  { value: 'performance', label: 'Performance Optimization' },
  { value: 'best-practices', label: 'Best Practices & DRY' },
];

const PIPELINE_STEPS = [
  "Parsing Source Code",
  "Detecting Syntax Errors",
  "Finding Type Errors",
  "Checking Security Risks",
  "Optimizing Performance",
  "Generating Inspection Report"
];

// Heuristic Language Detector
const detectLanguage = (text) => {
  if (!text || text.trim() === '') return null;
  const clean = text.trim();
  
  if (clean.includes('import java.') || clean.includes('public class ') || clean.includes('System.out.print')) {
    return 'java';
  }
  if (clean.includes('#include') || clean.includes('std::cout') || (clean.includes('int main()') && clean.includes('<<'))) {
    return 'cpp';
  }
  if (clean.includes('package main') && clean.includes('func main()')) {
    return 'go';
  }
  if (clean.includes('def ') || clean.includes('import ') && clean.includes('elif ') || clean.includes('print(') || clean.includes('if __name__ ==')) {
    return 'python';
  }
  if (clean.includes('<!DOCTYPE html>') || clean.includes('<html>') || (clean.includes('</div>') && clean.includes('<body'))) {
    return 'html';
  }
  if (clean.includes('const ') || clean.includes('let ') || clean.includes('var ') || clean.includes('function ') || clean.includes('console.log(') || clean.includes('=>')) {
    if (clean.includes('interface ') || clean.includes('type ') && (clean.includes(': string') || clean.includes(': number') || clean.includes(': any'))) {
      return 'typescript';
    }
    return 'javascript';
  }
  if (clean.includes('{') && clean.includes('margin:') && clean.includes('padding:')) {
    return 'css';
  }
  return null;
};

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

const NewReview = () => {
  const { isDark } = useTheme();
  const [code, setCode] = useState('// Paste your code here to begin evaluation...\n\nfunction calculateFactorial(num) {\n  if (num === 0) return 1;\n  return num * calculateFactorial(num - 1);\n}');
  const [language, setLanguage] = useState('javascript');
  const [reviewType, setReviewType] = useState('general');
  
  // Realism States
  const [submitting, setSubmitting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [showLangWarning, setShowLangWarning] = useState(false);

  // Monaco and full screen
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Status Bar telemetry
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const [charCount, setCharCount] = useState(code.length);
  const [lineCount, setLineCount] = useState(code.split('\n').length);

  // Results & Tabs state
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); 
  const [diffView, setDiffView] = useState(false); 
  const [recentReviews, setRecentReviews] = useState([]);

  // Scoring Animations
  const [animatedScore, setAnimatedScore] = useState(0);

  // Copy/Download UI animations state
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedFixed, setCopiedFixed] = useState(false);

  // Heuristic scan on editor change
  useEffect(() => {
    const det = detectLanguage(code);
    setDetectedLanguage(det);
    if (det && det !== language) {
      setShowLangWarning(true);
    } else {
      setShowLangWarning(false);
    }
  }, [code, language]);

  // Fetch recent reviews on mount for history tab
  useEffect(() => {
    fetchRecentReviews();
  }, []);

  const fetchRecentReviews = async () => {
    try {
      const res = await api.get('/review/history');
      if (res.data.success) {
        setRecentReviews(res.data.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load logs', err);
    }
  };

  // Pipeline loader logic
  useEffect(() => {
    let loaderInterval;
    if (submitting) {
      setPipelineStep(0);
      loaderInterval = setInterval(() => {
        setPipelineStep((prev) => {
          if (prev < PIPELINE_STEPS.length - 1) return prev + 1;
          return prev;
        });
      }, 1000);
    }
    return () => clearInterval(loaderInterval);
  }, [submitting]);

  // Score Ring Animation
  useEffect(() => {
    if (result && result.feedback?.score !== undefined) {
      setAnimatedScore(0);
      const target = result.feedback.score;
      if (target === 0) return;
      
      const duration = 800; // total duration
      const steps = Math.max(1, target);
      const stepTime = Math.round(duration / steps);
      let count = 0;
      
      const scoreTimer = setInterval(() => {
        count++;
        setAnimatedScore(count);
        if (count >= target) {
          clearInterval(scoreTimer);
        }
      }, stepTime || 10);
      
      return () => clearInterval(scoreTimer);
    }
  }, [result]);

  const handleSubmit = async () => {
    if (!code || code.trim() === '' || code.startsWith('// Paste your code here')) {
      toast.warning('Please input a valid code block to evaluate.');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res = await api.post('/review', {
        originalCode: code,
        language,
        reviewType,
      });

      if (res.data.success) {
        const payload = res.data.data;
        setResult(payload);
        setActiveTab('summary');
        toast.success('AI Review analysis completed successfully!');
        
        // Trigger Monaco diagnostic markers
        setTimeout(() => {
          if (editorRef.current && monacoRef.current && payload.feedback?.issues) {
            applyEditorMarkers(editorRef.current, monacoRef.current, payload.feedback.issues);
          }
        }, 300);

        fetchRecentReviews();
      } else {
        toast.error(res.data.error || 'Failed to review code');
      }
    } catch (error) {
      console.error('[Code Review Request Error]', error);
      toast.error(error.response?.data?.error || 'Server error occurred during code analysis.');
    } finally {
      setSubmitting(false);
    }
  };

  const applyEditorMarkers = (editor, monaco, issuesList) => {
    if (!editor || !monaco || !issuesList) return;
    const model = editor.getModel();
    if (!model) return;

    const markers = issuesList.map(issue => {
      let monacoSeverity = monaco.MarkerSeverity.Info;
      if (['critical', 'high'].includes(issue.severity)) {
        monacoSeverity = monaco.MarkerSeverity.Error;
      } else if (['medium', 'low'].includes(issue.severity)) {
        monacoSeverity = monaco.MarkerSeverity.Warning;
      }

      const lineContent = model.getLineContent(issue.lineNumber || 1);
      const endCol = lineContent ? (lineContent.length + 1) : 100;

      return {
        startLineNumber: issue.lineNumber || 1,
        startColumn: issue.column || 1,
        endLineNumber: issue.lineNumber || 1,
        endColumn: endCol,
        message: `[${issue.type.toUpperCase()}] ${issue.title}\nSeverity: ${issue.severity.toUpperCase()}\n\nDescription: ${issue.message}\nSuggested Fix: ${issue.suggestedFix}`,
        severity: monacoSeverity,
        source: 'AI Code Reviewer'
      };
    });

    monaco.editor.setModelMarkers(model, 'ai-reviewer', markers);

    // Apply gutter line highlighting
    const lineDecorations = issuesList.map(issue => {
      const isError = ['critical', 'high'].includes(issue.severity);
      const isWarning = ['medium', 'low'].includes(issue.severity);
      let lineClass = 'bg-blue-500/5';
      let gutterClass = 'border-l-2 border-blue-500';
      if (isError) {
        lineClass = 'bg-red-500/10 dark:bg-red-500/5 border-l-4 border-red-500';
        gutterClass = 'monaco-error-gutter';
      } else if (isWarning) {
        lineClass = 'bg-yellow-500/10 dark:bg-yellow-500/5 border-l-4 border-yellow-500';
        gutterClass = 'monaco-warning-gutter';
      }

      return {
        range: new monaco.Range(issue.lineNumber || 1, 1, issue.lineNumber || 1, 1),
        options: {
          isWholeLine: true,
          className: lineClass,
          linesDecorationsClassName: gutterClass
        }
      };
    });

    if (decorationsRef.current) {
      editor.deltaDecorations(decorationsRef.current, []);
    }
    decorationsRef.current = editor.deltaDecorations([], lineDecorations);
  };

  // Interactive issue clicking logic (Centers, focuses and flashes the line in Monaco)
  const handleIssueClick = (lineNumber) => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    editor.revealLineInCenter(lineNumber);
    editor.setPosition({ lineNumber, column: 1 });
    editor.focus();

    // Pulse/Flash the line briefly
    const flashDecoration = editor.deltaDecorations([], [{
      range: new monaco.Range(lineNumber, 1, lineNumber, 1),
      options: {
        isWholeLine: true,
        className: 'bg-neon-indigo/30 dark:bg-neon-indigo/20 border-y border-neon-indigo/40 animate-pulse'
      }
    }]);

    setTimeout(() => {
      editor.deltaDecorations(flashDecoration, []);
    }, 1500);

    // Switch right panel to Issues
    setActiveTab('issues');
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, column: e.position.column });
    });

    editor.onDidChangeModelContent(() => {
      const val = editor.getValue();
      setCharCount(val.length);
      setLineCount(val.split('\n').length);
    });
  };

  const handleEditorChange = (val) => {
    setCode(val || '');
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelMarkers(model, 'ai-reviewer', []);
      }
      if (decorationsRef.current) {
        editorRef.current.deltaDecorations(decorationsRef.current, []);
        decorationsRef.current = [];
      }
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedInput(true);
    toast.success('Input source code copied!');
    setTimeout(() => setCopiedInput(false), 2000);
  };

  const handleCopyFixed = () => {
    if (!result?.optimizedCode) return;
    navigator.clipboard.writeText(result.optimizedCode);
    setCopiedFixed(true);
    toast.success('Optimized code copied!');
    setTimeout(() => setCopiedFixed(false), 2000);
  };

  const handleAutoFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
      toast.success('Source code formatted!');
    }
  };

  const handleDownloadCode = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Code downloaded successfully!');
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

  const scoreDetails = result ? getScoreDetails(result.feedback?.score) : null;
  const issuesList = result?.feedback?.issues || [];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Language Warning Banner */}
      {showLangWarning && detectedLanguage && (
        <div className="bg-yellow-500/10 border border-yellow-500/25 p-3 rounded-2xl flex items-center justify-between text-xs text-yellow-600 dark:text-yellow-455 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />
            <span>
              The code looks like <strong>{detectedLanguage.toUpperCase()}</strong>, but <strong>{language.toUpperCase()}</strong> is selected.
            </span>
          </div>
          <button
            onClick={() => setLanguage(detectedLanguage)}
            className="px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/30 rounded-xl font-bold cursor-pointer transition text-[11px]"
          >
            Switch to {detectedLanguage.toUpperCase()}
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white flex items-center space-x-2">
            <span>AI Code Inspector</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Evaluate code syntax, logic loops, vulnerabilities and export optimized variants.
          </p>
        </div>

        {/* Configurations Selection */}
        <div className="flex flex-wrap items-center gap-3">
          {['javascript', 'typescript', 'python', 'html', 'css'].includes(language.toLowerCase()) ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-xs font-bold transition">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span>🟢 Enhanced Analysis</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl text-xs font-bold transition">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span>🔵 AI Review Only</span>
            </span>
          )}

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3.5 py-2 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 focus:border-neon-indigo focus:ring-1 focus:ring-neon-indigo rounded-xl text-sm font-semibold outline-none transition"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          <select
            value={reviewType}
            onChange={(e) => setReviewType(e.target.value)}
            className="px-3.5 py-2 bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 focus:border-neon-indigo focus:ring-1 focus:ring-neon-indigo rounded-xl text-sm font-semibold outline-none transition"
          >
            {REVIEW_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-neon-indigo to-neon-cyan text-white font-bold rounded-xl hover:opacity-95 active:scale-95 disabled:opacity-50 disabled:scale-100 transition shadow-md shadow-neon-indigo/10 cursor-pointer text-sm"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{submitting ? 'Inspecting...' : '✨ Analyze with AI'}</span>
          </button>
        </div>
      </div>

      {/* Code statistics telemetry panel (above editor grids) */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3 animate-fadeIn">
          {[
            { label: 'Language', val: result.language || language, color: 'text-neon-cyan' },
            { label: 'Lines of Code', val: result.feedback?.stats?.linesOfCode || lineCount },
            { label: 'Functions', val: result.feedback?.stats?.functions ?? 'N/A' },
            { label: 'Classes', val: result.feedback?.stats?.classes ?? 'N/A' },
            { label: 'Variables', val: result.feedback?.stats?.variables ?? 'N/A' },
            { label: 'Errors', val: result.feedback?.stats?.errorsCount ?? 0, color: 'text-red-500 font-bold' },
            { label: 'Warnings', val: result.feedback?.stats?.warningsCount ?? 0, color: 'text-yellow-500 font-bold' },
            { label: 'AI Score', val: `${result.feedback?.score || 100}/100`, color: 'text-neon-indigo font-bold' },
            { label: 'Complexity', val: result.feedback?.stats?.complexity || 'Low' },
            { label: 'Review Time', val: `${result.feedback?.stats?.reviewTime || 1.1}s` },
            { label: 'Model', val: result.feedback?.stats?.modelName?.split('-')[0] || 'Llama 3.3', color: 'text-neon-pink font-semibold' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-dark-900 border border-gray-150 dark:border-dark-800/80 rounded-xl p-3 flex flex-col justify-center min-w-0 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-505 uppercase tracking-widest leading-none truncate mb-1">
                {item.label}
              </span>
              <span className={`text-sm font-extrabold truncate ${item.color || 'text-gray-800 dark:text-white'}`}>
                {item.val}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid Workspace Panels */}
      <div className={`grid grid-cols-1 ${isFullscreen ? '' : 'xl:grid-cols-2'} gap-6 items-stretch`}>
        
        {/* Editor (Input) Card - RESTORED PREVIOUS PREMIUM CLEAN STYLING */}
        <div className={`bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-2xl overflow-hidden flex flex-col shadow-sm transition-all duration-300 ${
          isFullscreen ? 'fixed inset-4 z-50 p-4 border-2 border-neon-indigo/50 bg-white/95 dark:bg-dark-900/95 backdrop-blur-lg shadow-2xl' : 'h-full'
        }`}>
          {/* Header toolbar */}
          <div className="h-12 border-b border-gray-200 dark:border-dark-800 bg-gray-50/50 dark:bg-dark-900/50 px-4 flex items-center justify-between flex-none">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center space-x-2">
              <FileCode2 className="text-neon-indigo w-4 h-4" />
              <span>Input Editor ({language})</span>
            </span>

            {/* Monaco Action Panel Buttons - Minimal Layout */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleAutoFormat}
                className="px-2.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-400 hover:text-neon-indigo transition text-[11px] font-semibold"
                title="Format Document"
              >
                Format
              </button>
              <button 
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-400 hover:text-neon-indigo transition"
                title="Copy Source"
              >
                {copiedInput ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => handleDownloadCode(code, `code_input.${language === 'python' ? 'py' : language === 'go' ? 'go' : 'js'}`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-400 hover:text-neon-indigo transition"
                title="Download Source"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-400 hover:text-neon-indigo transition border-l border-gray-200 dark:border-dark-800 pl-2 ml-1"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-neon-pink" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Monaco Editor Container - Larger Area */}
          <div className="flex-1 p-2 bg-gray-50 dark:bg-dark-950/80">
            <Editor
              height={isFullscreen ? "calc(100vh - 240px)" : "550px"}
              language={language}
              theme={isDark ? 'vs-dark' : 'light'}
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 14,
                fontFamily: 'Fira Code, monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                roundedSelection: true,
                padding: { top: 12 },
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>

          {/* PROBLEMS PANEL (VS Code Style, below editor, clean borders) */}
          <div className="border-t border-gray-200 dark:border-dark-800 flex flex-col bg-gray-50/20 dark:bg-dark-950/40 h-40 overflow-hidden flex-none font-sans">
            <div className="h-8 border-b border-gray-150 dark:border-dark-800/80 px-4 bg-gray-50/50 dark:bg-dark-900/40 flex items-center justify-between text-xs font-semibold text-gray-450 flex-none select-none">
              <div className="flex items-center space-x-2">
                <ListCollapse className="w-3.5 h-3.5 text-neon-indigo" />
                <span>Problems ({issuesList.length})</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1 font-mono text-[11px] text-gray-500 dark:text-gray-400">
              {issuesList.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 italic text-[11px]">
                  No diagnostics parsed in current workspace.
                </div>
              ) : (
                issuesList.map((issue, idx) => {
                  const isError = ['critical', 'high'].includes(issue.severity);
                  const markerSymbol = isError ? '🔴' : issue.severity === 'medium' ? '🟠' : issue.severity === 'low' ? '🟡' : '🔵';
                  return (
                    <div 
                      key={idx}
                      onClick={() => handleIssueClick(issue.lineNumber)}
                      className="flex items-start space-x-2 p-1.5 rounded-lg hover:bg-gray-150/55 dark:hover:bg-dark-800/40 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-dark-800 transition"
                    >
                      <span className="flex-none">{markerSymbol}</span>
                      <span className="text-neon-cyan font-bold flex-none min-w-[70px]">Line {issue.lineNumber}:</span>
                      <span className="font-sans text-gray-750 dark:text-gray-300 font-semibold">{issue.title}</span>
                      <span className="text-[10px] text-gray-400 ml-auto font-mono truncate max-w-[200px]">({issue.type})</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Status Bar Telemetry */}
          <div className="h-8 border-t border-gray-200 dark:border-dark-800 bg-gray-50/50 dark:bg-dark-900/50 px-4 flex items-center justify-between text-[11px] font-mono text-gray-400 flex-none">
            <div className="flex items-center space-x-4">
              <span>Ln {cursorPos.line}, Col {cursorPos.column}</span>
              <span>Length: {charCount} chars</span>
            </div>
            <span>Lines: {lineCount}</span>
          </div>
        </div>

        {/* Results Panel Card */}
        {!isFullscreen && (
          <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-800 rounded-2xl overflow-hidden flex flex-col shadow-sm">
            
            {/* Tabs Navigation Bar */}
            <div className="h-12 border-b border-gray-200 dark:border-dark-800 bg-gray-50/50 dark:bg-dark-900/50 flex items-center justify-between px-3 overflow-x-auto select-none">
              <div className="flex space-x-1 min-w-max">
                {[
                  { value: 'summary', label: 'Summary' },
                  { value: 'issues', label: 'Detected Issues' },
                  { value: 'fixed', label: 'Fixed Code' },
                  { value: 'explanation', label: 'AI Explanation' },
                  { value: 'performance', label: 'Performance' },
                  { value: 'security', label: 'Security' },
                  { value: 'history', label: 'History' }
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    disabled={!result && tab.value !== 'history'}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center space-x-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                      activeTab === tab.value
                        ? 'bg-neon-indigo/10 text-neon-indigo dark:text-neon-cyan border border-neon-indigo/20 font-bold'
                        : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-150/40 dark:hover:bg-dark-800/40'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Results Content View */}
            <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-dark-900 min-h-[500px] max-h-[690px]">
              
              {/* Ready to Inspect State */}
              {!result && !submitting && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20 animate-fadeIn">
                  <div className="p-4 bg-neon-indigo/5 border border-neon-indigo/25 rounded-2xl text-neon-indigo">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Ready to Inspect</h3>
                  <p className="text-sm text-gray-400 max-w-xs mx-auto">
                    Type your source code in the editor, choose your language & focus, then click **Analyze with AI** to generate metrics.
                  </p>
                </div>
              )}

              {/* Sequential AI Pipeline Loader */}
              {submitting && (
                <div className="h-full flex flex-col items-center justify-center py-10 animate-fadeIn space-y-8">
                  <div className="relative flex items-center justify-center w-16 h-16 flex-none">
                    <div className="absolute inset-0 border-4 border-neon-indigo/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-neon-indigo border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  
                  <div className="space-y-4 w-full max-w-sm">
                    <h3 className="text-center font-extrabold text-gray-800 dark:text-white text-md">AI Pipeline Analysis</h3>
                    <div className="border border-gray-150 dark:border-dark-800 bg-gray-50/15 dark:bg-dark-950/40 p-5 rounded-2xl space-y-3 text-xs font-semibold">
                      {PIPELINE_STEPS.map((step, idx) => {
                        const isDone = idx < pipelineStep;
                        const isCurrent = idx === pipelineStep;
                        return (
                          <div key={idx} className="flex items-center space-x-3 transition-opacity">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-none" />
                            ) : isCurrent ? (
                              <div className="w-4 h-4 border-2 border-neon-indigo border-t-transparent rounded-full animate-spin flex-none"></div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-dark-800 flex-none"></div>
                            )}
                            <span className={isDone ? 'text-gray-400 dark:text-gray-505 font-medium line-through' : isCurrent ? 'text-neon-indigo dark:text-neon-cyan font-bold' : 'text-gray-400 dark:text-gray-600'}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Result View Blocks */}
              {result && !submitting && (
                <div className="h-full">
                  
                  {/* Tab 1: Summary Panel */}
                  {activeTab === 'summary' && (
                    <div className="space-y-6 animate-fadeIn">
                      
                      {/* Dynamic grading ring header */}
                      <div className="flex items-center space-x-6 p-5 border border-gray-155 dark:border-dark-800 rounded-2xl bg-gray-50/20 dark:bg-dark-900/30">
                        {/* Animated circular score gauge */}
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
                            <span className="text-[8px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">Quality</span>
                          </div>
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 text-[9px] font-bold tracking-wider rounded-full uppercase bg-neon-indigo/10 text-neon-indigo border border-neon-indigo/20">
                              Assessment Grade {result.feedback?.summaryCards?.overallGrade || 'B'}
                            </span>
                            <span className="text-xs font-semibold text-gray-405">•</span>
                            <span className={`text-[10px] font-bold capitalize ${scoreDetails.textClass}`}>
                              {scoreDetails.badge}
                            </span>
                          </div>
                          <h3 className="text-lg font-extrabold text-gray-800 dark:text-white">Review Summary</h3>
                          <p className="text-xs text-gray-555 dark:text-gray-400 leading-relaxed">
                            {result.feedback?.summary}
                          </p>
                        </div>
                      </div>

                      {/* Analysis Mode & Compilation Telemetry Block */}
                      <div className="border border-gray-150 dark:border-dark-800 rounded-2xl p-4 bg-gray-50/10 dark:bg-dark-900/10 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-semibold">Analysis Mode:</span>
                          {result.analysisMode === 'enhanced' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                              🟢 Enhanced Analysis
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              🔵 AI Review Only
                            </span>
                          )}
                        </div>

                        {result.analysisMode === 'enhanced' ? (
                          <>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400 font-semibold">Compiler Validator:</span>
                              <span className="font-mono font-bold dark:text-white">{result.compilerUsed || 'Linter'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400 font-semibold">Validation Status:</span>
                              {result.feedback?.summaryCards?.errors > 0 ? (
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
                                {result.feedback?.issues?.length || 0} found ({result.feedback?.summaryCards?.errors || 0} errors, {result.feedback?.summaryCards?.warnings || 0} warnings)
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-400 font-semibold">Compiler Check:</span>
                              <span className="font-semibold text-gray-550 dark:text-gray-450 italic">None Performed</span>
                            </div>
                            <div className="flex justify-between items-center text-xs border-t border-gray-150 dark:border-dark-850 pt-2 mt-1">
                              <span className="text-gray-400 font-semibold font-sans">Inspector Mode:</span>
                              <span className="font-bold text-blue-500 font-sans">Static Analysis - No Compilation</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Score breakdown metrics list */}
                      {result.feedback?.breakdown && (
                        <div className="border border-gray-150 dark:border-dark-800 rounded-2xl p-4 space-y-3 bg-gray-50/[0.01]">
                          <div className="flex items-center space-x-2 border-b border-gray-150 dark:border-dark-850 pb-2 mb-1">
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
                              const val = result.feedback.breakdown[breakItem.key] || 100;
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

                      {/* Code Quality Metrics */}
                      <div className="grid grid-cols-2 gap-4 border border-gray-150 dark:border-dark-800 rounded-xl p-4 bg-gray-50/[0.02]">
                        {[
                          { label: 'Readability', val: result.feedback?.stats?.linesOfCode > 100 ? 'Medium' : 'High' },
                          { label: 'Maintainability Index', val: result.feedback?.summaryCards?.maintainability || 'Excellent' },
                          { label: 'Cyclomatic Complexity', val: result.feedback?.stats?.complexity === 'O(1)' ? '1 (Low)' : '3 (Medium)' },
                          { label: 'Estimated Runtime', val: result.feedback?.stats?.complexity || 'O(1)' },
                          { label: 'Estimated Memory', val: 'O(1) Static' },
                          { label: 'Imports Count', val: result.feedback?.stats?.importsCount ?? 0 },
                          { label: 'Comments lines', val: result.feedback?.stats?.commentsCount ?? 0 },
                        ].map((metric, i) => (
                          <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-dark-850">
                            <span className="text-gray-400 font-semibold">{metric.label}</span>
                            <span className="font-bold text-gray-800 dark:text-white">{metric.val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Real Token Telemetry */}
                      <div className="flex flex-col p-4 border border-gray-150 dark:border-dark-800 rounded-xl bg-gray-50/10 dark:bg-dark-900/10 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-1.5">
                            <Coins className="w-3.5 h-3.5 text-neon-cyan" />
                            <span className="text-gray-405">Tokens Consumed:</span>
                          </div>
                          <span className="font-mono font-bold dark:text-white">
                            {result.feedback?.stats?.tokensUsed?.total || 0} total <span className="text-gray-450 font-normal">({result.feedback?.stats?.tokensUsed?.prompt || 0} in, {result.feedback?.stats?.tokensUsed?.completion || 0} out)</span>
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-neon-pink" />
                            <span className="text-gray-400">Inference Latency:</span>
                          </div>
                          <span className="font-mono font-bold dark:text-white">
                            {result.feedback?.stats?.inferenceTime || 0.8}s <span className="text-gray-400 font-normal">(Response: {result.feedback?.stats?.reviewTime || 1.1}s)</span>
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-gray-450">Analysis Confidence:</span>
                          </div>
                          <span className="font-mono font-bold text-green-500">
                            {result.feedback?.confidence || 98}% Confidence
                          </span>
                        </div>
                      </div>

                      {/* Summary Card Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Errors Found', val: result.feedback?.summaryCards?.errors ?? 0, desc: 'Critical issues', color: 'border-red-500/25 bg-red-500/[0.02] text-red-500' },
                          { label: 'Warnings', val: result.feedback?.summaryCards?.warnings ?? 0, desc: 'Style / alerts', color: 'border-yellow-500/25 bg-yellow-500/[0.02] text-yellow-500' },
                          { label: 'Suggestions', val: result.feedback?.summaryCards?.suggestions ?? 0, desc: 'Code improvements', color: 'border-blue-500/25 bg-blue-500/[0.02] text-blue-500' },
                          { label: 'Security', val: result.feedback?.summaryCards?.security || 'Secure', desc: 'Exploit audits', color: 'border-red-500/20 bg-red-500/[0.01] text-orange-500' },
                        ].map((card, i) => (
                          <div key={i} className={`border rounded-xl p-3.5 flex flex-col justify-between ${card.color}`}>
                            <span className="text-[10px] font-bold text-gray-450 uppercase tracking-wider">{card.label}</span>
                            <div className="flex items-baseline justify-between mt-2">
                              <span className="text-lg font-black">{card.val}</span>
                              <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">{card.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}

                  {/* Tab 2: Detected Issues List (MENTOR STYLE) */}
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
                              <div key={idx} className="border border-red-500/20 bg-red-500/[0.02] p-4 rounded-xl space-y-3 hover:border-red-500/40 transition">
                                <div className="flex justify-between items-start">
                                  <h5 className="text-xs font-bold text-red-400">❌ {issue.title}</h5>
                                  {renderSeverityBadge(issue.severity)}
                                </div>
                                
                                <div className="space-y-2 text-xs text-gray-550 dark:text-gray-300">
                                  <div><strong className="text-red-450 dark:text-red-405 font-bold">💡 Why it happened: </strong> {issue.message}</div>
                                  <div><strong className="text-red-450 dark:text-red-405 font-bold">⚠️ Why it matters: </strong> The compiler will fail to parse this code structure, causing immediate program failure.</div>
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
                              <div key={idx} className="border border-orange-500/20 bg-orange-500/[0.02] p-4 rounded-xl space-y-3 hover:border-orange-500/40 transition">
                                <div className="flex justify-between items-start">
                                  <h5 className="text-xs font-bold text-orange-400">{issue.title}</h5>
                                  {renderSeverityBadge(issue.severity)}
                                </div>

                                <div className="space-y-2 text-xs text-gray-550 dark:text-gray-300">
                                  <div><strong className="text-orange-450 dark:text-orange-400 font-bold">💡 Why it happened: </strong> {issue.message}</div>
                                  {issue.impact && (
                                    <div><strong className="text-orange-450 dark:text-orange-400 font-bold">⚠️ Why it matters: </strong> {issue.impact}</div>
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

                      {/* Type Errors Section */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest border-b border-yellow-500/10 pb-1 flex items-center space-x-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Type Safety Errors</span>
                        </h4>

                        {issuesList.filter(i => i.type === 'type').length === 0 ? (
                          <p className="text-xs text-gray-400 italic pl-2">No type mismatches detected.</p>
                        ) : (
                          <div className="space-y-3">
                            {issuesList.filter(i => i.type === 'type').map((issue, idx) => (
                              <div key={idx} className="border border-yellow-500/20 bg-yellow-500/[0.02] p-4 rounded-xl space-y-3 hover:border-yellow-500/40 transition">
                                <div className="flex justify-between items-start">
                                  <h5 className="text-xs font-bold text-yellow-500">{issue.title}</h5>
                                  {renderSeverityBadge(issue.severity)}
                                </div>

                                <div className="space-y-2 text-xs text-gray-550 dark:text-gray-300">
                                  <div><strong className="text-yellow-450 dark:text-yellow-400 font-bold">💡 Why it happened: </strong> {issue.message}</div>
                                  <div><strong className="text-yellow-455 dark:text-yellow-400 font-bold">⚠️ Why it matters: </strong> Unsupported additions on mismatched operands yield type errors or execution exceptions.</div>
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
                              <div key={idx} className="border border-green-500/20 bg-green-500/[0.02] p-4 rounded-xl space-y-3 hover:border-green-500/40 transition">
                                <div className="flex justify-between items-start">
                                  <h5 className="text-xs font-bold text-green-500">{issue.title}</h5>
                                  {renderSeverityBadge(issue.severity)}
                                </div>

                                <div className="space-y-2 text-xs text-gray-550 dark:text-gray-300">
                                  <div><strong className="text-green-500 font-bold">💡 Why it happened: </strong> {issue.message}</div>
                                  <div><strong className="text-green-500 font-bold">⚠️ Why it matters: </strong> Reduces the readability and maintainability index of the codebase for secondary developers.</div>
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

                  {/* Tab 3: Fixed Code Output (Diff and Original) */}
                  {activeTab === 'fixed' && (
                    <div className="h-full flex flex-col space-y-4 animate-fadeIn min-h-[460px]">
                      
                      {/* Fixed toolbar options */}
                      <div className="flex items-center justify-between">
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
                            className="p-1.5 rounded-lg hover:bg-gray-150 dark:hover:bg-dark-800 text-gray-400 hover:text-neon-indigo transition flex items-center space-x-1 text-[11px] font-bold"
                          >
                            {copiedFixed ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            <span>Copy</span>
                          </button>
                          
                          <button
                            onClick={() => handleDownloadCode(result.optimizedCode, `code_optimized.${language === 'python' ? 'py' : 'js'}`)}
                            className="p-1.5 rounded-lg hover:bg-gray-150 dark:hover:bg-dark-800 text-gray-400 hover:text-neon-indigo transition flex items-center space-x-1 text-[11px] font-bold"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>

                      {/* Display Editor / Diff Editor */}
                      <div className="flex-1 border border-gray-150 dark:border-dark-800 rounded-xl overflow-hidden bg-gray-50 dark:bg-dark-955 p-2 min-h-[380px]">
                        {diffView ? (
                          <DiffEditor
                            height="380px"
                            original={code}
                            modified={result.optimizedCode}
                            language={language}
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
                            height="380px"
                            language={language}
                            theme={isDark ? 'vs-dark' : 'light'}
                            value={result.optimizedCode}
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

                  {/* Tab 4: AI Explanation Block */}
                  {activeTab === 'explanation' && (
                    <div className="space-y-4 animate-fadeIn border border-gray-155 dark:border-dark-800 p-5 rounded-2xl bg-gray-50/20 dark:bg-dark-900/30 min-h-[400px]">
                      <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center space-x-1.5 border-b border-gray-200 dark:border-dark-800 pb-2">
                        <BookOpen className="text-neon-indigo w-4 h-4" />
                        <span>Analysis Deep Dive</span>
                      </h4>
                      <SimpleMarkdown text={result.feedback?.aiExplanation} />
                    </div>
                  )}

                  {/* Tab 5: Performance Optimization */}
                  {activeTab === 'performance' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-dark-800 pb-2">
                        <Cpu className="text-neon-cyan w-4 h-4" />
                        <h4 className="text-sm font-bold text-gray-800 dark:text-white">Performance metrics</h4>
                      </div>

                      <div className="space-y-3">
                        {issuesList.filter(i => i.type === 'performance').length === 0 ? (
                          <div className="border border-green-500/10 bg-green-500/[0.02] p-4 rounded-xl text-xs text-green-400">
                            No performance overheads or execution bottlenecks detected.
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
                                <div><strong className="text-neon-cyan font-bold">⚠️ Why it matters: </strong> Reduces the efficiency metrics, increasing runtime execution and stack overheads.</div>
                              </div>

                              {issue.suggestedFix && (
                                <div className="mt-2 space-y-1">
                                  <span className="text-[10px] font-bold text-gray-400">🔧 Remediated Code:</span>
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

                  {/* Tab 6: Security Audit */}
                  {activeTab === 'security' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-dark-800 pb-2">
                        <ShieldAlert className="text-red-500 w-4 h-4" />
                        <h4 className="text-sm font-bold text-gray-800 dark:text-white">Security Vulnerabilities sweep</h4>
                      </div>

                      <div className="space-y-3">
                        {issuesList.filter(i => i.type === 'security').length === 0 ? (
                          <div className="border border-green-500/10 bg-green-500/[0.02] p-4 rounded-xl text-xs text-green-400">
                            No potential SQL injections, XSS vulnerabilities, or leaked secrets found.
                          </div>
                        ) : (
                          issuesList.filter(i => i.type === 'security').map((issue, idx) => (
                            <div key={idx} className="border border-red-500/20 bg-red-500/[0.02] p-4 rounded-xl space-y-3 hover:border-red-500/40 transition">
                              <div className="flex justify-between items-start">
                                <h5 className="text-xs font-bold text-red-400">⚠️ {issue.title}</h5>
                                {renderSeverityBadge(issue.severity)}
                              </div>
                              
                              <div className="space-y-2 text-xs text-gray-550 dark:text-gray-300">
                                <div><strong className="text-red-450 dark:text-red-400 font-bold">💡 Why it happened: </strong> {issue.message}</div>
                                <div><strong className="text-red-450 dark:text-red-400 font-bold">⚠️ Why it matters: </strong> Exposes runtime structures to arbitrary injection payloads or remote exploits.</div>
                              </div>

                              {issue.suggestedFix && (
                                <div className="mt-2 space-y-1">
                                  <span className="text-[10px] font-bold text-gray-400">🔧 Remediation:</span>
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

                  {/* Tab 7: Local History Timeline */}
                  {activeTab === 'history' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-800 pb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Session Audit Logs</span>
                        <span className="text-[10px] text-neon-cyan">{recentReviews.length} total runs</span>
                      </div>
                      
                      <div className="space-y-2.5">
                        {recentReviews.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No history logs recorded in database yet.</p>
                        ) : (
                          recentReviews.map((rev, idx) => {
                            const details = getScoreDetails(rev.feedback?.score);
                            return (
                              <div key={idx} className="p-3 border border-gray-150 dark:border-dark-800 rounded-xl flex items-center justify-between bg-gray-50/[0.02] dark:bg-dark-900/[0.02]">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-gray-750 dark:text-gray-200 capitalize font-mono">{rev.language} ({rev.reviewType})</span>
                                  <span className="text-[10px] text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${details.border} ${details.color} ${details.bg}`}>
                                  {rev.feedback?.score}/100 Quality
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default NewReview;
