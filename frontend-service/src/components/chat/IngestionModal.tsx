import { useState } from 'react';
import { AlertCircle, CheckCircle2, Database, Loader2, RefreshCw, X } from 'lucide-react';
import apiClient from '@/lib/api/client';
import type { KnowledgeIngestResponse } from '@/types';

interface IngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: string;
  onSuccess?: (result: KnowledgeIngestResponse) => void;
}

export function IngestionModal({
  isOpen,
  onClose,
  service,
  onSuccess,
}: IngestionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<KnowledgeIngestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTriggerIngest = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.triggerKnowledgeIngestion(service);
      setResult(response);
      if (onSuccess) onSuccess(response);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger knowledge ingestion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#f05a28] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Knowledge Ingestion</h3>
              <p className="text-[11px] text-slate-500 font-mono">{service}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Trigger semantic chunking and neural embeddings for <strong className="text-slate-900 font-mono">{service}</strong>. Vectors are persisted into your Qdrant Cloud collection.
        </p>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {result && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Ingestion Completed Successfully!</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 font-mono">
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">FILES INGESTED</span>
                <span className="text-sm font-bold text-slate-800">{result.total_files}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block">CHUNKS INDEXED</span>
                <span className="text-sm font-bold text-[#f05a28]">{result.total_chunks}</span>
              </div>
            </div>
            {result.files_indexed && result.files_indexed.length > 0 && (
              <div className="pt-2 text-[11px] text-slate-500 font-mono">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Indexed files:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {result.files_indexed.map((f, i) => (
                    <li key={i} className="truncate">{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            {result ? 'Done' : 'Cancel'}
          </button>
          <button
            onClick={handleTriggerIngest}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-[#f05a28] hover:bg-[#d94b1c] text-white rounded-full shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Ingesting Chunks...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{result ? 'Re-index Again' : 'Start Ingestion'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
