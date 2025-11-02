# Cloudflare Workers/Pages 部署指南

本项目已经改造为支持部署到 Cloudflare Workers 和 Cloudflare Pages。

## 前提条件

1. 注册 [Cloudflare](https://dash.cloudflare.com/) 账号
2. 安装 Node.js 20+ 和 pnpm
3. 安装 Wrangler CLI: `pnpm install -g wrangler`

## 部署步骤

### 1. 创建 KV 命名空间

首先登录 Cloudflare:
```bash
wrangler login
```

创建两个 KV 命名空间（生产环境）:
```bash
# 书签备份存储
wrangler kv:namespace create "BOOKMARKS_KV"

# 广场分享存储
wrangler kv:namespace create "PLAZA_KV"
```

创建开发环境的 KV 命名空间:
```bash
wrangler kv:namespace create "BOOKMARKS_KV" --preview
wrangler kv:namespace create "PLAZA_KV" --preview
```

记录输出的 KV Namespace ID，你会得到类似这样的输出：
```
✨ Success!
Add the following to your wrangler.toml:
{ binding = "BOOKMARKS_KV", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

### 2. 配置 wrangler.toml

打开 `wrangler.toml` 文件，替换占位符 ID：

```toml
[[kv_namespaces]]
binding = "BOOKMARKS_KV"
id = "你的生产环境BOOKMARKS_KV的ID"  # 替换这里

[[kv_namespaces]]
binding = "PLAZA_KV"
id = "你的生产环境PLAZA_KV的ID"  # 替换这里

# 开发环境配置
[env.dev]
name = "bookmark-manager-dev"

[[env.dev.kv_namespaces]]
binding = "BOOKMARKS_KV"
id = "你的开发环境BOOKMARKS_KV的ID"  # 替换这里

[[env.dev.kv_namespaces]]
binding = "PLAZA_KV"
id = "你的开发环境PLAZA_KV的ID"  # 替换这里
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 本地开发测试

```bash
# 使用 Cloudflare Pages 开发服务器
pnpm run preview
```

这会启动一个本地开发服务器，模拟 Cloudflare Workers 环境。

### 5. 部署到 Cloudflare Pages

#### 方式一：使用命令行部署

```bash
# 构建并部署
pnpm run deploy
```

#### 方式二：通过 Cloudflare Dashboard 连接 Git 仓库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** > **Create Application** > **Pages** > **Connect to Git**
3. 选择你的 Git 仓库
4. 配置构建设置：
   - **Framework preset**: Next.js
   - **Build command**: `pnpm run pages:build`
   - **Build output directory**: `.vercel/output/static`
5. 添加环境变量（KV Bindings）：
   - 在 **Settings** > **Functions** > **KV namespace bindings** 中添加：
     - `BOOKMARKS_KV` -> 选择对应的 KV 命名空间
     - `PLAZA_KV` -> 选择对应的 KV 命名空间
6. 点击 **Save and Deploy**

### 6. 验证部署

部署完成后，访问分配的 URL（如 `https://bookmark-manager.pages.dev`），测试以下功能：

- ✅ 添加/编辑/删除书签
- ✅ 导入/导出书签
- ✅ 云端备份/恢复
- ✅ 分享到广场
- ✅ 查看广场书签

## 关键改造点

### 1. 移除文件系统依赖

原项目使用 Node.js 的 `fs` 模块进行文件操作，已替换为 Cloudflare KV 存储：

- **备份数据**: 存储在 `BOOKMARKS_KV` 中
- **广场数据**: 存储在 `PLAZA_KV` 中

### 2. 使用 Edge Runtime

所有 API 路由都添加了：
```typescript
export const runtime = 'edge'
```

这确保代码在 Cloudflare Workers 环境中运行。

### 3. KV 存储适配器

创建了 `lib/kv-storage.ts` 提供统一的存储接口：

- `BackupManager`: 管理备份数据
- `PlazaManager`: 管理广场分享数据

### 4. API 路由改造

所有 API 路由都已改造为接收 `context.env` 参数来访问 KV 命名空间：

```typescript
export async function GET(request: Request, context: { env: Env }) {
  const kv = context.env.BOOKMARKS_KV
  // ...
}
```

## 环境变量

无需额外环境变量，KV 命名空间通过 `wrangler.toml` 配置。

## 成本说明

Cloudflare Workers/Pages 免费套餐包括：

- **Workers 请求**: 100,000 次/天
- **KV 读取**: 100,000 次/天
- **KV 写入**: 1,000 次/天
- **KV 存储**: 1 GB

对于个人书签管理应用，免费套餐完全够用。

## 故障排除

### 问题：API 路由返回 500 错误

**解决方案**：检查 KV 命名空间绑定是否正确配置。

### 问题：本地开发无法访问 KV

**解决方案**：确保使用 `pnpm run preview` 而不是 `pnpm run dev`。

### 问题：部署后数据丢失

**解决方案**：
1. 检查是否使用了正确的 KV 命名空间 ID
2. 确保生产环境和开发环境使用不同的 KV 命名空间

## 迁移现有数据

如果你之前使用文件系统部署，可以通过以下方式迁移数据：

1. 导出现有书签为 JSON 文件
2. 在新部署中导入 JSON 文件
3. 使用云端备份功能保存到 KV

## 更多资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers KV 文档](https://developers.cloudflare.com/kv/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

## 技术支持

如遇问题，请查看：

1. Cloudflare Dashboard 中的部署日志
2. 浏览器控制台的错误信息
3. Wrangler CLI 的输出信息
