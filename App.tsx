
import React, { useState } from 'react';
import { BookOpen, Feather, Map, FileText, Trash2, Cpu } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ResultSection from './components/ResultSection';
import { AnalysisStatus, AnalysisResult, FileData, AnalysisType, PromptConfig, PromptTemplate } from './types';
import { analyzeNovelText, DEFAULT_PROMPTS } from './services/geminiService';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  
  // States for Analysis Results
  const [outlineState, setOutlineState] = useState<AnalysisResult>({
    type: 'outline', content: '', status: AnalysisStatus.IDLE
  });
  
  const [styleState, setStyleState] = useState<AnalysisResult>({
    type: 'style', content: '', status: AnalysisStatus.IDLE
  });
  
  const [settingsState, setSettingsState] = useState<AnalysisResult>({
    type: 'settings', content: '', status: AnalysisStatus.IDLE
  });

  // States for Custom Prompts (Current Session)
  const [prompts, setPrompts] = useState<Record<AnalysisType, PromptConfig>>(DEFAULT_PROMPTS);

  // States for Saved Templates (Persistent)
  const [customTemplates, setCustomTemplates] = useState<PromptTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('novel_analysis_templates');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load templates", e);
      return [];
    }
  });

  const saveCustomTemplates = (templates: PromptTemplate[]) => {
    setCustomTemplates(templates);
    localStorage.setItem('novel_analysis_templates', JSON.stringify(templates));
  };

  const handleSaveTemplate = (type: AnalysisType, name: string, config: PromptConfig) => {
    const newTemplate: PromptTemplate = {
      id: generateId(),
      name,
      type,
      config,
      isBuiltIn: false
    };
    saveCustomTemplates([...customTemplates, newTemplate]);
  };

  const handleUpdateTemplate = (id: string, name: string, config: PromptConfig) => {
    const updatedTemplates = customTemplates.map(t =>
      t.id === id ? { ...t, name, config } : t
    );
    saveCustomTemplates(updatedTemplates);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('确定要删除这个模板吗？')) {
      saveCustomTemplates(customTemplates.filter(t => t.id !== id));
    }
  };

  const getTemplates = (type: AnalysisType): PromptTemplate[] => {
    const defaultTemplate: PromptTemplate = {
      id: `default-${type}`,
      name: '系统默认 (System Default)',
      type,
      config: DEFAULT_PROMPTS[type],
      isBuiltIn: true
    };
    // Filter custom templates for this type
    const userTemplates = customTemplates.filter(t => t.type === type);
    return [defaultTemplate, ...userTemplates];
  };

  const handleFileLoaded = (data: FileData) => {
    setFileData(data);
    setOutlineState({ type: 'outline', content: '', status: AnalysisStatus.IDLE });
    setStyleState({ type: 'style', content: '', status: AnalysisStatus.IDLE });
    setSettingsState({ type: 'settings', content: '', status: AnalysisStatus.IDLE });
  };

  const handleRemoveFile = () => {
    setFileData(null);
  };

  const updatePrompt = (type: AnalysisType, newConfig: PromptConfig) => {
    setPrompts(prev => ({
      ...prev,
      [type]: newConfig
    }));
  };

  const runAnalysis = async (
    type: AnalysisType, 
    setter: React.Dispatch<React.SetStateAction<AnalysisResult>>
  ) => {
    if (!fileData) return;

    setter(prev => ({ ...prev, status: AnalysisStatus.LOADING, content: '', error: undefined }));

    try {
      await analyzeNovelText(
        fileData.content, 
        type, 
        prompts[type], // Pass the current (potentially edited) prompt
        (streamText) => {
          setter(prev => ({ ...prev, content: streamText }));
        }
      );
      setter(prev => ({ ...prev, status: AnalysisStatus.SUCCESS }));
    } catch (e) {
      setter(prev => ({ ...prev, status: AnalysisStatus.ERROR, error: 'Failed to analyze' }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-lg shadow-md">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">长篇小说深度分析师</h1>
              <p className="text-xs text-slate-500 font-medium">Powered by Gemini 3 Pro</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             {fileData && (
               <div className="hidden md:flex items-center px-3 py-1 bg-slate-100 rounded-full border border-slate-200 text-xs text-slate-600">
                 <FileText size={12} className="mr-2" />
                 <span className="truncate max-w-[200px]">{fileData.name}</span>
                 <span className="mx-2 text-slate-300">|</span>
                 <span>{(fileData.size / 1024 / 1024).toFixed(2)} MB</span>
               </div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* File Upload Area */}
        {!fileData ? (
          <div className="max-w-2xl mx-auto mt-12">
            <FileUpload onFileLoaded={handleFileLoaded} />
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                <div className="mx-auto w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                  <Cpu size={20} />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">超长文本处理</h3>
                <p className="text-xs text-slate-500 mt-1">支持千万级 Token 上下文，轻松处理百万字长篇</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                <div className="mx-auto w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3">
                  <Feather size={20} />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">风格深度剖析</h3>
                <p className="text-xs text-slate-500 mt-1">分析文笔、情感基调与叙事技巧</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                <div className="mx-auto w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                  <Map size={20} />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">设定自动提取</h3>
                <p className="text-xs text-slate-500 mt-1">一键整理世界观、人物关系与力量体系</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Active File Bar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-4">
                 <div className="bg-slate-100 p-2 rounded-lg">
                    <FileText size={24} className="text-slate-600" />
                 </div>
                 <div>
                   <h2 className="text-lg font-bold text-slate-800">{fileData.name}</h2>
                   <p className="text-sm text-slate-500">文件大小: {(fileData.size / 1024 / 1024).toFixed(2)} MB</p>
                 </div>
              </div>
              <button 
                onClick={handleRemoveFile}
                className="flex items-center space-x-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">重新上传</span>
              </button>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
              {/* Step 1: Outline */}
              <ResultSection 
                title="1. 大纲提取"
                description="故事弧线与详细章纲"
                status={outlineState.status}
                content={outlineState.content}
                onAnalyze={() => runAnalysis('outline', setOutlineState)}
                icon={<BookOpen size={20} />}
                promptConfig={prompts.outline}
                onUpdatePrompt={(cfg) => updatePrompt('outline', cfg)}
                templates={getTemplates('outline')}
                onSaveTemplate={(name, config) => handleSaveTemplate('outline', name, config)}
                onUpdateTemplate={handleUpdateTemplate}
                onDeleteTemplate={handleDeleteTemplate}
              />

              {/* Step 2: Style */}
              <ResultSection 
                title="2. 风格分析"
                description="文笔、视角与情感基调"
                status={styleState.status}
                content={styleState.content}
                onAnalyze={() => runAnalysis('style', setStyleState)}
                icon={<Feather size={20} />}
                promptConfig={prompts.style}
                onUpdatePrompt={(cfg) => updatePrompt('style', cfg)}
                templates={getTemplates('style')}
                onSaveTemplate={(name, config) => handleSaveTemplate('style', name, config)}
                onUpdateTemplate={handleUpdateTemplate}
                onDeleteTemplate={handleDeleteTemplate}
              />

              {/* Step 3: Settings */}
              <ResultSection 
                title="3. 设定拆解"
                description="世界观、人物与力量体系"
                status={settingsState.status}
                content={settingsState.content}
                onAnalyze={() => runAnalysis('settings', setSettingsState)}
                icon={<Map size={20} />}
                promptConfig={prompts.settings}
                onUpdatePrompt={(cfg) => updatePrompt('settings', cfg)}
                templates={getTemplates('settings')}
                onSaveTemplate={(name, config) => handleSaveTemplate('settings', name, config)}
                onUpdateTemplate={handleUpdateTemplate}
                onDeleteTemplate={handleDeleteTemplate}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
