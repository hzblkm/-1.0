import React, { useRef, useState } from 'react';
import { FileData } from '../types';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileLoaded: (data: FileData) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const processFile = (file: File | undefined) => {
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoaded({
        name: file.name,
        size: file.size,
        content: content
      });
      setLoading(false);
    };

    reader.onerror = () => {
      alert("读取文件失败");
      setLoading(false);
    };

    // Read as text. Works for .txt, .md, etc.
    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 transition-colors text-center cursor-pointer ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-white'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.md,.csv"
        className="hidden"
      />
      
      {loading ? (
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-medium">正在读取大文件，请稍候...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">点击上传或拖拽文件</h3>
            <p className="text-sm text-slate-500 mt-1">支持 TXT, Markdown (无大小限制)</p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            <AlertCircle size={14} />
            <span>支持超大文本分析 (Gemini 3 Pro)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;