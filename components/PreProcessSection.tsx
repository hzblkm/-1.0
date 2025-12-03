
import React, { useState } from 'react';
import { AnalysisStatus, PromptConfig, PromptTemplate, ChunkData } from '../types';
import { Zap, CheckCircle2, FileSearch, ChevronDown, ChevronUp, Settings, X, Save, FileText, Trash2, CopyPlus, Download, Scissors, Play, RotateCw, Eye, EyeOff } from 'lucide-react';

interface PreProcessSectionProps {
  status: AnalysisStatus;
  content: string; // The aggregate content
  chunks: ChunkData[];
  onSplit: () => void;
  onSummarizeChunk: (index: number) => void;
  onSummarizeAll: () => void;
  promptConfig: PromptConfig;
  onUpdatePrompt: (newConfig: PromptConfig) => void;
  templates: PromptTemplate[];
  onSaveTemplate: (name: string, config: PromptConfig) => void;
  onUpdateTemplate: (id: string, name: string, config: PromptConfig) => void;
  onDeleteTemplate: (id: string) => void;
}

const PreProcessSection: React.FC<PreProcessSectionProps> = ({ 
  status, 
  content,
  chunks,
  onSplit,
  onSummarizeChunk,
  onSummarizeAll,
  promptConfig,
  onUpdatePrompt,
  templates,
  onSaveTemplate,
  onUpdateTemplate,
  onDeleteTemplate
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chunks' | 'aggregate'>('chunks');
  const [expandedChunks, setExpandedChunks] = useState<Record<number, boolean>>({});
  
  // Editing states
  const [tempSystemPrompt, setTempSystemPrompt] = useState(promptConfig.system);
  const [tempUserPrompt, setTempUserPrompt] = useState(promptConfig.user);
  
  // Template management states
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateNameInput, setTemplateNameInput] = useState('');
  
  const hasChunks = chunks.length > 0;
  const isFinished = status === AnalysisStatus.SUCCESS;

  const handleDownload = () => {
    if (!content) return;
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AI_速读情报_全书精华.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = () => {
    onUpdatePrompt({
      system: tempSystemPrompt,
      user: tempUserPrompt
    });
    setIsEditing(false);
    setIsExpanded(true); 
  };

  const handleCancelSettings = () => {
    setTempSystemPrompt(promptConfig.system);
    setTempUserPrompt(promptConfig.user);
    setIsEditing(false);
  };

  const toggleEdit = () => {
    if (!isEditing) {
      setTempSystemPrompt(promptConfig.system);
      setTempUserPrompt(promptConfig.user);
      setSelectedTemplateId('');
      setTemplateNameInput('');
      setIsExpanded(true); 
    }
    setIsEditing(!isEditing);
  };

  const toggleChunkPreview = (index: number) => {
    setExpandedChunks(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    setSelectedTemplateId(tId);
    const template = templates.find(t => t.id === tId);
    if (template) {
      setTempSystemPrompt(template.config.system);
      setTempUserPrompt(template.config.user);
      if (!template.isBuiltIn) {
        setTemplateNameInput(template.name);
      } else {
        setTemplateNameInput('');
      }
    } else {
      setTemplateNameInput('');
    }
  };

  const handleSaveAsTemplate = () => {
    if (!templateNameInput.trim()) return;
    onSaveTemplate(templateNameInput, {
      system: tempSystemPrompt,
      user: tempUserPrompt
    });
    setTemplateNameInput('');
    alert(`新模板 "${templateNameInput}" 已保存`);
  };

  const handleUpdateExistingTemplate = () => {
    if (!selectedTemplateId || !templateNameInput.trim()) return;
    onUpdateTemplate(selectedTemplateId, templateNameInput, {
      system: tempSystemPrompt,
      user: tempUserPrompt
    });
    alert(`模板 "${templateNameInput}" 已更新`);
  };

  const handleDeleteCurrentTemplate = () => {
    if (selectedTemplateId) {
      onDeleteTemplate(selectedTemplateId);
      setSelectedTemplateId('');
      setTemplateNameInput('');
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const isCustomTemplateSelected = selectedTemplate && !selectedTemplate.isBuiltIn;

  return (
    <div className={`rounded-xl border shadow-sm transition-all duration-300 overflow-hidden mb-8 ${
      hasChunks || isFinished 
        ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200' 
        : 'bg-white border-slate-200'
    }`}>
      
      {/* Header Area */}
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-xl ${hasChunks ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Zap size={24} fill={hasChunks ? "currentColor" : "none"} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                AI 速读情报官 (数据清洗 & 提炼)
                {isFinished && <CheckCircle2 size={20} className="text-emerald-500 ml-2" />}
              </h2>
              <p className="text-slate-500 mt-1 max-w-2xl">
                这是分析链路的“眼睛”。分为两步：<br/>
                1. 智能拆分：将长文按语义切分为若干部分。<br/>
                2. 极速阅读：逐个或批量生成高浓度的剧情情报。
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2">
              {/* Settings Button */}
              {!isEditing && (
                <button
                  onClick={toggleEdit}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="配置 Prompt"
                >
                  <Settings size={18} />
                </button>
              )}

              {/* Download Button */}
              {isFinished && !isEditing && (
                <button
                  onClick={handleDownload}
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="下载情报 (Markdown)"
                >
                  <Download size={18} />
                </button>
              )}

              {/* STEP 1: SPLIT */}
              {!hasChunks && !isEditing && (
                <button 
                  onClick={onSplit}
                  className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                >
                  <Scissors size={18} />
                  <span>第一步：智能拆分</span>
                </button>
              )}

               {/* STEP 2: SUMMARY ALL */}
               {hasChunks && !isEditing && (
                <button 
                  onClick={onSummarizeAll}
                  className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                >
                  <FileSearch size={18} />
                  <span>第二步：批量速读 ({chunks.length} 部分)</span>
                </button>
              )}
            </div>
            
            {hasChunks && !isEditing && (
               <button 
                 onClick={() => setIsExpanded(!isExpanded)}
                 className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 text-sm transition-colors"
               >
                 <span>{isExpanded ? '收起详情' : '展开详情'}</span>
                 {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
               </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings / Edit Mode */}
      {isEditing && (
        <div className="border-t border-slate-200 bg-slate-50/50 p-6 animate-in fade-in slide-in-from-top-2">
           <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-bold text-slate-700 flex items-center">
                 <Settings size={14} className="mr-2"/> 配置速读指令 (Prompt Settings)
               </h3>
               <div className="flex space-x-2">
                 <button 
                   onClick={handleCancelSettings}
                   className="flex items-center space-x-1 px-3 py-1 text-slate-500 hover:bg-slate-100 rounded text-xs"
                 >
                   <X size={14} /> <span>取消</span>
                 </button>
                 <button 
                   onClick={handleSaveSettings}
                   className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-xs shadow-sm"
                 >
                   <Save size={14} /> <span>应用配置</span>
                 </button>
               </div>
           </div>
           
           {/* Template Controls */}
           <div className="bg-white p-3 rounded-lg border border-slate-200 mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-500">加载预设模板</label>
                {isCustomTemplateSelected && (
                  <button onClick={handleDeleteCurrentTemplate} className="text-red-500 hover:text-red-700 text-xs flex items-center">
                    <Trash2 size={12} className="mr-1"/> 删除模板
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedTemplateId}
                  onChange={handleTemplateChange}
                  className="w-full text-sm p-2 pl-3 pr-8 border border-slate-300 rounded-md bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  <option value="" className="text-slate-400">-- 选择模板以覆盖下方内容 --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.isBuiltIn ? '🔒 ' : '👤 '}{t.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">
                  <FileText size={14} />
                </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">系统指令 (System Instruction)</label>
                <textarea
                  value={tempSystemPrompt}
                  onChange={(e) => setTempSystemPrompt(e.target.value)}
                  className="w-full h-48 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white font-mono"
                  placeholder="输入系统指令..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">用户指令 (User Prompt)</label>
                <textarea
                  value={tempUserPrompt}
                  onChange={(e) => setTempUserPrompt(e.target.value)}
                  className="w-full h-48 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white font-mono"
                  placeholder="输入任务指令..."
                />
              </div>
           </div>

           <div className="mt-4 pt-3 border-t border-slate-200">
             <div className="flex items-center space-x-2">
                <input 
                   type="text"
                   value={templateNameInput}
                   onChange={(e) => setTemplateNameInput(e.target.value)}
                   placeholder="输入新模板名称..."
                   className="flex-grow text-sm p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                 />
                 {isCustomTemplateSelected && (
                    <button 
                      onClick={handleUpdateExistingTemplate}
                      disabled={!templateNameInput.trim()}
                      className="flex items-center space-x-1 px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md text-xs disabled:opacity-50"
                    >
                      <Save size={14} /> <span>更新</span>
                    </button>
                 )}
                 <button 
                   onClick={handleSaveAsTemplate}
                   disabled={!templateNameInput.trim()}
                   className="flex items-center space-x-1 px-3 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-md text-xs disabled:opacity-50"
                 >
                   <CopyPlus size={14} /> <span>{isCustomTemplateSelected ? '另存为' : '保存'}</span>
                 </button>
             </div>
           </div>
        </div>
      )}

      {/* Main Content Area */}
      {!isEditing && isExpanded && hasChunks && (
        <div className="border-t border-slate-200/60 bg-white/50 p-0 animate-in fade-in slide-in-from-top-2">
           
           {/* Tabs */}
           <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
              <button 
                onClick={() => setActiveTab('chunks')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'chunks' ? 'bg-white text-indigo-600 border-t border-x border-slate-200 -mb-px' : 'text-slate-500 hover:text-slate-700'}`}
              >
                分段管理 ({chunks.length})
              </button>
              <button 
                onClick={() => setActiveTab('aggregate')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'aggregate' ? 'bg-white text-indigo-600 border-t border-x border-slate-200 -mb-px' : 'text-slate-500 hover:text-slate-700'}`}
              >
                全书情报总览
              </button>
           </div>

           {/* Tab Content: CHUNKS LIST */}
           {activeTab === 'chunks' && (
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                {chunks.map((chunk, index) => (
                  <div key={chunk.id} className="bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                     <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Part {index + 1}</span>
                        <div className="flex items-center space-x-2">
                           <button 
                              onClick={() => toggleChunkPreview(index)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors"
                              title={expandedChunks[index] ? "隐藏原文" : "预览原文"}
                           >
                              {expandedChunks[index] ? <EyeOff size={14} /> : <Eye size={14} />}
                           </button>
                           <span className="text-[10px] text-slate-400 font-mono">{(chunk.originalText.length / 1000).toFixed(1)}k chars</span>
                        </div>
                     </div>
                     
                     <div className="p-4 flex-grow h-64 overflow-y-auto relative custom-scrollbar">
                        {expandedChunks[index] ? (
                           <div className="text-slate-500 font-mono text-xs whitespace-pre-wrap bg-slate-50 p-2 rounded border border-slate-200 h-full overflow-y-auto">
                              <div className="text-[10px] text-indigo-500 mb-1 font-bold sticky top-0 bg-slate-50 pb-1 border-b border-slate-100">--- 原文预览 (前1000字) ---</div>
                              {chunk.originalText.slice(0, 1000)}
                              {chunk.originalText.length > 1000 && '...'}
                           </div>
                        ) : chunk.summary ? (
                          <div className="prose prose-xs max-w-none text-slate-800 whitespace-pre-wrap leading-relaxed">
                             <div className="font-bold text-emerald-600 mb-2 flex items-center bg-emerald-50 w-fit px-2 py-1 rounded"><CheckCircle2 size={12} className="mr-1"/> 已提炼:</div>
                             {chunk.summary}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-xs h-full flex items-center justify-center">
                             <p>等待分析...</p>
                          </div>
                        )}
                     </div>

                     <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                        {chunk.status === AnalysisStatus.LOADING ? (
                           <span className="text-xs text-indigo-600 flex items-center px-3 py-1.5"><div className="animate-spin h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full mr-2"></div> 读取中...</span>
                        ) : chunk.status === AnalysisStatus.SUCCESS ? (
                           <button onClick={() => onSummarizeChunk(index)} className="text-xs flex items-center text-slate-500 hover:text-indigo-600 px-3 py-1.5 transition-colors">
                              <RotateCw size={12} className="mr-1"/> 重新速读
                           </button>
                        ) : (
                           <button onClick={() => onSummarizeChunk(index)} className="text-xs flex items-center bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 px-3 py-1.5 rounded shadow-sm transition-all">
                              <Play size={12} className="mr-1"/> 开始速读
                           </button>
                        )}
                     </div>
                  </div>
                ))}
             </div>
           )}

           {/* Tab Content: AGGREGATE */}
           {activeTab === 'aggregate' && (
              <div className="p-6">
                 {content ? (
                   <div className="prose prose-slate max-w-none prose-sm">
                      <div className="flex items-center space-x-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg mb-4 border border-emerald-100 w-fit">
                         <CheckCircle2 size={14} />
                         <span>以下内容为所有分段情报的汇总。后续模块将基于此内容进行分析。</span>
                      </div>
                      <div className="max-h-[500px] overflow-y-auto pr-2 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-lg border border-slate-100 shadow-inner">
                        {content}
                      </div>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <FileText size={32} className="mb-2 opacity-50"/>
                      <p>暂无汇总情报。请先在“分段管理”中对各个片段进行速读。</p>
                   </div>
                 )}
              </div>
           )}

        </div>
      )}
    </div>
  );
};

export default PreProcessSection;
