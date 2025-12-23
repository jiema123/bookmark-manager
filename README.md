# 书签管理器
体验网址：[https://home.justnow.uk/](https://home.justnow.uk/)

一个基于 Next.js 的现代化书签管理应用，支持书签的增删改查、批量管理、云端同步和广场分享功能。

**✨ 现已支持部署到 Cloudflare Workers/Pages！**

![image.png](https://img.justnow.uk/2025/06/72b101ba80e40caab93958052809150b.png)

## 功能特性

- 📚 书签的增删改查
- 🔄 批量导入/导出书签（支持 JSON 和浏览器书签文件）
- 🤖 AI 辅助自动抓取网页元数据
- ☁️ 云端备份/恢复
- 🌐 广场分享功能
- 🏷️ 标签管理和筛选
- 🔍 全文搜索
- 🎨 现代化 UI 设计
- 🚀 支持多种部署方式：
  - Cloudflare Workers/Pages（推荐）
  - Docker
  - Node.js
  - Vercel

## 部署方式

### 🌟 Cloudflare Workers/Pages 部署（推荐）

**优势：**
- ✅ 完全免费（免费额度充足）
- ✅ 全球 CDN 加速
- ✅ 无需服务器
- ✅ 自动扩展
- ✅ 零冷启动

**快速开始：**

```bash
# 1. 安装依赖
pnpm install

# 2. 登录 Cloudflare
pnpm dlx wrangler login

# 3. 创建 KV 命名空间
pnpm dlx wrangler kv:namespace create "BOOKMARKS_KV"
pnpm dlx wrangler kv:namespace create "PLAZA_KV"

# 4. 更新 wrangler.toml 中的 KV ID
# 5. 部署
pnpm run deploy
```

📖 **详细文档：** [Cloudflare 部署指南](./CLOUDFLARE_DEPLOYMENT.md) | [快速开始](./QUICK_START.md)

### 🐳 Docker 部署

```bash
# 构建镜像
docker build -t bookmark-manager .

# 运行容器
docker run -p 3000:3000 bookmark-manager

# 多平台支持
docker run --privileged --rm tonistiigi/binfmt --install all
docker buildx create --name mybuilder --use
docker buildx build --platform linux/amd64,linux/arm64 -t bookmark-manager:1.0.0 .
```

**使用 docker-compose：**

```yaml
version: '3.3'
services:
  bookmark-manager:
    image: 'jiema66/bookmark-manager:1.0.1'
    container_name: bookmark-manager
    volumes:
      - './backups:/app/backups'
    ports:
      - '3000:3000'
    restart: unless-stopped
```

### 💻 本地开发

```bash
# 1. 克隆仓库
git clone <your-repo-url>
cd bookmark-manager

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm run dev

# 4. 访问应用
# http://localhost:3000
```

⚠️ **注意：** 本地开发模式下，云端备份和广场功能需要文件系统支持。要完整测试这些功能，请使用 Cloudflare 预览模式：

```bash
pnpm run preview
```


## 📸 功能截图

<details>
<summary>点击展开查看截图</summary>

![image.png](https://img.justnow.uk/2025/06/01115d0bc59da2bce2832be04b15066e.png)

![image.png](https://img.justnow.uk/2025/06/c3fc2d8b6ab58fa98d875c7efff8bafd.png)

![image.png](https://img.justnow.uk/2025/06/ac26290f27aa7f6e8148aaed6e98ce2c.png)

![image.png](https://img.justnow.uk/2025/06/71a7881ce05009048077b32876a69261.png)

![image.png](https://img.justnow.uk/2025/06/d39e1014affabce04ce5973327d4f57b.png)

![image.png](https://img.justnow.uk/2025/06/d54f2305909db9f3662e47d446d3966e.png)

</details>

