import { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  ChevronDown,
  Code2,
  GitBranch,
  GitMerge,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  FileCode,
  BookOpen,
} from 'lucide-react';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import type { Microservice, ChatMessage } from '@/types';

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
    query: 'What is the business handler for FOUR_WHEELER_PERSONAL?',
  },
  {
    id: 'request-flows',
    icon: GitMerge,
    title: 'Request flows',
    description: 'Trace a request end-to-end, including retries, queues, and callbacks.',
    query: 'What is the request flow from the UI to the backend for /initiation-application?',
  },
  {
    id: 'integrations',
    icon: Layers,
    title: 'Integrations',
    description: 'Third-party connections, webhooks, and cross-service dependencies.',
    query: 'Which downstream services and external webhooks integrate with this service?',
  },
];

const SAMPLE_KOTLIN_RESPONSE = `### Business Handler: FourWheelerPersonalAssessmentHandler

Found in \`income-assessment-service\` under \`src/main/kotlin/.../handlers/\`:

\`\`\`kotlin
@Service
class FourWheelerPersonalAssessmentHandler(
    private val ruleEngine: AssessmentRuleEngine,
    private val telemetry: MetricCollector
) : AssessmentHandler {

    override fun assess(request: AssessmentRequest): AssessmentResult {
        telemetry.increment("assessment.four_wheeler.personal.invoked")
        
        val criteria = ruleEngine.evaluatePersonalVehicle(
            income = request.verifiedIncome,
            obligations = request.totalObligations
        )
        
        return AssessmentResult(
            isEligible = criteria.score >= THRESHOLD,
            maxApprovedAmount = criteria.recommendedLimit,
            riskTier = criteria.tier
        )
    }
}
\`\`\`

#### Verification Contract
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| \`verifiedIncome\` | \`BigDecimal\` | Yes | Net monthly income verified via bank statement |
| \`totalObligations\` | \`BigDecimal\` | Yes | Active monthly EMI obligations |
| \`isEligible\` | \`Boolean\` | Return | Status determination based on risk threshold |
`;

export function App() {
  const [selectedService, setSelectedService] = useState<string>(SERVICES[0].id);
  const [queryInput, setQueryInput] = useState<string>('');
  const [isChatActive, setIsChatActive] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatActive) {
      scrollToBottom();
    }
  }, [messages, isChatActive]);

  const handleStartChat = (queryText?: string) => {
    const text = (queryText || queryInput).trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: text.includes('FOUR_WHEELER') || text.toLowerCase().includes('business')
        ? SAMPLE_KOTLIN_RESPONSE
        : `### Details for: ${text}\n\nHere is the documentation and implementation schema found in \`${selectedService}\`:\n\n\`\`\`kotlin\n// Verified contract for ${selectedService}\nfun executeWorkflow(context: ServiceContext): ResponseEntity<AssessmentResponse> {\n    return ResponseEntity.ok(AssessmentResponse.success(context.id))\n}\n\`\`\`\n\n- **Service**: \`${selectedService}\`\n- **Status**: \`200 OK\`\n- **Protocol**: SSE Streaming Response`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'complete',
      sources: [
        {
          file: 'FourWheelerPersonalAssessmentHandler.kt:L12-34',
          docType: 'Kotlin Source',
        },
        {
          file: 'knowledge/api/initiation-application.md',
          docType: 'Markdown Documentation',
        },
      ],
    };

    setMessages([userMessage, assistantMessage]);
    setIsChatActive(true);
    setQueryInput('');
  };

  const handleResetHome = () => {
    setIsChatActive(false);
    setMessages([]);
    setQueryInput('');
  };

  return (
    <div className="min-h-screen bg-[#edf3f8] flex flex-col justify-between p-3 sm:p-5 md:p-8 font-sans antialiased text-slate-800">
      {/* Outer White Card matching Freecharge Biz */}
      <div className="max-w-5xl w-full mx-auto bg-white rounded-[28px] md:rounded-[40px] shadow-sm border border-slate-100 flex flex-col min-h-[92vh] overflow-hidden">
        
        {/* Persistent Top Header matching the image */}
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

          {/* Right Action: Login / Home Toggle */}
          <div className="flex items-center gap-3">
            {isChatActive && (
              <button
                onClick={handleResetHome}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
            )}
            <button
              type="button"
              className="px-6 py-2 rounded-full bg-[#f05a28] hover:bg-[#d94b1c] active:scale-98 text-white text-xs md:text-sm font-semibold shadow-xs transition-all cursor-pointer"
            >
              Login
            </button>
          </div>
        </header>

        {/* Dynamic Body: Home Screen vs Active Chat */}
        {!isChatActive ? (
          /* =========================================================================
             1. HOME SCREEN (Exact match to the user's attached photo)
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
                      {SERVICES.map((s) => (
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
                  className="w-full resize-none bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none py-1"
                />

                {/* Bottom Row: Circular Orange Up-Arrow Send Button */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleStartChat()}
                    disabled={!queryInput.trim()}
                    type="button"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      queryInput.trim()
                        ? 'bg-[#f05a28] text-white shadow-xs hover:bg-[#d94b1c]'
                        : 'bg-orange-100 text-[#f05a28] hover:bg-[#f05a28] hover:text-white'
                    }`}
                    title="Send message"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
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
                <p>Answers are generated from indexed service documentation and may need verification.</p>
                <p className="text-[10px] text-slate-400">FreeCharge Biz · Developer Assistant</p>
              </div>

            </div>
          </main>
        ) : (
          /* =========================================================================
             2. CHAT WINDOW (Supporting text removed, messages above, input shifted to bottom)
             ========================================================================= */
          <main className="flex-1 flex flex-col justify-between p-4 md:p-8 min-w-0 bg-white">
            
            {/* Scrollable Conversation Stream */}
            <div className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full space-y-6 pb-6 pr-1">
              
              {/* Service header indicator */}
              <div className="flex items-center justify-center py-2">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Inspecting: <span className="text-[#f05a28] font-mono">{selectedService}</span>
                </span>
              </div>

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
                          <div className="pt-3 border-t border-slate-200/80">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              Referenced Sources
                            </span>
                            <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
                              {msg.sources.map((src, i) => (
                                <span
                                  key={i}
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-[11px] shadow-2xs"
                                >
                                  {src.file.endsWith('.kt') ? (
                                    <FileCode className="w-3 h-3 text-[#f05a28]" />
                                  ) : (
                                    <BookOpen className="w-3 h-3 text-indigo-500" />
                                  )}
                                  <span>{src.file}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Shifted Bottom Input Box (matching the card design from home screen) */}
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
                      {SERVICES.map((s) => (
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
                  className="w-full resize-none bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none py-1"
                />

                {/* Bottom Row: Circular Orange Up-Arrow Send Button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    Press Enter to send, Shift + Enter for new line
                  </span>
                  <button
                    onClick={() => handleStartChat()}
                    disabled={!queryInput.trim()}
                    type="button"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      queryInput.trim()
                        ? 'bg-[#f05a28] text-white shadow-xs hover:bg-[#d94b1c]'
                        : 'bg-orange-100 text-[#f05a28] hover:bg-[#f05a28] hover:text-white'
                    }`}
                    title="Send message"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>

          </main>
        )}

      </div>
    </div>
  );
}

export default App;
