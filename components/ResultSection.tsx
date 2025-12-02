
import React, { useState } from 'react';
import { AnalysisStatus, PromptConfig, PromptTemplate } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { Play, RotateCw, Download, Settings, Save, X, Trash2, Plus, FileText, CopyPlus, AlertTriangle } from 'lucide-react';

interface ResultSectionProps {
  title: string;
  description: string;
  status: AnalysisStatus;
  content: string;
  onAnalyze: () => void;
  icon: React.ReactNode;
  promptConfig: PromptConfig;
  onUpdatePrompt: (newConfig: PromptConfig) => void;
  templates: PromptTemplate[];
  onSaveTemplate: (name: string, config: PromptConfig) => void;
  onUpdateTemplate: (id: string, name: string, config: PromptConfig) => void;
  onDeleteTemplate: (id: string) => void;
}

const ResultSection: React.FC<ResultSectionProps> = ({ 
  title, 
  description, 
  status, 
  content, 
  onAnalyze,
  icon,
  promptConfig,
  onUpdatePrompt,
  templates,
  onSaveTemplate,
  onUpdateTemplate,
  onDeleteTemplate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempSystemPrompt, setTempSystemPrompt] = useState(promptConfig.system);
  const [tempUserPrompt, setTempUserPrompt] = useState(promptConfig.user);
  
  // Template management states
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateNameInput, setTemplateNameInput] = useState('');

  const handleDownload = () => {
    if (!content) return;
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_分析结果.md`;
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
    }
    setIsEditing(!isEditing);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    setSelectedTemplateId(tId);
    const template = templates.find(t => t.id === tId);
    if (template) {
      setTempSystemPrompt(template.config.system);
      setTempUserPrompt(template.config.user);
      // Pre-fill name input if it's a custom template
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full relative">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="text-blue-600 bg-blue-100 p-2 rounded-lg">
            {icon}
          </div>
          <div>
            <h2 className="font-bold text-slate-800">{title}</h2>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Settings Button */}
          {!isEditing && (
            <button
              onClick={toggleEdit}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="配置提示词"
            >
              <Settings size={18} />
            </button>
          )}

          {/* Download Button */}
          {status === AnalysisStatus.SUCCESS && !isEditing && (
            <button
              onClick={handleDownload}
              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="下载结果"
            >
              <Download size={18} />
            </button>
          )}

          {/* Action Buttons */}
          {status === AnalysisStatus.IDLE && !isEditing && (
            <button 
              onClick={onAnalyze}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Play size={16} fill="currentColor" />
              <span>开始分析</span>
            </button>
          )}
          {status === AnalysisStatus.LOADING && !isEditing && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-500 text-sm font-medium rounded-lg cursor-not-allowed">
              <LoadingSpinner />
              <span>分析中...</span>
            </div>
          )}
          {status === AnalysisStatus.SUCCESS && !isEditing && (
            <button 
              onClick={onAnalyze}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-lg transition-colors"
            >
              <RotateCw size={16} />
              <span>重新生成</span>
            </button>
          )}
          {status === AnalysisStatus.ERROR && !isEditing && (
             <button 
             onClick={onAnalyze}
             className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium rounded-lg transition-colors"
           >
             <RotateCw size={16} />
             <span>重试</span>
           </button>
          )}
        </div>
      </div>

      <div className="flex-grow p-6 overflow-y-auto max-h-[600px] min-h-[200px] bg-white relative">
        {isEditing ? (
          <div className="space-y-4 animate-in fade-in duration-200 flex flex-col h-full">
             <div className="flex justify-between items-center mb-1">
               <h3 className="text-sm font-bold text-slate-700 flex items-center">
                 <Settings size={14} className="mr-2"/> 配置提示词 (Prompt Settings)
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
                   className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-xs shadow-sm"
                 >
                   <Save size={14} /> <span>应用配置</span>
                 </button>
               </div>
             </div>

             {/* Template Selection */}
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-500">加载预设模板 / Load Template</label>
                  {isCustomTemplateSelected && (
                    <button 
                      onClick={handleDeleteCurrentTemplate}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center"
                      title="删除当前选中的模板"
                    >
                      <Trash2 size={12} className="mr-1"/> 删除模板
                    </button>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={selectedTemplateId}
                    onChange={handleTemplateChange}
                    className="w-full text-sm p-2 pl-3 pr-8 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
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
             
             <div className="flex-grow space-y-4 overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">系统指令 (System Instruction)</label>
                  <textarea
                    value={tempSystemPrompt}
                    onChange={(e) => setTempSystemPrompt(e.target.value)}
                    className="w-full h-24 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 font-mono"
                    placeholder="输入系统指令..."
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">用户指令 (User Prompt)</label>
                  <textarea
                    value={tempUserPrompt}
                    onChange={(e) => setTempUserPrompt(e.target.value)}
                    className="w-full h-40 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 font-mono"
                    placeholder="输入任务指令..."
                  />
                  <p className="text-[10px] text-slate-400 mt-1">* 实际发送请求时，AI会自动在最后附上小说文本内容。</p>
                </div>
             </div>

             {/* Template Actions */}
             <div className="pt-3 border-t border-slate-200 mt-2">
               <label className="block text-xs font-semibold text-slate-500 mb-2">
                 {isCustomTemplateSelected ? '模板操作 / Template Actions' : '另存为新模板 / Save as New Template'}
               </label>
               <div className="flex space-x-2">
                 <input 
                   type="text"
                   value={templateNameInput}
                   onChange={(e) => setTemplateNameInput(e.target.value)}
                   placeholder="输入模板名称..."
                   className="flex-grow text-sm p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                 />
                 
                 {/* Update Button (Only for existing custom templates) */}
                 {isCustomTemplateSelected && (
                    <button 
                      onClick={handleUpdateExistingTemplate}
                      disabled={!templateNameInput.trim()}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      title="更新当前模板"
                    >
                      <Save size={14} /> <span>更新</span>
                    </button>
                 )}

                 {/* Save As New Button */}
                 <button 
                   onClick={handleSaveAsTemplate}
                   disabled={!templateNameInput.trim()}
                   className="flex items-center space-x-1 px-3 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-md text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                   title="另存为新模板"
                 >
                   <CopyPlus size={14} /> <span>{isCustomTemplateSelected ? '另存为' : '保存'}</span>
                 </button>
               </div>
             </div>
          </div>
        ) : (
          <>
            {status === AnalysisStatus.IDLE && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <div className="w-16 h-1 bg-slate-200 rounded mb-2"></div>
                <div className="w-24 h-1 bg-slate-200 rounded mb-2"></div>
                <div className="w-12 h-1 bg-slate-200 rounded"></div>
                <p className="mt-4 text-sm">等待开始</p>
              </div>
            )}

            {status === AnalysisStatus.LOADING && content === "" && (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="animate-pulse flex flex-col items-center space-y-4 w-full px-10">
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-100 rounded w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                </div>
                <p className="text-slate-400 text-xs mt-6 animate-pulse">Gemini 3 Pro 正在深度阅读全文...</p>
              </div>
            )}

            {status === AnalysisStatus.ERROR && (
              <div className="h-full flex flex-col items-center justify-center text-red-500">
                <AlertTriangle size={32} className="mb-2" />
                <p>分析过程中发生错误，请检查网络或重试。</p>
              </div>
            )}

            {(status === AnalysisStatus.SUCCESS || (status === AnalysisStatus.LOADING && content !== "")) && (
              <div className="prose prose-slate max-w-none prose-sm prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-slate-900">
                 <div className="whitespace-pre-wrap leading-relaxed">
                   {content}
                 </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResultSection;
