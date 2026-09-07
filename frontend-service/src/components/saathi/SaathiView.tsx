import React, { useEffect, useState } from 'react';
import {
  Loader2,
  RotateCcw,
  Sparkles,
  User,
} from 'lucide-react';
import apiClient from '@/lib/api/client';
import type {
  ActionStatus,
  CustomerRelationship,
  CustomerSummaryDTO,
} from '@/types';
import { RMHandoverDashboard } from './RMHandoverDashboard';
import { CustomerContinuityModal } from './CustomerContinuityModal';

export const SaathiView: React.FC = () => {
  const [customerSummaries, setCustomerSummaries] = useState<CustomerSummaryDTO[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeCustomer, setActiveCustomer] = useState<CustomerRelationship | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isCompletingHandover, setIsCompletingHandover] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Load list of customers
  const loadCustomers = async () => {
    try {
      const list = await apiClient.listSaathiCustomers();
      setCustomerSummaries(list);
      if (list.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load Saathi customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load detailed customer relationship profile
  const loadCustomerDetail = async (id: string) => {
    try {
      const data = await apiClient.getSaathiCustomer(id);
      setActiveCustomer(data);
    } catch (err) {
      console.error(`Failed to load customer ${id}:`, err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerDetail(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const handleSynthesizeBrief = async () => {
    if (!selectedCustomerId) return;
    setIsSynthesizing(true);
    try {
      await apiClient.synthesizeSaathiBrief(selectedCustomerId);
      await loadCustomerDetail(selectedCustomerId);
    } catch (err) {
      console.error('Failed to synthesize brief:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleUpdateActionStatus = async (actionId: string, status: ActionStatus) => {
    if (!selectedCustomerId) return;
    try {
      await apiClient.updateSaathiAction(selectedCustomerId, actionId, status);
      await loadCustomerDetail(selectedCustomerId);
      await loadCustomers();
    } catch (err) {
      console.error('Failed to update action status:', err);
    }
  };

  const handleCompleteHandover = async () => {
    if (!selectedCustomerId) return;
    setIsCompletingHandover(true);
    try {
      await apiClient.completeSaathiHandover(selectedCustomerId);
      await loadCustomerDetail(selectedCustomerId);
      await loadCustomers();
    } catch (err) {
      console.error('Failed to complete handover:', err);
    } finally {
      setIsCompletingHandover(false);
    }
  };

  const handleSubmitCustomerFeedback = async (notes: string) => {
    if (!selectedCustomerId) return;
    await apiClient.submitSaathiFeedback(selectedCustomerId, notes);
    await loadCustomerDetail(selectedCustomerId);
    await loadCustomers();
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await apiClient.resetSaathiDemo();
      await loadCustomers();
      if (selectedCustomerId) {
        await loadCustomerDetail(selectedCustomerId);
      }
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 text-[#97144d] animate-spin" />
        <p className="text-xs font-semibold text-slate-600">
          Loading Axis Saathi Relationship Continuity Engine...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
      
      {/* Saathi Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#97144d] via-[#800e3e] to-[#4a0823] text-white p-6 sm:p-8 shadow-lg relative overflow-hidden">
        {/* Background Accent Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold tracking-wider text-rose-100 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Customer Delight & RM Handover Continuity</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Saathi <span className="text-rose-200 font-normal">| साथी</span>
            </h1>

            <p className="text-sm text-rose-100/90 leading-relaxed font-medium">
              “A relationship that stays, even when people change.”
            </p>

            <p className="text-xs text-rose-200/80 leading-relaxed">
              When an RM resigns, transfers, or changes roles, Axis automatically activates the Relationship Continuity journey. We turn years of scattered CRM interactions into an AI Relationship Brief, verify priorities with the customer, and ensure zero dropped requests.
            </p>
          </div>

          {/* Quick Metrics & Reset */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-2xl px-4 py-2.5 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black text-xs">
                40%
              </div>
              <div className="text-left">
                <span className="text-[10px] text-rose-200 uppercase font-bold block">Industry RM Attrition</span>
                <span className="text-xs font-bold text-white">Safeguarded by Saathi</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white text-[#97144d] hover:bg-rose-50 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Simulate Customer View</span>
              </button>

              <button
                onClick={handleResetDemo}
                disabled={isResetting}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Reset demo scenarios"
              >
                <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Transition Selector Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            Active Customer Transitions ({customerSummaries.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Select a customer to view their continuity brief and handover dashboard
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {customerSummaries.map((c) => {
            const isSelected = selectedCustomerId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCustomerId(c.id)}
                className={`p-4 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-white border-[#97144d] shadow-sm ring-2 ring-[#97144d]/10'
                    : 'bg-white/70 hover:bg-white border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${c.avatar_color} text-white flex items-center justify-center font-black text-xs shadow-2xs`}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {c.name}
                      </h4>
                      <span className="text-[10px] text-slate-500">{c.city}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      c.tier === 'Burgundy Private'
                        ? 'bg-purple-100 text-purple-800'
                        : c.tier === 'NRI Elite'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-[#97144d]'
                    }`}
                  >
                    {c.tier}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-800">{c.aum_display}</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {c.pending_actions_count} actions pending
                  </span>
                </div>

                {isSelected && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#97144d]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RM Handover Dashboard */}
      {activeCustomer ? (
        <RMHandoverDashboard
          customer={activeCustomer}
          onOpenCustomerView={() => setIsCustomerModalOpen(true)}
          onUpdateActionStatus={handleUpdateActionStatus}
          onSynthesizeBrief={handleSynthesizeBrief}
          onCompleteHandover={handleCompleteHandover}
          isSynthesizing={isSynthesizing}
          isCompletingHandover={isCompletingHandover}
        />
      ) : (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          Select a customer to view the Saathi Relationship Brief.
        </div>
      )}

      {/* Customer Review Modal */}
      {activeCustomer && (
        <CustomerContinuityModal
          customer={activeCustomer}
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSubmitFeedback={handleSubmitCustomerFeedback}
        />
      )}

    </div>
  );
};
