import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Code2, FileCode } from 'lucide-react';
import type { SourceCitation } from '@/types';

interface SourceCitationListProps {
  sources: SourceCitation[];
}

export function SourceCitationList({ sources }: SourceCitationListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="pt-3 border-t border-slate-200/80">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <span>Verified Citations ({sources.length})</span>
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {sources.map((src, i) => {
          const isExpanded = expandedIndex === i;
          const fileName = src.file.split('/').pop() || src.file;
          const isKotlin = fileName.endsWith('.kt') || fileName.endsWith('.kts') || src.doc_type === 'kotlin' || src.docType === 'Kotlin Source';
          const endpoint = src.endpoint;
          const className = src.class_name || src.class;
          const startLine = src.start_line ?? src.lineNumber;
          const endLine = src.end_line;
          const lineStr = startLine ? (endLine && endLine !== startLine ? `L${startLine}-${endLine}` : `L${startLine}`) : null;
          const snippet = src.snippet || src.contentSnippet;

          return (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all hover:border-slate-300"
            >
              <div
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
                className="flex items-center justify-between px-3 py-2 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* File Icon */}
                  <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0">
                    {isKotlin ? (
                      <FileCode className="w-3.5 h-3.5 text-[#f05a28]" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                  </div>

                  {/* File Name & Path */}
                  <span className="font-mono text-xs font-semibold text-slate-800 truncate" title={src.file}>
                    {fileName}
                  </span>

                  {/* Line numbers pill */}
                  {lineStr && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {lineStr}
                    </span>
                  )}

                  {/* REST endpoint pill */}
                  {endpoint && (
                    <span className="shrink-0 hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Code2 className="w-2.5 h-2.5" />
                      <span>{endpoint}</span>
                    </span>
                  )}

                  {/* Class name pill */}
                  {className && (
                    <span className="shrink-0 hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-orange-50 text-[#f05a28] border border-orange-200 truncate max-w-[160px]">
                      {className}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pl-2 text-slate-400">
                  {snippet && (
                    isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>

              {/* Expandable Snippet Preview */}
              {isExpanded && snippet && (
                <div className="px-3 py-2.5 bg-slate-900 text-slate-100 text-xs font-mono border-t border-slate-200 overflow-x-auto">
                  <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                    <span>File: {src.file}</span>
                    {lineStr && <span>Lines: {lineStr}</span>}
                  </div>
                  <pre className="text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap">
                    {snippet}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
