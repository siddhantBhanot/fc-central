import React, { useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  Heart,
  History,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Zap,
} from 'lucide-react';
import type { ActionStatus, CustomerRelationship, TransitionActionItem } from '@/types';

interface RMHandoverDashboardProps {
  customer: CustomerRelationship;
  onOpenCustomerView: () => void;
  onUpdateActionStatus: (actionId: string, status: ActionStatus) => Promise<void>;
  onSynthesizeBrief: () => Promise<void>;
  onCompleteHandover: () => Promise<void>;
  isSynthesizing: boolean;
  isCompletingHandover: boolean;
}

export const RMHandoverDashboard: React.FC<RMHandoverDashboardProps> = ({
  customer,
  onOpenCustomerView,
  onUpdateActionStatus,
  onSynthesizeBrief,
  onCompleteHandover,
  isSynthesizing,
  isCompletingHandover,
}) => {
  const [copiedStarter, setCopiedStarter] = useState(false);
  const [updatingActionId, setUpdatingActionId] = useState<string | null>(null);

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

  const completedActionsCount = customer.action_items.filter(
    (a) => a.status === 'completed'
  ).length;

  return (
    <div className="space-y-6">
      
      {/* 4-Pillars Visual Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#97144d]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              The Saathi 4-Pillar Continuity Journey
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Client: <strong className="text-slate-800">{customer.name}</strong> • {customer.tier}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Pillar 1: We Remember */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                1. We Remember
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-slate-900">AI Relationship Brief</p>
            <p className="text-[11px] text-slate-600 leading-snug">
              {customer.interactions.length} CRM touchpoints & family context consolidated
            </p>
          </div>

          {/* Pillar 2: We Ask the Customer */}
          <div
            className={`p-3.5 rounded-2xl border space-y-1 transition-all ${
              customer.feedback?.has_verified
                ? 'bg-emerald-50/70 border-emerald-200/80'
                : 'bg-amber-50/70 border-amber-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-black uppercase tracking-wider ${
                  customer.feedback?.has_verified ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                2. We Ask Customer
              </span>
              {customer.feedback?.has_verified ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              )}
            </div>
            <p className="text-xs font-bold text-slate-900">
              {customer.feedback?.has_verified ? 'Client Confirmed' : 'Verification Sent'}
            </p>
            <p className="text-[11px] text-slate-600 leading-snug">
              {customer.feedback?.has_verified
                ? 'Customer reviewed and added specific notes'
                : 'Waiting for client review on Axis Mobile / Web'}
            </p>
          </div>

          {/* Pillar 3: Warm Intro with Context */}
          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#97144d] tracking-wider">
                3. Warm Intro
              </span>
              <Sparkles className="w-4 h-4 text-[#97144d]" />
            </div>
            <p className="text-xs font-bold text-slate-900">Smart Call Opener</p>
            <p className="text-[11px] text-slate-600 leading-snug">
              “I understand where we are. Let me take this forward.”
            </p>
          </div>

          {/* Pillar 4: Hand Over Responsibility */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider">
                4. Responsibility
              </span>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs font-bold text-slate-900">SLA Action Tracker</p>
            <p className="text-[11px] text-slate-600 leading-snug">
              {completedActionsCount} of {customer.action_items.length} handover tasks fulfilled
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Relationship Brief + Call Opener + Action Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): The AI Relationship Brief */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Executive Relationship Brief Card */}
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

            {/* Sentiment & Overview */}
            {customer.brief && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#97144d] font-bold text-[11px] uppercase tracking-wider">
                    <Heart className="w-3.5 h-3.5" />
                    <span>Client Sentiment & Relationship Philosophy</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {customer.brief.client_sentiment}
                  </p>
                  <p className="text-slate-600 leading-relaxed pt-1">
                    {customer.brief.executive_summary}
                  </p>
                </div>

                {/* Family & Life Stage Priorities */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    Family Context & Life Stage Priorities
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {customer.brief.family_and_lifestage.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs text-slate-700 leading-relaxed"
                      >
                        <span className="text-[#97144d] font-bold mr-1.5">•</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preferences & Communication Nuances */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                    Communication & Working Nuances
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {customer.brief.preferences_and_nuances.map((pref, idx) => (
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
              </div>
            )}
          </div>

          {/* Historical CRM Touchpoints Timeline */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Historical Interactions & CRM Logs ({customer.interactions.length})
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

        {/* Right Column (1 Col): Call Opener + Action Tracker + Customer Verification */}
        <div className="space-y-6">
          
          {/* Smart First-Call Script (The Opener) */}
          <div className="bg-gradient-to-br from-[#97144d] via-[#800e3e] to-[#5a0a2c] text-white rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-100">
                  First-Call Icebreaker Script
                </span>
              </div>
              <button
                onClick={handleCopyStarter}
                className="flex items-center gap-1 text-[11px] font-semibold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="Copy script to clipboard"
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
                Key Talking Points for Call:
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

          {/* Customer Feedback Review Status */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#97144d]" />
                Customer Verification
              </span>
              <button
                onClick={onOpenCustomerView}
                className="text-[11px] font-bold text-[#97144d] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Customer Screen</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {customer.feedback?.has_verified ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Customer Confirmed & Added Context</span>
                </div>
                <p className="text-xs text-slate-700 italic bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                  “{customer.feedback.customer_notes}”
                </p>
                <span className="text-[10px] text-slate-400 block">
                  Verified: {customer.feedback.confirmed_at?.slice(0, 10)}
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <p className="text-xs text-amber-800 font-medium">
                  Customer has not submitted verification yet. You can simulate what the customer sees.
                </p>
                <button
                  onClick={onOpenCustomerView}
                  className="w-full py-2 bg-white hover:bg-amber-100/50 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Simulate Customer Review
                </button>
              </div>
            )}
          </div>

          {/* Open Action Items with SLAs */}
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
    </div>
  );
};
