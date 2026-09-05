import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowUp,
  ChevronDown,
  Code2,
  Database,
  GitBranch,
  GitMerge,
  History,
  Layers,
  Loader2,
  LogOut,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Share2,
} from 'lucide-react';

import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { SourceCitationList } from '@/components/chat/SourceCitationList';
import { FeedbackControls } from '@/components/chat/FeedbackControls';
import { IngestionModal } from '@/components/chat/IngestionModal';
import { ConversationHistoryDrawer } from '@/components/chat/ConversationHistoryDrawer';
import { ShareModal } from '@/components/chat/ShareModal';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { AuthScreen } from '@/components/auth/AuthScreen';
import apiClient, { ApiError } from '@/lib/api/client';
import type { ChatMessage, Microservice } from '@/types';


const DEFAULT_SERVICES: Microservice[] = [
  {
    id: 'income-assessment-service',
    name: 'income-assessment-service',
    description: 'Income assessment rules engine & eligibility calculations',
    has_indexed_data: true,
  },
  {
    id: 'loan-origination-service',
    name: 'loan-origination-service',
    description: 'Loan application lifecycle & underwriting workflows',
    has_indexed_data: false,
  },
  {
    id: 'kyc-verification-service',
    name: 'kyc-verification-service',
    description: 'Identity verification & document assessment',
    has_indexed_data: false,
  },
];

const FEATURE_CARDS = [
  {
    id: 'apis',
    icon: Code2,
    title: 'APIs',
    description: 'Endpoints, params, auth, and response schemas across every service.',
    query: 'What are the main endpoints and auth schemas for this service?',
  },
  {
    id: 'business-logic',
    icon: GitBranch,
    title: 'Business logic',
    description: 'How rules, eligibility, and calculations are evaluated under the hood.',
    query: 'What is the business handler for FOUR_WHEELER_PERSONAL and what endpoint does it expose?',
  },
  {
    id: 'request-flows',
    icon: GitMerge,
    title: 'Request flows',
    description: 'Trace a request end-to-end, including retries, queues, and callbacks.',
    query: 'What is the usual request flow for income-assessment-service?',
  },
  {
    id: 'integrations',
    icon: Layers,
    title: 'Integrations',
    description: 'Third-party connections, webhooks, and cross-service dependencies.',
    query: 'What is Zenith and what is it used for?',
  },
];

function DashboardApp() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const [services, setServices] = useState<Microservice[]>(DEFAULT_SERVICES);
  const [selectedService, setSelectedService] = useState<string>(DEFAULT_SERVICES[0].id);
  const [queryInput, setQueryInput] = useState<string>('');
  const [isChatActive, setIsChatActive] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [backendHealth, setBackendHealth] = useState<'healthy' | 'degraded' | 'offline'>('offline');
  const [isIngestionModalOpen, setIsIngestionModalOpen] = useState<boolean>(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isSharingLoading, setIsSharingLoading] = useState<boolean>(false);
  const [activeSharedToken, setActiveSharedToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('share');
    }
    return null;
  });
  const [sharedInfo, setSharedInfo] = useState<{
    isOwner: boolean;
    title?: string | null;
    forkedFrom?: string | null;
  } | null>(null);
  const [forkNotification, setForkNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<{ message: string; requestId?: string } | null>(null);


  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatActive) {
      scrollToBottom();
    }
  }, [messages, isChatActive, isLoading]);

  // Initial health check & service discovery
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const health = await apiClient.checkHealth();
        setBackendHealth(health.status === 'healthy' ? 'healthy' : 'degraded');
      } catch {
        setBackendHealth('offline');
      }

      try {
        const remoteServices = await apiClient.listServices();
        if (remoteServices && remoteServices.length > 0) {
          setServices(remoteServices);
        }
      } catch {
        // Keep default services if fetch fails
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-load shared conversation when authenticated and share token is present in URL
  useEffect(() => {
    if (!isAuthenticated || !activeSharedToken) return;

    const loadSharedConversation = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await apiClient.getSharedConversation(activeSharedToken);
        setCurrentConversationId(data.id);
        setSelectedService(data.service);
        setShareToken(data.share_token);
        setSharedInfo({
          isOwner: data.is_owner,
          title: data.title,
          forkedFrom: data.forked_from,
        });

        const loadedMessages: ChatMessage[] = data.messages.map((m) => ({
          id: m.id,
          conversationId: data.id,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'complete',
          sources: m.sources,
        }));

        setMessages(loadedMessages);
        setIsChatActive(true);
      } catch (err: any) {
        console.error('Failed to load shared conversation:', err);
        setErrorMessage({ message: 'Shared conversation not found or link has expired.' });
      } finally {
        setIsLoading(false);
      }
    };

    loadSharedConversation();
  }, [isAuthenticated, activeSharedToken]);

  const handleStartChat = async (queryText?: string) => {
    const text = (queryText || queryInput).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      conversationId: currentConversationId || undefined,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsChatActive(true);
    setQueryInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.query({
        query: text,
        conversation_id: currentConversationId,
        share_token: activeSharedToken || undefined,
        service: selectedService,
        top_k: 5,
      });

      if (response.forked) {
        setCurrentConversationId(response.conversation_id);
        setActiveSharedToken(null);
        setSharedInfo(null);
        setShareToken(null);
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        setForkNotification('Conversation branched! You are now continuing on your own personal fork.');
        setTimeout(() => setForkNotification(null), 6000);
      } else {
        setCurrentConversationId(response.conversation_id);
      }

      const assistantMessage: ChatMessage = {
        id: response.message_id,
        conversationId: response.conversation_id,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'complete',
        sources: response.sources,
        latencyMs: response.latency_ms,
        provider: response.provider,
        model: response.model,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Query error:', err);
      let errorDesc = 'Failed to get response from engineering intelligence service.';
      let reqId: string | undefined;

      if (err instanceof ApiError) {
        errorDesc = err.message;
        reqId = err.requestId;
      } else if (err.message) {
        errorDesc = err.message;
      }

      setErrorMessage({ message: errorDesc, requestId: reqId });

      const errorBubble: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Unable to complete response:** ${errorDesc}\n\n*Please ensure the backend service and Qdrant/Groq are reachable.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorBubble]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenShare = async () => {
    if (!currentConversationId) return;
    setIsShareModalOpen(true);
    setIsSharingLoading(true);
    try {
      const res = await apiClient.shareConversation(currentConversationId);
      setShareToken(res.share_token);
    } catch (err: any) {
      console.error('Failed to generate share link:', err);
      setErrorMessage({ message: err.message || 'Failed to generate share link.' });
    } finally {
      setIsSharingLoading(false);
    }
  };

  const handleResetHome = () => {
    setIsChatActive(false);
    setMessages([]);
    setCurrentConversationId(null);
    setQueryInput('');
    setErrorMessage(null);
    setActiveSharedToken(null);
    setSharedInfo(null);
    setShareToken(null);
    setForkNotification(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setActiveSharedToken(null);
    setSharedInfo(null);
    setShareToken(null);
    setForkNotification(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    try {
      const detail = await apiClient.getConversation(conversationId);
      setCurrentConversationId(detail.id);
      setSelectedService(detail.service);

      const loadedMessages: ChatMessage[] = detail.messages.map((m) => ({
        id: m.id,
        conversationId: detail.id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'complete',
        sources: m.sources,
      }));

      setMessages(loadedMessages);
      setIsChatActive(true);
    } catch (err: any) {
      console.error('Failed to load conversation:', err);
      setErrorMessage({ message: 'Failed to load conversation history.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {

    return (
      <div className="min-h-screen bg-[#edf3f8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#f05a28]/20 border-t-[#f05a28] rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Validating session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (

    <div className="min-h-screen bg-[#edf3f8] flex flex-col justify-between p-3 sm:p-5 md:p-8 font-sans antialiased text-slate-800">
      {/* Outer White Card matching Freecharge Biz */}
      <div className="max-w-5xl w-full mx-auto bg-white rounded-[28px] md:rounded-[40px] shadow-sm border border-slate-100 flex flex-col min-h-[92vh] overflow-hidden">
        
        {/* Persistent Top Header */}
        <header className="px-6 md:px-10 py-5 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          {/* Freecharge Logo on Left */}
          <button
            onClick={handleResetHome}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            title="Return to Home"
          >
            {/* Freecharge Orange Arrow Glyph */}
            <div className="w-7 h-7 flex items-center justify-center text-[#f05a28] shrink-0">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-base font-black tracking-tight text-slate-900 uppercase">
                  FREECHARGE
                </span>
                <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded ml-1 tracking-wider">
                  BIZ
                </span>
              </div>
              <span className="text-[9px] font-semibold text-slate-400 tracking-wider uppercase -mt-0.5">
                DEVELOPER ASSISTANT
              </span>
            </div>
          </button>

          {/* Center: Live Backend Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                backendHealth === 'healthy'
                  ? 'bg-emerald-500 animate-pulse'
                  : backendHealth === 'degraded'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-600">
              {backendHealth === 'healthy'
                ? 'Backend Online · Groq & Qdrant'
                : backendHealth === 'degraded'
                ? 'Backend Degraded'
                : 'Backend Offline (port 8000)'}
            </span>
          </div>

          {/* Right Actions: Knowledge Ingest, History, New Chat */}
          <div className="flex items-center gap-2">
            {/* Knowledge Ingestion Modal Trigger */}
            <button
              onClick={() => setIsIngestionModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Index service knowledge"
            >
              <Database className="w-3.5 h-3.5 text-[#f05a28]" />
              <span className="hidden md:inline">Index Docs</span>
            </button>

            {/* Conversation History Drawer Trigger */}
            <button
              onClick={() => setIsHistoryDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="View conversation history"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden md:inline">History</span>
            </button>

            {/* Share Button when conversation is active */}
            {currentConversationId && isChatActive && (
              <button
                onClick={handleOpenShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#f05a28] bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer shadow-xs"
                title="Share this conversation"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}

            {isChatActive && (
              <button
                onClick={handleResetHome}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Start a new conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
            )}

            {/* User Identity & Logout */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-xs"
                title={`Signed in as ${user?.email}`}
              >
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center uppercase shadow-xs">
                  {user?.name ? user.name.charAt(0) : 'E'}
                </span>
                <span className="font-semibold text-slate-700 max-w-[120px] truncate hidden md:inline">
                  {user?.name || user?.email}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleResetHome();
                  logout();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                title="Sign out of FC Central"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>


        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2 flex items-center justify-between text-xs text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{errorMessage.message}</span>
              {errorMessage.requestId && (
                <span className="font-mono text-[10px] text-rose-500">
                  (Req: {errorMessage.requestId})
                </span>
              )}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Dynamic Body: Home Screen vs Active Chat */}
        {!isChatActive ? (
          /* =========================================================================
             1. HOME SCREEN
             ========================================================================= */
          <main className="flex-1 px-6 md:px-12 py-8 md:py-12 flex flex-col justify-center items-center">
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
              
              {/* Badge: # Developer knowledge base */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200/80 mb-5 shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#f05a28]" />
                <span>Developer knowledge base</span>
              </div>

              {/* Main Heading: Ask anything about your services */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight text-center leading-[1.15] mb-3">
                Ask anything about <br />
                your services
              </h1>

              {/* Subtitle with bolded keywords */}
              <p className="text-slate-500 text-xs sm:text-sm text-center max-w-lg leading-relaxed mb-8">
                Get instant, grounded answers on <span className="font-semibold text-slate-700">APIs</span>,{' '}
                <span className="font-semibold text-slate-700">business logic</span>,{' '}
                <span className="font-semibold text-slate-700">request flows</span>, and{' '}
                <span className="font-semibold text-slate-700">integrations</span> — straight from your service documentation.
              </p>

              {/* Central Input Box Container */}
              <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs p-4 mb-8 transition-all focus-within:border-slate-300 focus-within:shadow-md">
                {/* Top Row: SERVICE CONTEXT + Dropdown */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    SERVICE CONTEXT
                  </span>
                  <div className="relative">
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="appearance-none bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold pl-2.5 pr-6 py-1 rounded-lg border border-slate-200/60 focus:outline-none cursor-pointer"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>

                {/* Middle Row: Text Input */}
                <textarea
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleStartChat();
                    }
                  }}
                  placeholder={`Ask about ${selectedService}...`}
                  rows={2}
                  disabled={isLoading}
                  className="w-full resize-none bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none py-1"
                />

                {/* Bottom Row: Circular Orange Up-Arrow Send Button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleStartChat()}
                    disabled={!queryInput.trim() || isLoading}
                    type="button"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      queryInput.trim() && !isLoading
                        ? 'bg-[#f05a28] text-white shadow-xs hover:bg-[#d94b1c]'
                        : 'bg-orange-100 text-[#f05a28] hover:bg-[#f05a28] hover:text-white'
                    }`}
                    title="Send message"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </div>

              {/* WHAT YOU CAN ASK ABOUT Section Header */}
              <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase text-center mb-4">
                WHAT YOU CAN ASK ABOUT
              </div>

              {/* 2x2 Feature Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {FEATURE_CARDS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleStartChat(item.query)}
                      className="bg-white hover:bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 flex items-start gap-3.5 transition-all text-left group cursor-pointer shadow-2xs hover:shadow-xs"
                    >
                      <div className="w-8 h-8 rounded-xl bg-orange-50 group-hover:bg-orange-100 text-[#f05a28] flex items-center justify-center shrink-0 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#f05a28] transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Disclaimer at bottom */}
              <div className="text-center text-[11px] text-slate-400 mt-10 space-y-0.5">
                <p>Answers are grounded live with Qdrant Cloud vectors and Groq inference.</p>
                <p className="text-[10px] text-slate-400">FreeCharge Biz · Developer Assistant</p>
              </div>

            </div>
          </main>
        ) : (
          /* =========================================================================
             2. CHAT WINDOW
             ========================================================================= */
          <main className="flex-1 flex flex-col justify-between p-4 md:p-8 min-w-0 bg-white">
            
            {/* Scrollable Conversation Stream */}
            <div className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full space-y-6 pb-6 pr-1">
              
              {/* Service header indicator */}
              <div className="flex items-center justify-center gap-2 py-1">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Inspecting: <span className="text-[#f05a28] font-mono">{selectedService}</span>
                </span>
                {currentConversationId && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-200/60 truncate max-w-[120px]">
                    ID: {currentConversationId.slice(0, 8)}...
                  </span>
                )}
              </div>

              {/* Shared Thread Indicator Banner */}
              {sharedInfo && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <GitBranch className="w-4 h-4 text-amber-700 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold">
                        {sharedInfo.isOwner
                          ? 'Viewing your shared conversation'
                          : 'Viewing shared conversation'}
                      </span>
                      <span className="text-amber-800 text-[11px] block sm:inline sm:ml-1.5 truncate">
                        {sharedInfo.isOwner
                          ? '— anyone with this link can inspect and branch off this thread.'
                          : '— replying will automatically fork this thread into your personal account.'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 shrink-0">
                    {sharedInfo.isOwner ? 'Shared Link' : 'Fork-on-Reply'}
                  </span>
                </div>
              )}

              {/* Fork Notification Banner */}
              {forkNotification && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{forkNotification}</span>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  {msg.role === 'user' ? (
                    /* User Message Bubble */
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-slate-900 px-4 py-2.5 text-xs sm:text-sm text-white shadow-xs">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message Bubble */
                    <div className="flex justify-start">
                      <div className="max-w-[95%] w-full rounded-2xl rounded-tl-xs bg-[#f8fafc] border border-slate-200 p-5 shadow-xs space-y-3">
                        {/* Assistant message header */}
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-[#f05a28] flex items-center justify-center text-white">
                              <Sparkles className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">
                              Developer Assistant
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-[#00b074]" />
                            <span>Verified Grounded</span>
                          </div>
                        </div>

                        {/* Markdown & Kotlin syntax highlighter */}
                        <MarkdownRenderer content={msg.content} />

                        {/* Citations if available */}
                        {msg.sources && msg.sources.length > 0 && (
                          <SourceCitationList sources={msg.sources} />
                        )}

                        {/* Message Quality Feedback Controls */}
                        {msg.conversationId && msg.id && (
                          <FeedbackControls
                            messageId={msg.id}
                            conversationId={msg.conversationId}
                            initialRating={msg.feedbackRating}
                          />
                        )}

                        {/* Telemetry Footer */}
                        {msg.latencyMs && (
                          <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3 text-emerald-500" />
                              <span>Latency: {msg.latencyMs.toFixed(0)} ms</span>
                            </span>
                            <span>Model: {msg.model || 'gpt-oss-120b'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Generating / Thinking Pulse Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-xs bg-[#f8fafc] border border-slate-200 px-4 py-3 shadow-xs flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-[#f05a28] animate-spin" />
                    <span className="text-xs text-slate-600 font-medium">
                      Retrieving neural vectors & generating answer...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Shifted Bottom Input Box */}
            <div className="max-w-3xl mx-auto w-full pt-2">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 focus-within:border-slate-300 focus-within:shadow-md transition-all">
                {/* Top Row: SERVICE CONTEXT + Dropdown */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    SERVICE CONTEXT
                  </span>
                  <div className="relative">
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="appearance-none bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold pl-2.5 pr-6 py-1 rounded-lg border border-slate-200/60 focus:outline-none cursor-pointer"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>

                {/* Middle Row: Text Input */}
                <textarea
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleStartChat();
                    }
                  }}
                  placeholder={`Ask a follow up question about ${selectedService}...`}
                  rows={2}
                  disabled={isLoading}
                  className="w-full resize-none bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none py-1"
                />

                {/* Bottom Row: Circular Orange Up-Arrow Send Button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    Press Enter to send, Shift + Enter for new line
                  </span>
                  <button
                    onClick={() => handleStartChat()}
                    disabled={!queryInput.trim() || isLoading}
                    type="button"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      queryInput.trim() && !isLoading
                        ? 'bg-[#f05a28] text-white shadow-xs hover:bg-[#d94b1c]'
                        : 'bg-orange-100 text-[#f05a28] hover:bg-[#f05a28] hover:text-white'
                    }`}
                    title="Send message"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </div>
            </div>

          </main>
        )}

      </div>

      {/* Knowledge Ingestion Modal */}
      <IngestionModal
        isOpen={isIngestionModalOpen}
        onClose={() => setIsIngestionModalOpen(false)}
        service={selectedService}
      />

      {/* Conversation History Drawer */}
      <ConversationHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleResetHome}
      />

      {/* Share Conversation Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        conversationId={currentConversationId}
        shareToken={shareToken}
        isLoading={isSharingLoading}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <DashboardApp />
    </AuthProvider>
  );
}

export default App;

