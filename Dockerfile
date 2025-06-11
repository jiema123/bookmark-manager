# 使用官方Node.js镜像作为构建环境
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

RUN npm install -g pnpm  # 安装项目依赖

COPY package.json ./

# 安装依赖
RUN pnpm install  # 安装项目依赖

# 复制项目文件
COPY . .

# 构建项目
RUN pnpm run build

# 挂载 backups 目录
VOLUME ["/app/backups"]

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["pnpm","run","start"]