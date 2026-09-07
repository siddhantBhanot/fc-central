import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  Heart,
  HelpCircle,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { CustomerRelationship } from '@/types';

interface CustomerContinuityModalProps {
  customer: CustomerRelationship;
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (notes: string) => Promise<void>;
}

export const CustomerContinuityModal: React.FC<CustomerContinuityModalProps> = ({
  customer,
  isOpen,
  onClose,
  onSubmitFeedback,
}) => {
  const [customNotes, setCustomNotes] = useState(
    customer.feedback?.customer_notes || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(customer.feedback?.has_verified || false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNotes.trim()) {
      setError('Please add a note or confirmation for your new Relationship Manager.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmitFeedback(customNotes);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-xl w-full my-6 overflow-hidden flex flex-col">
        
        {/* Header with Axis Burgundy styling */}
        <div className="bg-gradient-to-br from-[#97144d] via-[#800e3e] to-[#4a0823] text-white p-6 sm:p-7 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold tracking-widest uppercase bg-white/15 px-2.5 py-0.5 rounded-full text-white/90 border border-white/20">
              Axis Bank Saathi • Client Continuity
            </span>
            <span className="text-[10px] font-semibold text-rose-200">
              {customer.tier}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
            “Your RM is changing. But your relationship stays.”
          </h2>
          <p className="text-xs text-rose-100/90 leading-relaxed max-w-md">
            Here is what Axis Bank remembers and understands about you. Is there anything we have missed?
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-slate-50/40">
          
          {/* Handover Introduction Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Relationship Handover</span>
              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                Client ID: {customer.account_number_masked}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                  Outgoing RM
                </span>
                <p className="font-bold text-slate-800">{customer.previous_rm_name}</p>
                <p className="text-[11px] text-slate-500 leading-snug">{customer.transfer_reason}</p>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1">
                <span className="text-[10px] font-semibold uppercase text-[#97144d] block font-bold">
                  Your New Assigned RM
                </span>
                <p className="font-bold text-[#97144d]">{customer.new_rm_name}</p>
                <p className="text-[11px] text-slate-600">{customer.new_rm_role}</p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-[#97144d]" /> {customer.new_rm_phone}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* What Axis Remembers (Grounding Context) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-[#97144d]" />
              <span>What Axis Remembers About You</span>
            </div>

            <div className="space-y-2">
              {customer.brief?.family_and_lifestage.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs text-xs text-slate-700"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}

              {customer.brief?.preferences_and_nuances.map((pref, idx) => (
                <div
                  key={`pref-${idx}`}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs text-xs text-slate-700"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{pref}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Commitments in Motion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Active Commitments Under Handover</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">
                {customer.action_items.length} ongoing requests
              </span>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl bg-white border border-slate-200/80 overflow-hidden">
              {customer.action_items.map((act) => (
                <div key={act.id} className="p-3 text-xs flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800 block">{act.title}</span>
                    <span className="text-[11px] text-slate-500">{act.description}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      act.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {act.status === 'completed' ? 'Completed' : `Due ${act.sla_date}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Confirmation Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <HelpCircle className="w-4 h-4 text-[#97144d]" />
              <span>Is there anything we missed? Tell your new RM:</span>
            </div>

            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Please also note that I am traveling to London next week, or my daughter needs help with tuition fee wire transfer..."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#97144d]/30 focus:border-[#97144d] bg-slate-50/50 resize-none"
            />

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {submitted && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold">
                  Thank you! Your inputs have been verified and synced directly with {customer.new_rm_name}.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#97144d] hover:bg-[#800e3e] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Syncing with Axis Continuity Engine...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm & Update My RM Handover Brief</span>
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
