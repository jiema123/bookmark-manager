# 快速开始 - Cloudflare Workers 部署

## 🚀 5分钟快速部署

### 步骤 1: 安装依赖

```bash
pnpm install
```

### 步骤 2: 登录 Cloudflare

```bash
pnpm dlx wrangler login
```

### 步骤 3: 创建 KV 命名空间

```bash
# 创建生产环境 KV
pnpm dlx wrangler kv:namespace create "BOOKMARKS_KV"
pnpm dlx wrangler kv:namespace create "PLAZA_KV"

# 创建开发环境 KV（用于预览）
pnpm dlx wrangler kv:namespace create "BOOKMARKS_KV" --preview
pnpm dlx wrangler kv:namespace create "PLAZA_KV" --preview
```

记录下每个命令输出的 ID。

### 步骤 4: 更新 wrangler.toml

编辑 `wrangler.toml`，将 `your-kv-namespace-id` 等占位符替换为上一步得到的实际 ID：

```toml
[[kv_namespaces]]
binding = "BOOKMARKS_KV"
id = "你的BOOKMARKS_KV生产环境ID"  # 替换这里

[[kv_namespaces]]
binding = "PLAZA_KV"
id = "你的PLAZA_KV生产环境ID"      # 替换这里

[env.dev]
name = "bookmark-manager-dev"

[[env.dev.kv_namespaces]]
binding = "BOOKMARKS_KV"
id = "你的BOOKMARKS_KV开发环境ID"  # 替换这里

[[env.dev.kv_namespaces]]
binding = "PLAZA_KV"
id = "你的PLAZA_KV开发环境ID"      # 替换这里
```

### 步骤 5: 本地测试（可选）

```bash
pnpm run preview
```

访问 http://localhost:8788 查看效果。

### 步骤 6: 部署到 Cloudflare Pages

```bash
pnpm run deploy
```

部署成功后，会显示你的应用 URL，类似：
```
✨ Deployment complete! Take a peek over at https://xxxxxxxx.pages.dev
```

## 📝 后续配置

### 绑定自定义域名

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入你的 Pages 项目
3. **Settings** > **Custom domains** > **Set up a custom domain**
4. 输入你的域名并按照指引配置 DNS

### 配置 KV Bindings（如果使用 Git 集成部署）

如果你通过 Cloudflare Dashboard 连接 Git 仓库部署：

1. 进入项目的 **Settings** > **Functions**
2. 在 **KV namespace bindings** 部分点击 **Add binding**
3. 添加两个绑定：
   - Variable name: `BOOKMARKS_KV` → 选择对应的 KV 命名空间
   - Variable name: `PLAZA_KV` → 选择对应的 KV 命名空间

## 🔧 开发模式

### 使用 Next.js 开发服务器（不支持 KV）

```bash
pnpm run dev
```

⚠️ 注意：这个模式下 API 路由会报错，因为没有 KV 环境。仅用于前端 UI 开发。

### 使用 Cloudflare 本地环境（支持 KV）

```bash
pnpm run preview
```

这会启动一个模拟 Cloudflare Workers 环境的本地服务器，完整支持 KV 存储。

## 📊 监控和日志

查看部署日志：
```bash
pnpm dlx wrangler pages deployment list
```

查看实时日志：
```bash
pnpm dlx wrangler pages deployment tail
```

## ❓ 常见问题

### Q: 部署后 API 返回 500 错误

**A:** 检查 KV 命名空间绑定是否正确配置。在 Cloudflare Dashboard 的 Pages 项目设置中确认 `BOOKMARKS_KV` 和 `PLAZA_KV` 已正确绑定。

### Q: 如何迁移现有数据？

**A:** 
1. 从旧部署导出书签 JSON 文件
2. 在新部署中使用"导入"功能上传
3. 使用"云端备份"保存到 KV

### Q: 免费额度够用吗？

**A:** 完全够用！Cloudflare 免费套餐包括：
- 100,000 次请求/天
- 1 GB KV 存储
- 100,000 次 KV 读取/天
- 1,000 次 KV 写入/天

对于个人书签管理，这个额度绰绰有余。

### Q: 如何查看 KV 数据？

**A:** 使用 Wrangler CLI：

```bash
# 列出所有键
pnpm dlx wrangler kv:key list --namespace-id=你的KV命名空间ID

# 读取特定键的值
pnpm dlx wrangler kv:key get "键名" --namespace-id=你的KV命名空间ID
```

或在 Cloudflare Dashboard 的 **Workers & Pages** > **KV** 中查看。

## 🎯 下一步

- 📖 查看 [完整部署文档](./CLOUDFLARE_DEPLOYMENT.md)
- 🔐 设置分享密钥和显示名称
- 📦 导入现有书签
- 🌐 配置自定义域名

## 🆘 需要帮助？

- [Cloudflare Community](https://community.cloudflare.com/)
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [项目 Issues](https://github.com/your-repo/issues)
