"use client";

import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileAudio, 
  Play, 
  Pause, 
  Download, 
  RotateCcw, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import axios from "axios";

export default function VoiceToText() {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 检查文件类型
      const isValidType = selectedFile.type.startsWith("audio/") || selectedFile.type === "video/mp4";
      if (!isValidType) {
        setError("请上传有效的音频文件 (mp3, wav, m4a 等)");
        setFile(null);
        setAudioUrl(null);
        return;
      }

      // 检查文件大小
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError("文件大小超过限制 (最大 25MB)");
        setFile(null);
        setAudioUrl(null);
        return;
      }

      setFile(selectedFile);
      setAudioUrl(URL.createObjectURL(selectedFile));
      setTranscription("");
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setTranscription("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/transcribe", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setTranscription(response.data.text);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "转换失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!transcription) return;
    const element = document.createElement("a");
    const blob = new Blob([transcription], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    // 使用原文件名或默认名称
    const fileName = file ? file.name.split('.')[0] : "transcription";
    
    element.href = url;
    element.download = `${fileName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const reset = () => {
    setFile(null);
    setAudioUrl(null);
    setTranscription("");
    setError(null);
    setIsPlaying(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          语音转文字系统
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          上传音频文件，快速转换为准确的文字内容
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Upload and Preview */}
        <div className="space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-12
              flex flex-col items-center justify-center cursor-pointer
              transition-all duration-200 group
              ${file ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-300 hover:border-blue-400 dark:border-gray-700'}
            `}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/*,video/mp4"
              className="hidden"
            />
            
            {file ? (
              <div className="text-center space-y-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full inline-block">
                  <FileAudio className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full group-hover:scale-110 transition-transform duration-200">
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                    点击或拖拽上传
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    支持 MP3, WAV, M4A, MP4 等格式
                  </p>
                </div>
              </>
            )}
          </div>

          {audioUrl && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <button 
                onClick={togglePlay}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div className="flex-1">
                <audio 
                  ref={audioRef} 
                  src={audioUrl} 
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full bg-blue-500 ${isPlaying ? 'animate-pulse' : ''}`} style={{ width: '100%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">音频预览已就绪</p>
              </div>
              <button 
                onClick={reset}
                className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                title="重置"
              >
                <RotateCcw size={20} />
              </button>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || isLoading}
            className={`
              w-full py-4 rounded-xl font-semibold text-white shadow-lg
              transition-all duration-200 flex items-center justify-center gap-2
              ${!file || isLoading 
                ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5'}
            `}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                正在转换中...
              </>
            ) : (
              <>
                <CheckCircle2 size={20} />
                开始转换
              </>
            )}
          </button>
        </div>

        {/* Right Column: Results */}
        <div className="flex flex-col h-full">
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200">转换结果</h3>
              {transcription && (
                <button
                  onClick={handleDownload}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <Download size={16} />
                  下载文字
                </button>
              )}
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto min-h-[300px] relative">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-800/80 z-10 text-center px-4">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                  <p className="text-gray-500 font-medium">本地模型正在努力识别中...</p>
                  <p className="text-xs text-gray-400 mt-2">首次运行可能需要下载语音模型（约 50MB），请耐心等待</p>
                </div>
              ) : null}

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
                  <AlertCircle className="shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {transcription ? (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {transcription}
                  </p>
                </div>
              ) : !isLoading && !error && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-900/30 p-6 rounded-full">
                    <FileAudio className="w-12 h-12 opacity-20" />
                  </div>
                  <p>转换后的文字将显示在这里</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
        <h4 className="text-amber-800 dark:text-amber-400 font-semibold mb-2">使用说明</h4>
        <ul className="text-amber-700 dark:text-amber-500 text-sm space-y-1 list-disc list-inside">
          <li>本系统已切换为<b>本地离线转写</b>，不消耗 OpenAI 额度，隐私更安全。</li>
          <li>首次使用会自动下载 Vosk 语音模型（约 50MB）。</li>
          <li>支持最大 25MB 的音频文件。</li>
          <li>转写完成后可以点击右上角下载为 .txt 文件。</li>
        </ul>
      </div>
    </div>
  );
}
