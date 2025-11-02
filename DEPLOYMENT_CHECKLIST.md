# 部署前检查清单

在部署到 Cloudflare Workers/Pages 之前，请确保完成以下步骤：

## ✅ 环境准备

- [ ] 已注册 Cloudflare 账号
- [ ] 已安装 Node.js 20 或更高版本
- [ ] 已安装 pnpm（`npm install -g pnpm`）
- [ ] 已安装 Wrangler CLI 或准备使用 `pnpm dlx wrangler`

## ✅ 本地配置

- [ ] 运行 `pnpm install` 安装所有依赖
- [ ] 验证 `package.json` 包含以下依赖：
  - `@cloudflare/next-on-pages`
  - `@cloudflare/workers-types`
  - `wrangler`

## ✅ KV 命名空间设置

### 1. 登录 Cloudflare
```bash
pnpm dlx wrangler login
```

### 2. 创建生产环境 KV
```bash
pnpm dlx wrangler kv:namespace create "BOOKMARKS_KV"
pnpm dlx wrangler kv:namespace create "PLAZA_KV"
```

记录输出的 ID：
- [ ] `BOOKMARKS_KV` 生产 ID: ________________
- [ ] `PLAZA_KV` 生产 ID: ________________

### 3. 创建开发环境 KV（可选，用于本地测试）
```bash
pnpm dlx wrangler kv:namespace create "BOOKMARKS_KV" --preview
pnpm dlx wrangler kv:namespace create "PLAZA_KV" --preview
```

记录输出的 ID：
- [ ] `BOOKMARKS_KV` 开发 ID: ________________
- [ ] `PLAZA_KV` 开发 ID: ________________

## ✅ 配置文件更新

### 编辑 `wrangler.toml`

替换以下占位符为实际的 KV 命名空间 ID：

```toml
[[kv_namespaces]]
binding = "BOOKMARKS_KV"
id = "你的BOOKMARKS_KV生产ID"  # 👈 在这里填写

[[kv_namespaces]]
binding = "PLAZA_KV"
id = "你的PLAZA_KV生产ID"      # 👈 在这里填写
```

如果要支持本地预览，也要更新 `[env.dev]` 部分：

```toml
[[env.dev.kv_namespaces]]
binding = "BOOKMARKS_KV"
id = "你的BOOKMARKS_KV开发ID"  # 👈 在这里填写

[[env.dev.kv_namespaces]]
binding = "PLAZA_KV"
id = "你的PLAZA_KV开发ID"      # 👈 在这里填写
```

- [ ] 已更新 `wrangler.toml` 中的所有 KV ID

## ✅ 本地测试（可选但推荐）

### 运行本地预览
```bash
pnpm run preview
```

- [ ] 本地预览成功启动
- [ ] 访问 http://localhost:8788 正常
- [ ] 测试添加书签功能
- [ ] 测试云端备份功能
- [ ] 测试广场分享功能

## ✅ 构建验证

### 构建项目
```bash
pnpm run pages:build
```

检查构建输出：
- [ ] 构建成功完成（无错误）
- [ ] 生成了 `.vercel/output/static` 目录
- [ ] 没有 TypeScript 错误
- [ ] 没有 ESLint 警告（或已确认可忽略）

## ✅ 部署到 Cloudflare

### 方式 A：使用命令行部署

```bash
pnpm run deploy
```

- [ ] 部署成功
- [ ] 记录部署 URL: ________________
- [ ] 访问部署 URL 正常

### 方式 B：通过 Dashboard Git 集成

1. 在 Cloudflare Dashboard 创建 Pages 项目
2. 连接 Git 仓库
3. 配置构建设置：
   - [ ] Build command: `pnpm run pages:build`
   - [ ] Build output directory: `.vercel/output/static`
   - [ ] Root directory: `/` (default)

4. 添加 KV 绑定：
   - [ ] 在 Settings > Functions > KV namespace bindings 添加
   - [ ] Variable name: `BOOKMARKS_KV` → 选择对应的 KV 命名空间
   - [ ] Variable name: `PLAZA_KV` → 选择对应的 KV 命名空间

5. 部署
   - [ ] 触发首次部署
   - [ ] 部署成功
   - [ ] 记录 URL: ________________

## ✅ 功能测试

访问部署的应用，测试以下功能：

### 基础功能
- [ ] 页面正常加载
- [ ] 添加新书签
- [ ] 编辑书签
- [ ] 删除书签
- [ ] 搜索书签
- [ ] 标签筛选

### 导入/导出
- [ ] 导出书签为 JSON
- [ ] 导入 JSON 文件
- [ ] 导入浏览器书签文件（HTML）

### 云端备份
- [ ] 设置云端凭据
- [ ] 备份到云端
- [ ] 从云端恢复
- [ ] 凭据验证正确

### 广场功能
- [ ] 设置分享密钥和显示名称
- [ ] 分享书签到广场
- [ ] 查看广场书签列表
- [ ] 查看我的分享
- [ ] 删除分享
- [ ] 批量删除分享

### AI 功能
- [ ] 配置 AI 设置
- [ ] 自动获取网页元数据

## ✅ 性能检查

- [ ] 首次加载时间 < 2 秒
- [ ] API 响应时间 < 500ms
- [ ] 搜索响应迅速
- [ ] 无明显的卡顿或延迟

## ✅ 监控和日志

### 查看部署日志
```bash
pnpm dlx wrangler pages deployment list
```

### 实时日志（可选）
```bash
pnpm dlx wrangler pages deployment tail
```

- [ ] 可以查看部署日志
- [ ] 没有错误或警告

## ✅ 域名配置（可选）

如果要使用自定义域名：

1. 在 Cloudflare Dashboard 的 Pages 项目中
2. Settings > Custom domains > Set up a custom domain
3. 添加你的域名
4. 配置 DNS（Cloudflare 会自动处理）

- [ ] 自定义域名已添加: ________________
- [ ] DNS 配置完成
- [ ] 自定义域名可访问

## ✅ 数据迁移（如果从旧版本迁移）

- [ ] 已从旧部署导出所有书签
- [ ] 已在新部署中导入数据
- [ ] 已验证数据完整性
- [ ] 已创建新的云端备份

## ✅ 文档和备份

- [ ] 保存 KV 命名空间 ID 到安全的地方
- [ ] 备份 `wrangler.toml` 配置
- [ ] 记录部署 URL 和自定义域名
- [ ] 更新团队文档（如果有）

## ✅ 清理工作

- [ ] 测试数据已清理
- [ ] 旧版本已停止（如果迁移）
- [ ] 更新任何指向旧 URL 的链接

## 🎉 部署完成！

恭喜！你的书签管理器现在运行在 Cloudflare 的全球边缘网络上了。

### 下一步建议：

1. **设置监控**
   - 在 Cloudflare Dashboard 查看分析数据
   - 设置告警（如果需要）

2. **优化配置**
   - 根据使用情况调整缓存策略
   - 考虑升级到付费版以获得更高配额

3. **备份策略**
   - 定期导出数据作为额外备份
   - 文档化恢复流程

4. **分享你的体验**
   - 向团队介绍新部署
   - 提交改进建议或 bug 报告

---

**需要帮助？**
- 📖 查看 [完整部署文档](./CLOUDFLARE_DEPLOYMENT.md)
- 🚀 查看 [快速开始指南](./QUICK_START.md)
- 🔄 查看 [迁移指南](./MIGRATION.md)
