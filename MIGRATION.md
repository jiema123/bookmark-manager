# 迁移指南

本文档说明了如何将项目从文件系统存储迁移到 Cloudflare Workers/Pages。

## 主要改造内容

### 1. 存储层改造

#### 之前（文件系统）
```typescript
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const filePath = path.join(process.cwd(), 'backups', 'data.json')
await writeFile(filePath, JSON.stringify(data))
const data = await readFile(filePath, 'utf-8')
```

#### 之后（Cloudflare KV）
```typescript
import { BackupManager } from '@/lib/kv-storage'

const backupManager = new BackupManager(env.BOOKMARKS_KV)
await backupManager.saveBackup(key, secret, data)
const data = await backupManager.getBackup(key, secret)
```

### 2. API 路由改造

#### 之前
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // 使用文件系统
  const data = await readFile(...)
  return NextResponse.json(data)
}
```

#### 之后
```typescript
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: Request, context: { env: Env }) {
  // 使用 KV 存储
  const data = await context.env.BOOKMARKS_KV.get(...)
  return NextResponse.json(data)
}
```

### 3. 加密算法更新

由于 Cloudflare Workers 不支持 Node.js 的 `crypto` 模块中的 MD5，改用 Web Crypto API 的 SHA-256：

#### 之前
```typescript
import { createHash } from 'crypto'

const hash = createHash('md5')
  .update(input)
  .digest('hex')
```

#### 之后
```typescript
const encoder = new TextEncoder()
const data = encoder.encode(input)
const hashBuffer = await crypto.subtle.digest('SHA-256', data)
const hashArray = Array.from(new Uint8Array(hashBuffer))
const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
```

## 数据迁移步骤

如果你已经在使用文件系统版本并有数据需要迁移：

### 方式一：使用导出/导入功能

1. **导出现有数据**
   - 在旧部署中，点击"导出"按钮保存所有书签为 JSON 文件
   - 如果有云端备份，使用"从云端恢复"功能导出数据

2. **部署到 Cloudflare**
   - 按照 [QUICK_START.md](./QUICK_START.md) 部署新版本

3. **导入数据**
   - 在新部署中，使用"导入"功能上传 JSON 文件
   - 使用"云端备份"功能将数据保存到 KV

### 方式二：直接迁移 KV 数据（高级）

如果你有大量数据，可以使用 Wrangler CLI 批量导入：

1. **导出现有备份数据**
   ```bash
   # 从旧部署的 backups 目录获取所有 JSON 文件
   ```

2. **转换格式**
   ```javascript
   // convert.js
   const fs = require('fs')
   const files = fs.readdirSync('./backups')
   
   files.forEach(file => {
     const data = JSON.parse(fs.readFileSync(`./backups/${file}`))
     const key = file.replace('backup_', '').replace('.json', '')
     console.log(JSON.stringify({ key, value: JSON.stringify(data) }))
   })
   ```

3. **批量导入 KV**
   ```bash
   node convert.js | while read line; do
     key=$(echo $line | jq -r '.key')
     value=$(echo $line | jq -r '.value')
     wrangler kv:key put "backup:$key" "$value" --namespace-id=你的KV命名空间ID
   done
   ```

### 方式三：保持双部署（过渡期）

在迁移期间，可以同时运行两个版本：

1. **旧版本（Docker/Node.js）** - 继续使用文件系统
2. **新版本（Cloudflare）** - 逐步迁移数据

定期在旧版本导出数据，在新版本导入，直到完全迁移完成。

## 兼容性说明

### 完全兼容的功能
- ✅ 书签增删改查
- ✅ 标签管理
- ✅ 搜索和筛选
- ✅ 导入/导出
- ✅ 云端备份/恢复
- ✅ 广场分享
- ✅ AI 元数据抓取

### 行为变化
- 🔄 加密哈希：MD5 → SHA-256（不影响现有功能，但生成的密钥哈希不同）
- 🔄 存储位置：文件系统 → Cloudflare KV

### 不兼容的部分
- ❌ 直接访问文件系统的代码（已全部移除）
- ❌ Node.js 特定的模块（如 `fs`, `path`, `crypto.createHash`）

## 验证迁移

迁移完成后，请验证以下功能：

1. **基本功能**
   - [ ] 添加新书签
   - [ ] 编辑书签
   - [ ] 删除书签
   - [ ] 搜索书签

2. **批量操作**
   - [ ] 批量导入书签
   - [ ] 批量导出书签
   - [ ] 批量删除书签

3. **云端功能**
   - [ ] 云端备份
   - [ ] 从云端恢复
   - [ ] 设置云端凭据

4. **广场功能**
   - [ ] 分享书签到广场
   - [ ] 查看广场书签
   - [ ] 查看我的分享
   - [ ] 删除我的分享

5. **AI 功能**
   - [ ] 配置 AI 设置
   - [ ] 自动获取元数据

## 回滚方案

如果迁移后发现问题，可以快速回滚：

1. **保留旧部署**
   - 在确认新部署稳定前，不要停止旧版本

2. **数据同步**
   - 定期将 Cloudflare 版本的数据导出备份

3. **快速回滚**
   ```bash
   # 如果使用 Docker
   docker start <旧容器ID>
   
   # 如果使用 Node.js
   cd <旧项目目录>
   pnpm start
   ```

## 性能对比

| 指标 | 文件系统版本 | Cloudflare 版本 |
|------|------------|----------------|
| 冷启动时间 | 2-5秒 | <100ms |
| 全球响应延迟 | 取决于服务器位置 | <50ms（边缘网络）|
| 并发处理 | 受服务器限制 | 自动扩展 |
| 成本 | 服务器费用 | 免费额度内 $0 |
| 可靠性 | 单点故障风险 | 99.9%+ SLA |

## 常见问题

### Q: 迁移后原来的云端备份还能用吗？

A: 不能直接使用。由于哈希算法从 MD5 改为 SHA-256，生成的备份键名不同。建议：
1. 在旧版本中导出所有数据
2. 在新版本中重新创建云端备份

### Q: 迁移会影响正在使用的用户吗？

A: 如果使用域名切换：
1. 先部署新版本到临时域名
2. 验证功能正常
3. 更新 DNS 指向新部署
4. DNS 传播期间（几分钟）可能有短暂切换

建议在低峰期进行切换。

### Q: 数据安全吗？

A: Cloudflare KV 提供：
- ✅ 自动加密存储
- ✅ 全球冗余备份
- ✅ 符合 GDPR/SOC2 标准
- ✅ 99.9%+ 可用性保证

你的备份密钥始终由你控制，Cloudflare 无法解密你的数据。

### Q: 如何监控 KV 使用情况？

A: 在 Cloudflare Dashboard 查看：
1. 进入 **Workers & Pages** > **KV**
2. 选择你的命名空间
3. 查看使用统计（读/写次数、存储大小）

## 技术支持

遇到迁移问题？

1. 查看 [故障排除文档](./CLOUDFLARE_DEPLOYMENT.md#故障排除)
2. 检查 Cloudflare Dashboard 的部署日志
3. 提交 Issue 并附上错误信息

## 下一步

迁移完成后：
- 🎯 设置自定义域名
- 📊 配置监控和告警
- 🔐 备份 KV 命名空间 ID
- 📝 更新团队文档
