# 语音转文字系统 (Local Voice-to-Text)

这是一个基于 Next.js 和 Vosk 的本地离线语音转文字系统。

## 功能特性

- **完全本地运行**：不依赖 OpenAI API，隐私安全，零成本。
- **离线识别**：使用 Vosk 引擎，支持中文语音识别。
- **自动模型下载**：首次运行自动下载轻量级语音模型。
- **预览与下载**：支持音频播放预览及转写结果下载为 .txt。

## 快速开始

### 1. 安装依赖

确保系统中已安装 Python 3 和 FFmpeg。

```bash
# 安装 Node.js 依赖
npm install

# 安装 Python 依赖
pip install vosk requests
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可开始使用。

## 技术栈

- **Frontend**: Next.js 15, Tailwind CSS 4, Lucide React
- **Backend**: Next.js API Routes, Python, Vosk
- **Audio Processing**: FFmpeg
