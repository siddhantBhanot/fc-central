import { useState } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  ChevronDown,
  CheckCircle2,
  Code2,
  BookOpen,
  FileCode,
  Search,
} from 'lucide-react';
import { config } from '@/config/env';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import type { Microservice } from '@/types';

const SERVICES: Microservice[] = [
  {
    id: 'income-assessment-service',
    name: 'income-assessment-service',
    description: 'Income assessment rules engine & eligibility calculations',
  },
  {
    id: 'loan-origination-service',
    name: 'loan-origination-service',
    description: 'Loan application lifecycle & underwriting workflows',
  },
  {
    id: 'kyc-verification-service',
    name: 'kyc-verification-service',
    description: 'Identity verification & document assessment',
  },
];

const SUGGESTED_QUESTIONS = [
  'What is the business handler for FOUR_WHEELER_PERSONAL?',
  'What API contract is currently used for /initiation-application?',
  'What is the request flow from the UI to the backend?',
  'What happens after /generate-link is called?',
  'Which services integrate with CAP?',
];

const SAMPLE_KOTLIN_RESPONSE = `### Business Handler: FourWheelerPersonalAssessmentHandler

Found in \`income-assessment-service\` under \`src/main/kotlin/.../handlers/\`:

\`\`\`kotlin
@Service
class FourWheelerPersonalAssessmentHandler(
    private val ruleEngine: AssessmentRuleEngine,
    private val metrics: MetricCollector
) : AssessmentHandler {

    override fun assess(request: AssessmentRequest): AssessmentResult {
        metrics.increment("assessment.four_wheeler.personal.invoked")
        
        val evaluation = ruleEngine.evaluatePersonalVehicle(
            income = request.verifiedIncome,
            obligations = request.totalObligations
        )
        
        return AssessmentResult(
            isEligible = evaluation.score >= MIN_SCORE_THRESHOLD,
            maxApprovedAmount = evaluation.recommendedLimit,
            riskTier = evaluation.tier
        )
    }
}
\`\`\`

#### Verification & API Contract
| Field | Type | Description |
| :--- | :--- | :--- |
| \`verifiedIncome\` | \`BigDecimal\` | Net monthly verified income |
| \`totalObligations\`| \`BigDecimal\` | Existing active EMI obligations |
| \`isEligible\` | \`Boolean\` | Eligibility status for personal 4W loan |
`;

export function App() {
  const [selectedService, setSelectedService] = useState<string>(SERVICES[0].id);
  const [queryInput, setQueryInput] = useState<string>('');
  const [viewMode, setViewMode] = useState<'hero' | 'chat'>('hero');
  const [activeTab, setActiveTab] = useState<'overview' | 'code' | 'api'>('overview');

  const handleRunQuery = (q?: string) => {
    const text = q || queryInput;
    if (!text.trim()) return;
    setQueryInput(text);
    setViewMode('chat');
  };

  return (
    <div className="min-h-screen bg-[#edf3f8] flex flex-col justify-between p-3 sm:p-5 md:p-8 font-sans antialiased text-slate-800">
      {/* Outer White Card Container matching Freecharge Biz */}
      <div className="max-w-7xl w-full mx-auto bg-white rounded-[28px] md:rounded-[36px] shadow-sm border border-slate-100 flex flex-col min-h-[92vh] overflow-hidden">
        
        {/* Navigation Bar */}
        <header className="px-6 md:px-10 py-5 flex items-center justify-between border-b border-slate-100/80 bg-white">
          {/* Brand Logo matching Freecharge Biz Style */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('hero')}
              className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
            >
              {/* Lightning / Arrow Icon */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f05a28] to-[#ff7a45] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base md:text-lg font-black tracking-tight text-[#f05a28] uppercase">
                    FREECHARGE <span className="font-extrabold text-[#f05a28]">BIZ</span>
                  </span>
                  <span className="text-[10px] font-bold text-[#97144d] uppercase tracking-wider bg-[#97144d]/10 px-1.5 py-0.5 rounded">
                    CENTRAL
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#97144d] uppercase tracking-wider -mt-1">
                  by AXIS BANK &middot; ENGINEERING INTELLIGENCE
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button
              onClick={() => setViewMode('hero')}
              className={`hover:text-[#f05a28] transition-colors cursor-pointer ${
                viewMode === 'hero' ? 'text-slate-900 font-semibold' : ''
              }`}
            >
              Home
            </button>
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-[#f05a28] transition-colors">
              <span>Microservices</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#f05a28]" />
            </div>
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-[#f05a28] transition-colors">
              <span>API Contracts</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#f05a28]" />
            </div>
            <a href="#about" className="hover:text-[#f05a28] transition-colors">
              Architecture
            </a>
            <a href="#knowledge" className="hover:text-[#f05a28] transition-colors">
              Knowledge Base
            </a>
          </nav>

          {/* Service Selector & Login/Action Pill */}
          <div className="flex items-center gap-3">
            {/* Service dropdown */}
            <div className="relative hidden sm:block">
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="appearance-none bg-[#f8fafc] text-slate-700 text-xs font-semibold pl-3 pr-8 py-2 rounded-full border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#f05a28]/20 focus:border-[#f05a28] cursor-pointer shadow-xs"
              >
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Orange Action / Login Button matching screenshot */}
            <button
              onClick={() => setViewMode(viewMode === 'hero' ? 'chat' : 'hero')}
              className="px-6 py-2 rounded-full bg-[#f05a28] hover:bg-[#d94b1c] active:scale-98 text-white text-xs md:text-sm font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              {viewMode === 'hero' ? 'Explore Chat' : 'Back to Home'}
            </button>
          </div>
        </header>

        {/* Hero View matching the Freecharge Biz Landing Page */}
        {viewMode === 'hero' ? (
          <main className="flex-1 px-6 md:px-12 py-8 md:py-14 flex flex-col justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* Left Column: Hero Text & Features */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200/70 text-[#f05a28] text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Verified Microservice Intelligence &middot; {selectedService}</span>
                </div>

                {/* Primary Heading matching "Fast, Simple and Secure way to pay" */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                  Fast, Simple and <br />
                  <span className="text-[#f05a28]">Grounded</span> way to inspect
                </h2>

                {/* Description */}
                <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
                  Query codebase architecture, explore microservice business handlers, and inspect API contracts in a flash directly from verified source repositories.
                </p>

                {/* 3 Value Props with Green Badges matching the 3 checkmarks from the photo */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm md:text-base font-medium text-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#00b074] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>Fastest RAG semantic search across microservices</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm md:text-base font-medium text-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#00b074] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>100% grounded answers with exact file & method citations</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm md:text-base font-medium text-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#00b074] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span>Live SSE streaming with real-time Kotlin & Python code inspection</span>
                  </div>
                </div>

                {/* Interactive Query Box */}
                <div className="pt-4 max-w-xl">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRunQuery();
                    }}
                    className="relative flex items-center bg-white rounded-full border-2 border-slate-200 focus-within:border-[#f05a28] shadow-sm p-1.5 transition-all"
                  >
                    <div className="pl-3.5 text-slate-400">
                      <Search className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      placeholder={`Ask anything about ${selectedService}...`}
                      className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-full bg-[#f05a28] hover:bg-[#d94b1c] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <span>Ask AI</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* Suggested Questions Pills */}
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Popular Inquiries
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.slice(0, 3).map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRunQuery(q)}
                        className="text-xs px-3 py-1.5 rounded-full bg-[#f1f5f9] hover:bg-orange-50 hover:text-[#f05a28] border border-slate-200/70 hover:border-orange-200 text-slate-600 transition-all cursor-pointer font-medium flex items-center gap-1.5 text-left"
                      >
                        <Sparkles className="w-3 h-3 text-[#f05a28]" />
                        <span className="truncate max-w-[280px]">{q}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Device / Intelligence Preview Showcase matching the Phone Card from the photo */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md">
                  
                  {/* Backdrop glowing accent */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-orange-200/50 to-rose-200/30 rounded-[36px] blur-xl opacity-70"></div>
                  
                  {/* Main Device Card container */}
                  <div className="relative bg-white rounded-[32px] border-[5px] border-slate-900 shadow-2xl p-5 overflow-hidden flex flex-col space-y-4">
                    
                    {/* Device Speaker Notch / Top Bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-900"></div>
                        <span className="text-[11px] font-bold tracking-tight text-[#f05a28] uppercase">
                          FREECHARGE <span className="text-[#97144d]">BIZ</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active
                      </span>
                    </div>

                    {/* Central Verification Graphic matching the green checkmark badge in the phone screen */}
                    <div className="text-center py-2 space-y-2">
                      <div className="w-14 h-14 mx-auto rounded-full bg-[#00b074] flex items-center justify-center text-white shadow-lg shadow-[#00b074]/30">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Verified Grounding</h3>
                        <p className="text-xs text-slate-500 font-mono">service: {selectedService}</p>
                      </div>
                    </div>

                    {/* Quick navigation pill tabs */}
                    <div className="flex bg-[#f1f5f9] p-1 rounded-xl text-xs font-semibold text-slate-600">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                          activeTab === 'overview' ? 'bg-white text-[#f05a28] shadow-xs' : 'hover:text-slate-900'
                        }`}
                      >
                        Handler
                      </button>
                      <button
                        onClick={() => setActiveTab('code')}
                        className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                          activeTab === 'code' ? 'bg-white text-[#f05a28] shadow-xs' : 'hover:text-slate-900'
                        }`}
                      >
                        Contract
                      </button>
                      <button
                        onClick={() => setActiveTab('api')}
                        className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                          activeTab === 'api' ? 'bg-white text-[#f05a28] shadow-xs' : 'hover:text-slate-900'
                        }`}
                      >
                        Sources
                      </button>
                    </div>

                    {/* Interactive Showcase Preview */}
                    <div className="bg-[#f8fafc] rounded-2xl border border-slate-200/80 p-3.5 space-y-2.5 text-xs">
                      {activeTab === 'overview' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span>Handler Class</span>
                            <span className="font-semibold text-slate-700">FourWheelerAssessment</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono text-[11px] leading-relaxed">
                            <span className="text-[#97144d] font-bold">override fun</span> assess(req: AssessmentRequest): AssessmentResult
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                            <span>Evaluated Obligations:</span>
                            <span className="font-semibold text-slate-800">INR 15,000 / mo</span>
                          </div>
                        </div>
                      )}

                      {activeTab === 'code' && (
                        <div className="space-y-1.5 font-mono text-[10px]">
                          <div className="bg-slate-900 text-slate-200 p-2.5 rounded-xl overflow-x-auto">
                            <span className="text-amber-400">POST</span> /api/v1/assess<br/>
                            <span className="text-emerald-400">200 OK</span> (SSE Streamed)
                          </div>
                        </div>
                      )}

                      {activeTab === 'api' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px]">
                            <FileCode className="w-3.5 h-3.5 text-[#f05a28]" />
                            <span className="truncate">FourWheelerPersonalAssessmentHandler.kt</span>
                          </div>
                          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px]">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="truncate">knowledge/api/initiation-application.md</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <button
                      onClick={() => handleRunQuery('What is the business handler for FOUR_WHEELER_PERSONAL?')}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Code2 className="w-3.5 h-3.5 text-[#f05a28]" />
                      <span>Inspect Full Response &amp; Code</span>
                    </button>

                    {/* Small branding footer inside the phone frame */}
                    <div className="text-center pt-1">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                        Powered by <span className="text-slate-700 font-extrabold">FC CENTRAL AI</span>
                      </span>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </main>
        ) : (
          /* Chat & Query Workspace View */
          <main className="flex-1 flex flex-col md:flex-row min-w-0 bg-slate-50/50">
            
            {/* Sidebar */}
            <aside className="w-full md:w-64 border-r border-slate-200/80 bg-white p-4 flex flex-col justify-between">
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setViewMode('hero');
                    setQueryInput('');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-[#f05a28] hover:bg-[#d94b1c] text-white shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Inquiry</span>
                </button>

                <div className="pt-2">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Recent Inquiries
                  </div>
                  <div className="space-y-1 mt-1">
                    <button
                      onClick={() => setQueryInput('What is the business handler for FOUR_WHEELER_PERSONAL?')}
                      className="w-full text-left px-2.5 py-2 rounded-lg bg-orange-50/80 text-[#f05a28] border border-orange-200/60 font-medium text-xs flex items-center gap-2"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#f05a28] shrink-0" />
                      <span className="truncate">FOUR_WHEELER Assessment</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Suggested Questions
                  </div>
                  <div className="space-y-1 mt-1">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRunQuery(q)}
                        className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs truncate transition-colors cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status info */}
              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00b074]"></span>
                    API Gateway
                  </span>
                  <span className="font-mono text-[10px]">{config.apiBaseUrl}</span>
                </div>
              </div>
            </aside>

            {/* Main Chat Canvas */}
            <div className="flex-1 flex flex-col justify-between p-4 md:p-6 min-w-0 bg-white">
              <div className="max-w-3xl mx-auto w-full space-y-4 overflow-y-auto">
                
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-slate-900 px-4 py-2.5 text-xs md:text-sm text-white shadow-sm">
                    {queryInput || 'What is the business handler for FOUR_WHEELER_PERSONAL?'}
                  </div>
                </div>

                {/* Assistant Message */}
                <div className="flex justify-start">
                  <div className="max-w-[95%] rounded-2xl rounded-tl-xs bg-[#f8fafc] border border-slate-200/90 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-[#f05a28] flex items-center justify-center text-white">
                          <Sparkles className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          Engineering Assistant &middot; {selectedService}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-[#00b074]" />
                        <span>Verified Grounded</span>
                      </div>
                    </div>

                    <MarkdownRenderer content={SAMPLE_KOTLIN_RESPONSE} />

                    {/* Citations */}
                    <div className="pt-3 border-t border-slate-200/80">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Referenced Sources
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-[11px] shadow-2xs">
                          FourWheelerPersonalAssessmentHandler.kt:L12-34
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-[11px] shadow-2xs">
                          knowledge/api/initiation-application.md
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Chat Input Bar */}
              <div className="max-w-3xl mx-auto w-full pt-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (queryInput.trim()) handleRunQuery();
                  }}
                  className="rounded-2xl border-2 border-slate-200 bg-white focus-within:border-[#f05a28] shadow-sm p-1.5 transition-all"
                >
                  <textarea
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (queryInput.trim()) handleRunQuery();
                      }
                    }}
                    placeholder={`Ask a question regarding ${selectedService}...`}
                    rows={2}
                    className="w-full resize-none bg-transparent px-3.5 py-2 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Service: {selectedService}
                    </span>
                    <button
                      type="submit"
                      disabled={!queryInput.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#f05a28] hover:bg-[#d94b1c] disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Query</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </main>
        )}

        {/* Footer */}
        <footer className="px-6 md:px-10 py-4 border-t border-slate-100/80 bg-white flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#f05a28]">FREECHARGE BIZ</span>
            <span>&middot; Engineering Intelligence Platform</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Target: <code className="font-mono text-slate-700">{config.apiBaseUrl}</code></span>
            <span>Internal Developer Tool</span>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default App;
