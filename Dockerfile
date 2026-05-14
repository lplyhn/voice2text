# 使用基础镜像，包含 Node.js 运行环境
FROM node:24-slim AS base

# 安装系统级依赖：Python3, pip, FFmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# 设置 Python 环境
ENV PYTHONUNBUFFERED=1
# 创建虚拟环境以避免 PEP 668 错误
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 安装 Python 依赖
RUN pip install --no-cache-dir vosk requests

# 设置工作目录
WORKDIR /app

# --- 依赖阶段 ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm install

# --- 构建阶段 ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 预先下载语音模型到镜像中（可选，这里为了加快容器启动速度）
RUN mkdir -p models && \
    curl -L -o models/model.zip https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip && \
    unzip models/model.zip -d models/ && \
    rm models/model.zip

RUN npm run build

# --- 运行阶段 ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# 复制构建产物和必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/transcribe.py ./transcribe.py
COPY --from=builder /app/models ./models

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
