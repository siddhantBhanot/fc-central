import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Flame,
  Heart,
  History,
  MessageCircle,
  PhoneCall,
  RefreshCw,
  Repeat,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from 'lucide-react';
import type { ActionStatus, CustomerRelationship, TransitionActionItem } from '@/types';
import { CommitmentsDashboard } from './CommitmentsDashboard';
import { AskSaathiDrawer } from './AskSaathiDrawer';
import { RelationshipTimelineView } from './RelationshipTimelineView';
import { PreCallBriefModal } from './PreCallBriefModal';
import { ManagementSummaryModal } from './ManagementSummaryModal';

interface RMHandoverDashboardProps {
  customer: CustomerRelationship;
  onOpenCustomerView: () => void;
  onUpdateActionStatus: (actionId: string, status: ActionStatus) => Promise<void>;
  onSynthesizeBrief: () => Promise<void>;
  onCompleteHandover: () => Promise<void>;
  onRefreshCustomer: () => Promise<void>;
  isSynthesizing: boolean;
  isCompletingHandover: boolean;
}

export const RMHandoverDashboard: React.FC<RMHandoverDashboardProps> = ({
  customer,
  onOpenCustomerView,
  onUpdateActionStatus,
  onSynthesizeBrief,
  onCompleteHandover,
  onRefreshCustomer,
  isSynthesizing,
  isCompletingHandover,
}) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'commitments' | 'ask' | 'timeline'>('brief');
  const [copiedStarter, setCopiedStarter] = useState(false);
  const [updatingActionId, setUpdatingActionId] = useState<string | null>(null);
  const [isPreCallOpen, setIsPreCallOpen] = useState(false);
  const [isMgmtOpen, setIsMgmtOpen] = useState(false);

  const handleCopyStarter = () => {
    if (customer.brief?.conversation_starter) {
      navigator.clipboard.writeText(customer.brief.conversation_starter);
      setCopiedStarter(true);
      setTimeout(() => setCopiedStarter(false), 2000);
    }
  };

  const handleToggleAction = async (action: TransitionActionItem) => {
    const nextStatus: ActionStatus =
      action.status === 'completed'
        ? 'pending'
        : action.status === 'pending'
        ? 'in_progress'
        : 'completed';

    setUpdatingActionId(action.id);
    try {
      await onUpdateActionStatus(action.id, nextStatus);
    } finally {
      setUpdatingActionId(null);
    }
  };

  const health = customer.health;

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Relationship Health & Attention View (Section 19) */}
      {health && (
        <div
          className={`p-4 rounded-3xl border transition-all ${
            health.level === 'immediate_attention'
              ? 'bg-rose-50/80 border-rose-300 text-rose-950'
              : health.level === 'attention_required'
              ? 'bg-amber-50/80 border-amber-300 text-amber-950'
              : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
          }`}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    health.level === 'immediate_attention'
                      ? 'bg-rose-600 animate-pulse'
                      : health.level === 'attention_required'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Relationship Health • {health.level.replace('_', ' ')}
                </span>
              </div>
              <h4 className="text-xs font-bold">{health.headline}</h4>
              <ul className="space-y-0.5 pt-1 text-[11px]">
                {health.reasons.map((r, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsPreCallOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white text-[#97144d] hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#97144d]" />
                <span>2-Min Pre-Call Brief</span>
              </button>

              <button
                onClick={() => setIsMgmtOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Management Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Experience Tab Switcher (Section 3 & 25) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('brief')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'brief'
                ? 'bg-white text-[#97144d] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Relationship Brief</span>
          </button>

          <button
            onClick={() => setActiveTab('commitments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'commitments'
                ? 'bg-white text-[#97144d] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>What We Owe ({customer.commitments?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('ask')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ask'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Ask Saathi (AI)</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCustomerView}
            className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-[#97144d] hover:bg-rose-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Customer View Simulation</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Relationship Brief & Handover Cockpit */}
      {activeTab === 'brief' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (2 Cols): Comprehensive AI Relationship Brief */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* The Brief Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-[#97144d] flex items-center justify-center font-black text-sm">
                    AI
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">AI-Synthesized Relationship Brief</h3>
                    <p className="text-[11px] text-slate-500">
                      Grounded in {customer.tenure_years} years of CRM notes, calls, and service history
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onSynthesizeBrief}
                    disabled={isSynthesizing}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Regenerate brief using Bedrock / Groq LLM"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin text-[#97144d]' : ''}`} />
                    <span>{isSynthesizing ? 'Synthesizing...' : 'Refresh Brief'}</span>
                  </button>
                </div>
              </div>

              {customer.brief && (
                <div className="space-y-4 text-xs">
                  {/* Executive Overview */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="flex items-center gap-1.5 text-[#97144d] font-bold text-[11px] uppercase tracking-wider">
                      <Heart className="w-3.5 h-3.5" />
                      <span>Executive Overview & Client Sentiment</span>
                    </div>
                    <p className="text-slate-800 font-semibold leading-relaxed">
                      {customer.brief.client_sentiment}
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      {customer.brief.executive_summary}
                    </p>
                  </div>

                  {/* Customer Priorities (Section 5) */}
                  {customer.brief.customer_priorities && customer.brief.customer_priorities.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        Customer Priorities
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {customer.brief.customer_priorities.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs text-slate-700 leading-relaxed"
                          >
                            <span className="text-orange-500 font-bold mr-1.5">•</span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferences (Section 5) */}
                  {customer.brief.explicit_preferences && customer.brief.explicit_preferences.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                        Explicit Preferences
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {customer.brief.explicit_preferences.map((pref, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/70 text-slate-700 leading-relaxed"
                          >
                            <span className="text-blue-600 font-bold mr-1.5">✓</span>
                            {pref}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Open Threads & Customer Concerns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {customer.brief.current_conversations && customer.brief.current_conversations.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-blue-800 tracking-wider block">
                          Current Conversations
                        </span>
                        <ul className="space-y-1 text-[11px] text-slate-700">
                          {customer.brief.current_conversations.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-blue-500 font-bold">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {customer.brief.customer_concerns && customer.brief.customer_concerns.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-[#97144d] tracking-wider block">
                          Customer Concerns & Frustrations
                        </span>
                        <ul className="space-y-1 text-[11px] text-slate-700">
                          {customer.brief.customer_concerns.map((c, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-rose-500 font-bold">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Section 18: Don't Make the Customer Repeat Themselves */}
                  {customer.brief.dont_repeat_items && customer.brief.dont_repeat_items.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                        <Repeat className="w-3.5 h-3.5 text-amber-600" />
                        <span>“Don’t Make the Customer Repeat Themselves” (Already Explained by Customer)</span>
                      </div>
                      <ul className="space-y-1 text-xs text-amber-950">
                        {customer.brief.dont_repeat_items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-600 font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Historical CRM Interactions Snippet */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Historical CRM Interactions ({customer.interactions.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Chronological provenance</span>
              </div>

              <div className="divide-y divide-slate-100 space-y-2">
                {customer.interactions.map((int) => (
                  <div key={int.id} className="pt-3 first:pt-0 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{int.channel}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">Recorded by {int.rm_name}</span>
                      </div>
                      <span className="font-mono text-slate-400">{int.date}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{int.summary}</p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {int.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (1 Col): First-Call Opener & Action Board */}
          <div className="space-y-6">
            
            {/* First-Call Conversation Starter (Section 11 & 12) */}
            <div className="bg-gradient-to-br from-[#97144d] via-[#800e3e] to-[#5a0a2c] text-white rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-100">
                    First-Call Opener
                  </span>
                </div>
                <button
                  onClick={handleCopyStarter}
                  className="flex items-center gap-1 text-[11px] font-semibold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="Copy script"
                >
                  {copiedStarter ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <blockquote className="text-xs italic text-rose-50 leading-relaxed bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-xs">
                “{customer.brief?.conversation_starter}”
              </blockquote>

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 block">
                  Key Talking Points:
                </span>
                <ul className="space-y-1 text-xs text-rose-100">
                  {customer.brief?.talking_points.map((tp, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-300 font-bold">•</span>
                      <span>{tp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Handover Action Items */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800">Handover Action Tracker</h4>
                  <p className="text-[11px] text-slate-500">
                    {customer.action_items.filter((a) => a.status === 'completed').length} /{' '}
                    {customer.action_items.length} fulfilled
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Assigned to {customer.new_rm_name.split(' ')[0]}
                </span>
              </div>

              <div className="space-y-2.5">
                {customer.action_items.map((act) => {
                  const isDone = act.status === 'completed';
                  const isUpdating = updatingActionId === act.id;

                  return (
                    <div
                      key={act.id}
                      onClick={() => handleToggleAction(act)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isUpdating
                          ? 'opacity-50 pointer-events-none'
                          : isDone
                          ? 'bg-slate-50/60 border-slate-200/60 opacity-60'
                          : act.priority === 'high'
                          ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 mt-0.5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white hover:border-[#97144d]'
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3" />}
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-bold leading-tight ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            {act.title}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0 ${
                              act.priority === 'high'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {act.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{act.description}</p>
                        <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-400 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>SLA: {act.sla_date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Complete Handover Button */}
              <button
                onClick={onCompleteHandover}
                disabled={isCompletingHandover || customer.status === 'handover_active'}
                className="w-full py-2.5 px-4 bg-[#97144d] hover:bg-[#800e3e] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {customer.status === 'handover_active' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Relationship Handover Active</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Acknowledge & Activate Handover</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: What We Owe (Commitments Dashboard) */}
      {activeTab === 'commitments' && (
        <CommitmentsDashboard
          customer={customer}
          onRefreshCustomer={onRefreshCustomer}
        />
      )}

      {/* Tab 3: Natural-Language Ask Saathi */}
      {activeTab === 'ask' && (
        <AskSaathiDrawer customer={customer} />
      )}

      {/* Tab 4: Relationship Timeline */}
      {activeTab === 'timeline' && (
        <RelationshipTimelineView customer={customer} />
      )}

      {/* Modals */}
      <PreCallBriefModal
        customer={customer}
        isOpen={isPreCallOpen}
        onClose={() => setIsPreCallOpen(false)}
      />

      <ManagementSummaryModal
        customer={customer}
        isOpen={isMgmtOpen}
        onClose={() => setIsMgmtOpen(false)}
      />

    </div>
  );
};
