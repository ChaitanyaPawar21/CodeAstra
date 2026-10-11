import { useState } from 'react';
import { FileCode2, Play, Sparkles, FolderTree } from 'lucide-react';
import { useAnalysis } from '../../analysis/hooks/useAnalysis';

export default function CodeAnalysisPage() {
  const { analysisData, repoUrl } = useAnalysis();
  const cleanRepoUrl = repoUrl.trim().replace(/\/+$/, '').replace(/\.git$/, '');

  const criticalFiles = analysisData?.criticalFiles ?? [];
  const nodes = analysisData?.dependencyGraph?.nodes ?? [];
  const folders = analysisData?.folderHierarchy ?? [];

  const defaultFileName = criticalFiles[0]?.name || nodes[0]?.label || 'README.md';
  const [selectedFileName, setSelectedFileName] = useState(defaultFileName);

  const selectedNode = nodes.find((n) => n.label === selectedFileName || n.id === selectedFileName);
  const selectedCritical = criticalFiles.find((c) => c.name === selectedFileName);
  const language = selectedNode?.language || 'Source';

  const incomingId = selectedNode?.importedBy?.[0];
  const outgoingId = selectedNode?.imports?.[0];
  const incomingLabel = incomingId ? (nodes.find((n) => n.id === incomingId)?.label || incomingId) : null;
  const outgoingLabel = outgoingId ? (nodes.find((n) => n.id === outgoingId)?.label || outgoingId) : null;

  const codeLines = selectedNode
    ? [
        `/**`,
        ` * Code Analysis: ${selectedFileName}`,
        ` * Layer: ${selectedNode.type} | Language: ${language} | LOC: ${selectedNode.loc ?? 'N/A'}`,
        ` * ${selectedNode.layerReason || selectedCritical?.importance || 'Repository module analyzed by CodeAstra'}`,
        ` */`,
        ``,
        `// Internal Imports (${selectedNode.imports?.length ?? 0}):`,
        ...(selectedNode.imports?.length
          ? selectedNode.imports.map((id) => `import { ... } from '${nodes.find((n) => n.id === id)?.label || id}';`)
          : [`// No internal imports detected`]),
        ``,
        `// External Packages (${selectedNode.externalPackages?.length ?? 0}):`,
        ...(selectedNode.externalPackages?.length
          ? selectedNode.externalPackages.map((pkg) => `import * as pkg from '${pkg}';`)
          : [`// No external package dependencies detected`]),
        ``,
        `// Detected Exports (${selectedNode.exports?.length ?? 0}):`,
        ...(selectedNode.exports?.length
          ? selectedNode.exports.map((exp) => `export const ${exp};`)
          : [`// No explicit exports recorded`]),
        ``,
        `// Full repository source: ${cleanRepoUrl}/blob/HEAD/${selectedFileName}`,
      ]
    : [
        `/**`,
        ` * File: ${selectedFileName}`,
        ` * Source code analysis`,
        ` */`,
        `// View full source on GitHub:`,
        `// ${cleanRepoUrl}/blob/HEAD/${selectedFileName}`,
      ];

  const handleOpenSource = () => {
    window.open(`${cleanRepoUrl}/blob/HEAD/${selectedFileName}`, '_blank', 'noreferrer');
  };

  const riskLabel = selectedCritical?.riskLevel || ((selectedNode?.importedBy?.length ?? 0) >= 3 ? 'High' : 'Standard');

  return (
    <div className="h-full flex gap-5 text-slate-300">
      {/* File Explorer Sidebar */}
      <div className="w-64 bg-[#FFFBE0] border border-black rounded-2xl flex flex-col hidden lg:flex overflow-hidden shadow-lg">
        <div className="p-4 border-b border-black font-mono text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-purple-700" />
          Explorer
        </div>
        <div className="p-3 space-y-1 overflow-y-auto font-mono text-xs">
          {folders.map((folder) => (
            <div
              key={folder.name}
              className="px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-black/[0.04] rounded-xl cursor-pointer flex items-center gap-2 transition-colors"
            >
              <span className="text-slate-500 text-[10px]">▶</span> {folder.name}
            </div>
          ))}
          {criticalFiles.map((file) => (
            <div
              key={file.name}
              onClick={() => setSelectedFileName(file.name)}
              className={`px-3 py-2 rounded-xl cursor-pointer flex items-center gap-2 mt-1 font-medium transition-colors ${
                selectedFileName === file.name
                  ? 'text-black bg-indigo-500/10 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-black/[0.04]'
              }`}
            >
              <FileCode2 className="w-4 h-4 text-purple-700" />
              <span className="truncate">{file.name.split('/').pop()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Code Editor Area */}
      <div className="flex-1 flex flex-col gap-5 min-w-0">
        <div className="bg-[#FFFBE0] border border-black rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden shadow-lg">
          <div className="h-10 border-b border-black flex items-center px-4 gap-2 bg-[#FBF3C4]">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
            <div className="text-xs font-mono text-slate-300 truncate max-w-md">{selectedFileName}</div>
            <span className="ml-auto text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-black">
              {language}
            </span>
          </div>

          <div className="flex-1 p-5 font-mono text-xs overflow-auto relative bg-[#FBF3C4] leading-relaxed">
            <div className="text-slate-600 select-none absolute left-4 top-5 text-right pr-4 border-r border-black">
              {Array.from({ length: codeLines.length }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div className="pl-12 space-y-1">
              {codeLines.map((line, idx) => {
                if (idx === 2) {
                  return (
                    <div key={idx} className="relative group cursor-pointer">
                      <span className="text-purple-700">{line}</span>
                      {/* AI Annotation Tooltip */}
                      <div className="absolute right-4 top-0 w-72 p-3.5 bg-[#FFFBE0] border border-indigo-500/30 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 pointer-events-none -translate-y-2 group-hover:translate-y-0">
                        <div className="text-xs text-purple-700 font-semibold mb-1 flex items-center gap-1.5 font-sans">
                          <Sparkles className="w-3.5 h-3.5" /> AI Code Analysis
                        </div>
                        <div className="text-xs text-slate-300 font-sans leading-normal">
                          {selectedCritical?.importance ||
                            selectedNode?.layerReason ||
                            'Analyzed component in repository dependency tree.'}
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={idx} className="text-slate-300 break-all">
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Observability Panel */}
        <div className="h-44 bg-[#FFFBE0] border border-black rounded-2xl flex flex-col shrink-0 overflow-hidden shadow-lg">
          <div className="flex gap-6 px-5 py-2.5 border-b border-black text-xs font-mono text-slate-400 bg-[#FBF3C4]">
            <button className="hover:text-[#000000] uppercase tracking-wider">Problems (0)</button>
            <button className="hover:text-[#000000] uppercase tracking-wider">Output</button>
            <button className="text-purple-700 font-semibold uppercase tracking-wider border-b-2 border-indigo-500 pb-2 -mb-[11px]">
              Terminal
            </button>
          </div>
          <div className="p-4 flex gap-4 overflow-hidden">
            <div className="flex-1 bg-[#FBF3C4] rounded-xl border border-black p-3.5">
              <div className="text-[11px] font-mono font-bold text-slate-400 mb-2.5 uppercase tracking-wider">
                Dependency Chain
              </div>
              <div className="flex items-center gap-2 text-xs font-mono overflow-x-auto pb-1">
                {incomingLabel && (
                  <>
                    <span className="px-2.5 py-1 bg-slate-900 border border-black rounded-md text-slate-300 truncate max-w-[120px]">
                      {incomingLabel.split('/').pop()}
                    </span>
                    <span>→</span>
                  </>
                )}
                <span className="px-2.5 py-1 bg-indigo-500/10 text-black border border-indigo-500/20 rounded-md font-semibold truncate max-w-[160px]">
                  {selectedFileName.split('/').pop()}
                </span>
                {outgoingLabel && (
                  <>
                    <span>→</span>
                    <span className="px-2.5 py-1 bg-slate-900 border border-black rounded-md text-slate-300 truncate max-w-[120px]">
                      {outgoingLabel.split('/').pop()}
                    </span>
                  </>
                )}
                {!incomingLabel && !outgoingLabel && (
                  <span className="text-slate-500 text-xs">No direct internal connections</span>
                )}
              </div>
            </div>
            <div className="flex-1 bg-[#FBF3C4] rounded-xl border border-black p-3.5">
              <div className="text-[11px] font-mono font-bold text-slate-400 mb-2.5 uppercase tracking-wider">
                Execution Pipeline
              </div>
              <div className="text-xs font-mono text-slate-400 mt-2 truncate">
                Layer: <span className="font-semibold text-black">{selectedNode?.type || 'Source'}</span>
              </div>
              <div className="h-4 bg-slate-900 rounded-full relative overflow-hidden mt-2 border border-black">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-indigo-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(15, (selectedNode?.loc ?? 50) / 3))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right AI Insights Sidebar */}
      <div className="w-80 bg-[#FFFBE0] border border-black rounded-2xl flex flex-col hidden xl:flex overflow-hidden shadow-lg">
        <div className="p-4 border-b border-black font-mono text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between bg-[#FBF3C4]">
          File Insights
          <button
            onClick={handleOpenSource}
            title="Open file on GitHub"
            className="p-1.5 hover:bg-black/[0.06] text-purple-700 rounded-lg transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="p-4 space-y-5 overflow-y-auto">
          <div>
            <h4 className="text-[11px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider">
              File Overview
            </h4>
            <p className="text-xs text-slate-300 bg-[#FBF3C4] p-3.5 rounded-xl border border-black leading-relaxed">
              {selectedCritical?.importance ||
                selectedNode?.layerReason ||
                `Source module categorized under layer '${selectedNode?.type || 'component'}'.`}
            </p>
          </div>

          <div>
            <h4 className="text-[11px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Complexity Impact
            </h4>
            <div className="h-2 bg-[#FBF3C4] rounded-full overflow-hidden border border-black mb-1.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(20, (selectedNode?.importedBy?.length ?? 0) * 20))}%`,
                }}
              />
            </div>
            <div className={`text-[11px] font-mono text-right ${riskLabel === 'High' ? 'text-red-600' : 'text-slate-400'}`}>
              {riskLabel} Risk Component
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-mono font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Connected Services
            </h4>
            <ul className="text-xs font-mono text-black space-y-1.5 bg-[#FBF3C4] p-3.5 rounded-xl border border-black max-h-40 overflow-y-auto">
              {(selectedNode?.externalPackages ?? []).map((pkg) => (
                <li key={pkg} className="truncate">• {pkg}</li>
              ))}
              {(selectedNode?.imports ?? []).map((imp) => (
                <li key={imp} className="truncate">
                  • {nodes.find((n) => n.id === imp)?.label?.split('/').pop() || imp}
                </li>
              ))}
              {!(selectedNode?.externalPackages?.length) && !(selectedNode?.imports?.length) && (
                <li className="text-slate-500 italic">• Standalone module (no imports)</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
