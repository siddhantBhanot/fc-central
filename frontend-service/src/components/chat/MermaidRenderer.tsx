import React, { useEffect, useState, useId } from 'react';
import mermaid from 'mermaid';
import { Copy, Check, Code, Eye, Workflow, AlertCircle } from 'lucide-react';

interface MermaidRendererProps {
  chart: string;
}

let mermaidInitialized = false;

function initMermaid() {
  if (mermaidInitialized) return;
  try {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'neutral',
      themeVariables: {
        primaryColor: '#fff7ed', // orange-50
        primaryTextColor: '#1e293b', // slate-800
        primaryBorderColor: '#f97316', // orange-500
        lineColor: '#64748b', // slate-500
        secondaryColor: '#f8fafc', // slate-50
        tertiaryColor: '#f1f5f9', // slate-100
        noteBkgColor: '#fef3c7',
        noteTextColor: '#78350f',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
        fontSize: '13px',
      },
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    });
    mermaidInitialized = true;
  } catch (err) {
    console.error('Failed to initialize mermaid:', err);
  }
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({ chart }) => {
  const reactId = useId();
  // Generate clean DOM-compatible ID
  const elementId = 'mermaid-' + reactId.replace(/[^a-zA-Z0-9_-]/g, '');

  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    initMermaid();
    let isCancelled = false;

    const renderChart = async () => {
      const cleanChart = chart.trim();
      if (!cleanChart) {
        setSvg('');
        setIsRendering(false);
        return;
      }

      setIsRendering(true);
      setError(null);

      try {
        // Unique container ID per render cycle to avoid Mermaid collision
        const uniqueRenderId = `${elementId}-${Date.now()}`;
        const { svg: renderedSvg } = await mermaid.render(uniqueRenderId, cleanChart);
        if (!isCancelled) {
          setSvg(renderedSvg);
          setError(null);
          setIsRendering(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('Mermaid syntax error or streaming incomplete:', err);
          setError(err?.message || 'Invalid or incomplete diagram definition');
          setIsRendering(false);
        }
        // Remove any temporary error element created by Mermaid in body
        const errEl = document.querySelector(`[id^="d${elementId}"]`);
        if (errEl) {
          errEl.remove();
        }
      }
    };

    renderChart();

    return () => {
      isCancelled = true;
    };
  }, [chart, elementId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If there's an error (e.g. malformed syntax or token streaming midway),
  // fallback gracefully to showing the code with an indicator instead of breaking
  if (error && !svg) {
    return (
      <div className="my-4 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200/60 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Diagram Preview (Draft)</span>
          </div>
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <pre className="text-xs font-mono text-slate-700 overflow-x-auto whitespace-pre p-2 bg-white/80 rounded-lg border border-amber-100">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div className="my-4 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-200/80 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Workflow className="w-4 h-4 text-[#f05a28]" />
          <span>Architecture & Flow Diagram</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle between rendered diagram and code */}
          <button
            onClick={() => setShowCode(!showCode)}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors text-[11px] font-medium cursor-pointer shadow-2xs"
            title={showCode ? 'View Diagram' : 'View Code'}
          >
            {showCode ? (
              <>
                <Eye className="w-3.5 h-3.5 text-[#f05a28]" />
                <span>Diagram</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5 text-slate-500" />
                <span>Source</span>
              </>
            )}
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors text-[11px] font-medium cursor-pointer shadow-2xs"
            title="Copy Mermaid code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-6 bg-linear-to-b from-white to-slate-50/40">
        {showCode ? (
          <div className="rounded-xl overflow-hidden border border-slate-700/60 bg-[#1e2433]">
            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
              {chart}
            </pre>
          </div>
        ) : isRendering && !svg ? (
          <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
            <div className="w-4 h-4 border-2 border-[#f05a28] border-t-transparent rounded-full animate-spin" />
            <span>Rendering diagram...</span>
          </div>
        ) : (
          <div
            className="w-full overflow-x-auto flex justify-center items-center py-2 [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:mx-auto transition-opacity duration-200"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
    </div>
  );
};

export default MermaidRenderer;
