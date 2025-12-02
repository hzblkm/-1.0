
import React, { useState } from 'react';
import { AnalysisStatus, PromptConfig, PromptTemplate } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { Zap, CheckCircle2, FileSearch, ChevronDown, ChevronUp, AlertCircle, Settings, X, Save, FileText, Trash2, CopyPlus } from 'lucide-react';

interface PreProcessSectionProps {
  status: AnalysisStatus;
  content: string;
  onAnalyze: () => void;
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
  onAnalyze,
  promptConfig,
  onUpdatePrompt,
  templates,
  onSaveTemplate,
  onUpdateTemplate,
  onDeleteTemplate
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Editing states
  const [tempSystemPrompt, setTempSystemPrompt] = useState(promptConfig.system);
  const [tempUserPrompt, setTempUserPrompt] = useState(promptConfig.user);
  
  // Template management states
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateNameInput, setTemplateNameInput] = useState('');
  
  const isFinished = status === AnalysisStatus.SUCCESS;
  const isIdle = status === AnalysisStatus.IDLE;
  const isLoading = status === AnalysisStatus.LOADING;

  const handleSaveSettings = () => {
    onUpdatePrompt({
      system: tempSystemPrompt,
      user: tempUserPrompt
    });
    setIsEditing(false);
    // If settings were changed, we probably want to see the panel to re-run
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
      setIsExpanded(true); // Ensure panel is open when editing
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
      isFinished 
        ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200' 
        : 'bg-white border-slate-200'
    }`}>
      
      {/* Header Area */}
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-xl ${isFinished ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Zap size={24} fill={isFinished ? "currentColor" : "none"} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                AI 速读情报官 (数据清洗 & 提炼)
                {isFinished && <CheckCircle2 size={20} className="text-emerald-500 ml-2" />}
              </h2>
              <p className="text-slate-500 mt-1 max-w-2xl">
                这是分析链路的“眼睛”。它将把百万字的长文“读薄”为高浓度的剧情情报。
                <br/>
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                  强烈推荐优先运行
                </span>
                <span className="text-xs text-slate-400 ml-2">后续分析使用此情报可节省 90% 的 Token，速度更快。</span>
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

              {isIdle && !isEditing && (
                <button 
                  onClick={onAnalyze}
                  className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
                >
                  <FileSearch size={18} />
                  <span>开始全书速读</span>
                </button>
              )}
            </div>
            
            {isLoading && !isEditing && (
               <div className="flex items-center space-x-3 px-6 py-2 bg-white border border-slate-200 text-indigo-600 font-medium rounded-lg shadow-sm">
                 <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                 <span>正在极速阅读中...</span>
               </div>
            )}

            {isFinished && !isEditing && (
               <button 
                 onClick={() => setIsExpanded(!isExpanded)}
                 className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 text-sm transition-colors"
               >
                 <span>{isExpanded ? '收起详情' : '查看情报内容'}</span>
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

           {/* Save Template Actions */}
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

      {/* Output Content Area */}
      {!isEditing && isExpanded && (content || isLoading) && (
        <div className="border-t border-slate-200/60 bg-white/50 p-6 animate-in fade-in slide-in-from-top-2">
           {isLoading && !content && (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                 <p className="animate-pulse">正在清洗无效数据、提取核心剧情流...</p>
              </div>
           )}
           
           {content && (
             <div className="prose prose-slate max-w-none prose-sm">
                <div className="flex items-center space-x-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg mb-4 border border-emerald-100 w-fit">
                   <CheckCircle2 size={14} />
                   <span>全书情报已生成。下方的【大纲】、【设定】、【关系】等模块将自动基于此情报进行分析，大幅节省 Token。</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto pr-2 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-lg border border-slate-100 shadow-inner">
                  {content}
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default PreProcessSection;
