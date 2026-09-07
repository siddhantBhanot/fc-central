import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Loader2,
  MessageSquare,
  Search,
  Sparkles,
  Tag,
} from 'lucide-react';
import apiClient from '@/lib/api/client';
import type { AskSaathiResponse, CustomerRelationship } from '@/types';

interface AskSaathiDrawerProps {
  customer: CustomerRelationship;
}

const SUGGESTED_QUESTIONS = [
  'Did we promise any concessions for overseas tuition?',
  'What was the customer discussing with the previous RM?',
  'What are the customer’s current priorities?',
  'What are the customer’s communication preferences?',
  'What issues are currently unresolved and what do we owe?',
  'Why was the customer sensitive during the loan review?',
];

export const AskSaathiDrawer: React.FC<AskSaathiDrawerProps> = ({ customer }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [answer, setAnswer] = useState<AskSaathiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (questionText: string) => {
    if (!questionText.trim()) return;
    setIsLoading(true);
    setError(null);
    setQuery(questionText);
    try {
      const resp = await apiClient.askSaathi(customer.id, questionText);
      setAnswer(resp);
    } catch (err: any) {
      setError(err?.message || 'Failed to get answer from Saathi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-sm">
            <Sparkles className="w-4 h-4 text-purple-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ask Saathi — Relationship Intelligence</h3>
            <p className="text-[11px] text-slate-500">
              Grounded strictly in {customer.name}’s historical touchpoints, commitments, and recorded facts.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
          Anti-Hallucination Guardrails Active
        </span>
      </div>

      {/* Search Input */}
      <div className="space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask anything about ${customer.name} (e.g. 'Did we promise any concessions?')`}
            className="w-full pl-10 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#97144d]/20 focus:border-[#97144d] transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 px-4 py-1.5 bg-[#97144d] hover:bg-[#800e3e] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Ask</span>}
            <ArrowRight className="w-3 h-3" />
          </button>
        </form>

        {/* Suggested Quick Prompt Chips */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Suggested RM Queries:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(q)}
                disabled={isLoading}
                className="px-2.5 py-1 bg-slate-100/80 hover:bg-rose-50 text-slate-700 hover:text-[#97144d] border border-slate-200/60 hover:border-rose-200 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-left"
              >
                “{q}”
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Answer Container */}
      {isLoading && (
        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center space-y-2 text-center">
          <Loader2 className="w-6 h-6 text-[#97144d] animate-spin" />
          <p className="text-xs font-semibold text-slate-600">
            Consulting customer interaction memory & checking commitment logs...
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {answer && !isLoading && (
        <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-4 animate-in fade-in duration-200">
          
          {/* Answer Header & Distinction Badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#97144d]" />
              <span className="text-xs font-bold text-slate-800">Answer:</span>
            </div>

            {/* Commitment vs Discussion Distinction Badge */}
            {answer.is_commitment && (
              <div>
                {answer.commitment_type === 'confirmed_commitment' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Confirmed Promise / SLA
                  </span>
                ) : answer.commitment_type === 'discussed_possibility' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                    <HelpCircle className="w-3 h-3 text-amber-600" />
                    Discussed Possibility (No Promise Made)
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Answer Text */}
          <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line bg-white p-4 rounded-xl border border-slate-200/70 shadow-2xs">
            {answer.answer}
          </p>

          {/* Inspectable Evidence & Citations */}
          {answer.evidence && answer.evidence.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-slate-200/60">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                Supporting Historical Evidence ({answer.evidence.length}):
              </span>

              <div className="grid grid-cols-1 gap-2">
                {answer.evidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-slate-700">
                        {ev.channel} • {ev.rm_name}
                      </span>
                      <span className="font-mono">{ev.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      “{ev.snippet}”
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {answer.drilldown_context && (
            <div className="text-[10px] text-slate-400 text-right">
              {answer.drilldown_context}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
