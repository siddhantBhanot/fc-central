import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileText,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageSquare,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import type { LessonDetail } from '@/types';

interface LessonViewerProps {
  lesson: LessonDetail;
  isLoading: boolean;
  onContinue: () => void;
  onOpenDoubtDrawer: () => void;
  onViewSource: (file: string, service?: string) => void;
  onSubmitCheck: (selectedOptionIndex: number) => Promise<{
    is_correct: boolean;
    correct_option_index: number;
    explanation: string;
  }>;
  isLastLesson: boolean;
  isSidebarCollapsed?: boolean;
}

export function LessonViewer({
  lesson,
  isLoading,
  onContinue,
  onOpenDoubtDrawer,
  onViewSource,
  onSubmitCheck,
  isLastLesson,
  isSidebarCollapsed = false,
}: LessonViewerProps) {
  // Knowledge Check State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmittingCheck, setIsSubmittingCheck] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    is_correct: boolean;
    correct_option_index: number;
    explanation: string;
  } | null>(null);

  const handleCheckSubmit = async () => {
    if (selectedOption === null) return;
    setIsSubmittingCheck(true);
    try {
      const res = await onSubmitCheck(selectedOption);
      setCheckResult(res);
    } catch (e) {
      // ignore
    } finally {
      setIsSubmittingCheck(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
        <div className="relative">
          <Loader2 className="w-8 h-8 text-[#f05a28] animate-spin" />
          <Sparkles className="w-3.5 h-3.5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-slate-800">Synthesizing Guided Lesson...</p>
          <p className="text-xs text-slate-500">
            Grounding concepts in dedicated course context files
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 overflow-y-auto pt-8 md:pt-10 pb-12 md:pb-16 ${
        isSidebarCollapsed
          ? 'px-8 sm:px-14 md:px-16 max-w-5xl xl:max-w-6xl'
          : 'px-6 md:px-12 max-w-4xl'
      } mx-auto w-full space-y-8 animate-in fade-in duration-300`}
    >
      {/* Lesson Header */}
      <div className="space-y-2 pb-6 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#f05a28] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/60">
              Lesson {lesson.lesson_index + 1}
            </span>
            {lesson.is_completed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Completed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isLoading && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f05a28]" />
                Streaming Live
              </span>
            )}
            {lesson.model && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                <Cpu className="w-3 h-3 text-slate-400" />
                {lesson.model}
              </span>
            )}
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          {lesson.title}
        </h1>
        {lesson.summary && (
          <p className="text-sm text-slate-600 leading-relaxed">{lesson.summary}</p>
        )}
      </div>

      {/* Main Markdown Lesson Content */}
      <div className="bg-white text-slate-900 leading-relaxed font-sans text-sm md:text-base relative">
        <MarkdownRenderer content={lesson.content} />
        {isLoading && lesson.content && (
          <span className="inline-block w-2 h-4 ml-1 bg-[#f05a28] animate-pulse align-middle" />
        )}
      </div>


      {/* Key Takeaways Card */}
      {lesson.takeaways && lesson.takeaways.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-200/80 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Lightbulb className="w-4 h-4 text-[#f05a28]" />
            Key Takeaways
          </div>
          <ul className="space-y-2 text-xs md:text-sm text-slate-700">
            {lesson.takeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f05a28] mt-2 shrink-0" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grounded Source Context References */}
      {lesson.sources && lesson.sources.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Dedicated Course Context Files ({lesson.sources.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {lesson.sources.map((src, idx) => (
              <button
                key={idx}
                onClick={() => onViewSource(src.file, lesson.course_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200/80 hover:border-orange-300 text-xs font-medium text-slate-700 hover:text-[#f05a28] transition-colors cursor-pointer"
                title="Click to view full course source document"
              >
                <FileText className="w-3 h-3 text-slate-400" />
                <span>{src.file}</span>
                <span className="text-[10px] text-slate-400">· View Source</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Knowledge Check */}
      {lesson.knowledge_check && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <HelpCircle className="w-4 h-4 text-[#f05a28]" />
            Knowledge Check
          </div>
          <p className="text-xs md:text-sm font-medium text-slate-800">
            {lesson.knowledge_check.question}
          </p>

          <div className="space-y-2">
            {lesson.knowledge_check.options.map((opt, optIdx) => {
              const isSelected = selectedOption === optIdx;
              const isCorrectAnswer = checkResult && checkResult.correct_option_index === optIdx;
              const isWrongSelected =
                checkResult && !checkResult.is_correct && isSelected;

              return (
                <label
                  key={optIdx}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    isCorrectAnswer
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                      : isWrongSelected
                      ? 'bg-rose-50/80 border-rose-300 text-rose-900'
                      : isSelected
                      ? 'bg-orange-50/50 border-[#f05a28] text-slate-900'
                      : 'bg-slate-50/50 hover:bg-white border-slate-200/80 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="knowledge_check"
                    checked={isSelected}
                    onChange={() => {
                      if (!checkResult) setSelectedOption(optIdx);
                    }}
                    disabled={Boolean(checkResult)}
                    className="mt-1 accent-[#f05a28] cursor-pointer"
                  />
                  <span className="text-xs md:text-sm leading-relaxed">{opt}</span>
                </label>
              );
            })}
          </div>

          {!checkResult ? (
            <button
              onClick={handleCheckSubmit}
              disabled={selectedOption === null || isSubmittingCheck}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-[#f05a28] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmittingCheck ? 'Checking...' : 'Submit Answer'}
            </button>
          ) : (
            <div
              className={`p-4 rounded-xl text-xs md:text-sm space-y-1.5 ${
                checkResult.is_correct
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {checkResult.is_correct ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Correct!
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Incorrect
                  </>
                )}
              </div>
              <p className="leading-relaxed">{checkResult.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Sticky-style Action Bar */}
      <div className="pt-6 pb-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Ask a Question Trigger */}
        <button
          onClick={onOpenDoubtDrawer}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
        >
          <MessageSquare className="w-4 h-4 text-[#f05a28]" />
          Ask a Question
          {lesson.doubts && lesson.doubts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
              {lesson.doubts.length}
            </span>
          )}
        </button>

        {/* Continue / Next Lesson CTA */}
        <button
          onClick={onContinue}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#f05a28] hover:bg-[#d94819] text-white text-xs md:text-sm font-semibold shadow-xs transition-transform active:scale-95 cursor-pointer"
        >
          <span>{isLastLesson ? 'Complete Course 🎉' : 'Continue →'}</span>
          {!isLastLesson && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
