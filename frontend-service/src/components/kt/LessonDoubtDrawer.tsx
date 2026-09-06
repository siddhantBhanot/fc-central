import { useState } from 'react';
import {
  HelpCircle,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import type { LessonDoubt } from '@/types';

interface LessonDoubtDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
  doubts: LessonDoubt[];
  onAskDoubt: (question: string) => Promise<void>;
  isAsking: boolean;
}

const SUGGESTED_DOUBTS = [
  'Can you explain this with a simpler analogy?',
  'Why is this component decoupled from the rest of the flow?',
  'What are the common edge cases or errors here?',
];

export function LessonDoubtDrawer({
  isOpen,
  onClose,
  lessonTitle,
  doubts,
  onAskDoubt,
  isAsking,
}: LessonDoubtDrawerProps) {
  const [questionInput, setQuestionInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!questionInput.trim() || isAsking) return;
    const q = questionInput.trim();
    setQuestionInput('');
    await onAskDoubt(q);
  };

  const handleSelectSuggested = (q: string) => {
    setQuestionInput(q);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#f05a28]" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ask a Question
              </h3>
              <p className="text-xs font-semibold text-slate-900 truncate max-w-xs">
                {lessonTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Doubts Thread Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {doubts.length === 0 && !isAsking ? (
            <div className="p-8 text-center space-y-3 rounded-2xl bg-slate-50/50 border border-slate-100">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto stroke-[1.5]" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">Have a doubt about this lesson?</p>
                <p className="text-[11px] text-slate-500">
                  Ask any question. The assistant will answer using the dedicated course context without affecting your course progress.
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="pt-2 space-y-1.5 text-left">
                <p className="text-[10px] font-bold uppercase text-slate-400">Quick Doubts:</p>
                {SUGGESTED_DOUBTS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSuggested(suggestion)}
                    className="w-full text-left p-2 rounded-lg bg-white hover:bg-orange-50 border border-slate-200/80 hover:border-orange-300 text-[11px] text-slate-700 hover:text-[#f05a28] transition-colors cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {doubts.map((doubt) => (
                <div key={doubt.id} className="space-y-2">
                  {/* User Question */}
                  <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs font-semibold text-slate-800">{doubt.question}</p>
                  </div>

                  {/* Assistant Answer */}
                  <div className="flex items-start gap-2.5 bg-orange-50/30 p-4 rounded-xl border border-orange-100 text-slate-900 text-xs leading-relaxed">
                    <Sparkles className="w-4 h-4 text-[#f05a28] mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-2 relative">
                      {doubt.answer ? (
                        <MarkdownRenderer content={doubt.answer} />
                      ) : (
                        <div className="text-slate-400 italic flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f05a28]" />
                          <span>Synthesizing answer from course documentation...</span>
                        </div>
                      )}
                      {isAsking && doubt.id.startsWith('doubt-') && doubt.answer && (
                        <span className="inline-block w-1.5 h-3 ml-1 bg-[#f05a28] animate-pulse align-middle" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Footer */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 bg-white">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Ask a doubt about this lesson..."
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              disabled={isAsking}
              className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#f05a28] focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={!questionInput.trim() || isAsking}
              className="absolute right-1.5 p-1.5 rounded-lg bg-[#f05a28] text-white disabled:opacity-40 hover:bg-[#d94819] transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
