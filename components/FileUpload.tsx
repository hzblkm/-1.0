
import React, { useRef, useState, useEffect } from 'react';
import { FileData } from '../types';
import { Upload, FileText, AlertCircle, RefreshCw, Check, Eye } from 'lucide-react';

interface FileUploadProps {
  onFileLoaded: (data: FileData) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewText, setPreviewText] = useState<string>("");
  const [selectedEncoding, setSelectedEncoding] = useState<string>("utf-8");
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-decode when encoding changes
  useEffect(() => {
    if (fileBuffer) {
      decodeBuffer(fileBuffer, selectedEncoding);
    }
  }, [selectedEncoding]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const decodeBuffer = (buffer: ArrayBuffer, encoding: string) => {
    try {
      const decoder = new TextDecoder(encoding, { fatal: false });
      // Optimization: Only decode the first 10KB for preview to avoid UI freeze on large files
      const headerBuffer = buffer.slice(0, 10240); 
      const text = decoder.decode(headerBuffer);
      setPreviewText(text.slice(0, 500));
    } catch (e) {
      setPreviewText("解码失败，请尝试其他编码格式...");
    }
  };

  const processFile = (file: File | undefined) => {
    if (!file) return;
    
    setCurrentFile(file);
    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      setFileBuffer(buffer);
      
      // Auto-detect strategy
      try {
        const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
        // Test a chunk instead of whole file for speed
        utf8Decoder.decode(buffer.slice(0, 5000)); 
        setSelectedEncoding('utf-8');
        decodeBuffer(buffer, 'utf-8');
      } catch (err) {
        console.log("Auto-detect: Likely GBK");
        setSelectedEncoding('gb18030');
        decodeBuffer(buffer, 'gb18030');
      }
      
      setLoading(false);
    };

    reader.onerror = () => {
      alert("读取文件失败");
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirmUpload = () => {
    if (!fileBuffer || !currentFile) return;
    
    setLoading(true);
    // Decode full content only when confirmed
    setTimeout(() => {
      try {
        const decoder = new TextDecoder(selectedEncoding);
        const fullContent = decoder.decode(fileBuffer);
        
        onFileLoaded({
          name: currentFile.name,
          size: currentFile.size,
          content: fullContent
        });
      } catch (e) {
        alert("最终解码失败，请重试");
      } finally {
        setLoading(false);
      }
    }, 100);
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

  if (fileBuffer && currentFile) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
             <FileText size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">{currentFile.name}</h3>
            <p className="text-sm text-slate-500">{(currentFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center">
              <Eye size={16} className="mr-2"/> 文本内容预览 (Text Preview)
            </label>
            <div className="flex items-center space-x-2">
               <span className="text-xs text-slate-500">若显示乱码，请切换编码:</span>
               <select 
                 value={selectedEncoding}
                 onChange={(e) => setSelectedEncoding(e.target.value)}
                 className="text-sm border-slate-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
               >
                 <option value="utf-8">UTF-8 (通用)</option>
                 <option value="gb18030">GB18030/GBK (中文旧文件)</option>
                 <option value="big5">Big5 (繁体)</option>
               </select>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-48 overflow-y-auto font-mono text-sm text-slate-700 whitespace-pre-wrap">
            {previewText}
            {previewText.length >= 500 && "..."}
          </div>
          <p className="text-xs text-amber-600 mt-2 flex items-center">
             <AlertCircle size={12} className="mr-1"/> 
             请确认上方文字显示正常。如果看到乱码，请尝试切换编码格式。
          </p>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={() => {
              setFileBuffer(null);
              setCurrentFile(null);
              setPreviewText("");
            }}
            className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
          >
            取消 / 重选
          </button>
          <button 
            onClick={handleConfirmUpload}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-colors flex justify-center items-center"
            disabled={loading}
          >
            {loading ? <RefreshCw className="animate-spin mr-2" size={18}/> : <Check className="mr-2" size={18}/>}
            确认并在分析中使用
          </button>
        </div>
      </div>
    );
  }

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
          <p className="text-slate-500 font-medium">正在读取并智能识别编码，请稍候...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">点击上传或拖拽文件</h3>
            <p className="text-sm text-slate-500 mt-1">支持 TXT, Markdown (自动识别 UTF-8 / GBK)</p>
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
