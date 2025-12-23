/**
 * Cloudflare KV Storage 适配器
 * 替代文件系统操作
 */

export interface KVStorageOptions {
  BOOKMARKS_KV?: KVNamespace
  PLAZA_KV?: KVNamespace
}

// 备份数据的键名前缀
const BACKUP_PREFIX = 'backup:'
// 广场数据的键名
const PLAZA_INDEX_KEY = 'plaza:index'

/**
 * 生成备份键名
 */
export async function generateBackupKey(key: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key + secret)

  try {
    const hash = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hash))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return `${BACKUP_PREFIX}${hashHex}`
  } catch {
    return `${BACKUP_PREFIX}${key}_${secret}`
  }
}

/**
 * 备份管理器
 */
export class BackupManager {
  constructor(private kv: KVNamespace) { }

  /**
   * 保存备份
   */
  async saveBackup(key: string, secret: string, data: any) {
    const backupKey = await generateBackupKey(key, secret)

    const userHash = await this.generateUserHash(key, secret)

    const backupData = {
      bookmarks: data,
      updatedAt: new Date().toISOString(),
      userHash,
      metadata: {
        totalBookmarks: Array.isArray(data) ? data.length : 0,
        backupVersion: '1.0',
      },
    }

    await this.kv.put(backupKey, JSON.stringify(backupData))

    return {
      success: true,
      hash: userHash.substring(0, 8),
      totalBookmarks: backupData.metadata.totalBookmarks,
    }
  }

  /**
   * 获取备份
   */
  async getBackup(key: string, secret: string) {
    const backupKey = await generateBackupKey(key, secret)
    const data = await this.kv.get(backupKey, 'text')

    if (!data) {
      return null
    }

    const backupData = JSON.parse(data)
    const expectedHash = await this.generateUserHash(key, secret)

    if (backupData.userHash !== expectedHash) {
      throw new Error('凭据验证失败')
    }

    return {
      bookmarks: backupData.bookmarks || [],
      updatedAt: backupData.updatedAt,
      metadata: backupData.metadata || {},
    }
  }

  /**
   * 生成用户哈希
   */
  private async generateUserHash(key: string, secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(key + secret)
    const hash = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hash))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}

/**
 * 广场管理器
 */
export class PlazaManager {
  constructor(private kv: KVNamespace) { }

  /**
   * 获取广场索引
   */
  async getIndex(): Promise<any[]> {
    if (!this.kv) {
      console.warn('PLAZA_KV not bound, returning empty list')
      return []
    }
    const data = await this.kv.get(PLAZA_INDEX_KEY, 'text')
    return data ? JSON.parse(data) : []
  }

  /**
   * 保存广场索引
   */
  async saveIndex(data: any[]) {
    await this.kv.put(PLAZA_INDEX_KEY, JSON.stringify(data))
  }

  /**
   * 添加分享
   */
  async addShare(bookmark: any, shareSecret: string, displayName?: string) {
    const sharedByHash = await this.generateHash(shareSecret)
    const shareId = await this.generateHash(
      bookmark.id + bookmark.title + bookmark.url + shareSecret + Date.now()
    )

    const sharedBookmark = {
      shareId,
      bookmark: {
        ...bookmark,
        id: shareId,
      },
      sharedBy: displayName || sharedByHash.substring(0, 8),
      sharedAt: new Date().toISOString(),
      shareSecret,
      likes: 0,
    }

    const plazaData = await this.getIndex()

    // 检查是否已分享
    const existingShare = plazaData.find(
      (item: any) => item.bookmark.url === bookmark.url && item.shareSecret === shareSecret
    )

    if (existingShare) {
      throw new Error('您已经分享过这个书签了')
    }

    plazaData.push(sharedBookmark)
    await this.saveIndex(plazaData)

    return {
      success: true,
      shareId,
      sharedBy: sharedBookmark.sharedBy,
    }
  }

  /**
   * 获取公开书签列表
   */
  async getPublicBookmarks() {
    const plazaData = await this.getIndex()

    // 移除敏感信息
    const publicBookmarks = plazaData.map((item: any) => ({
      shareId: item.shareId,
      ...item.bookmark,
      sharedBy: item.sharedBy,
      sharedAt: item.sharedAt,
      likes: item.likes || 0,
    }))

    // 按分享时间倒序
    publicBookmarks.sort((a: any, b: any) =>
      new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime()
    )

    return publicBookmarks
  }

  /**
   * 获取我的分享
   */
  async getMyShares(shareSecret: string) {
    const plazaData = await this.getIndex()
    const myShares = plazaData.filter((item: any) => item.shareSecret === shareSecret)

    return myShares.map((item: any) => ({
      shareId: item.shareId,
      ...item.bookmark,
      sharedBy: item.sharedBy,
      sharedAt: item.sharedAt,
      likes: item.likes || 0,
      shareSecret: item.shareSecret,
    }))
  }

  /**
   * 删除分享
   */
  async deleteShare(shareId: string, shareSecret: string) {
    const plazaData = await this.getIndex()
    const share = plazaData.find((item: any) => item.shareId === shareId)

    if (!share) {
      throw new Error('分享不存在')
    }

    if (share.shareSecret !== shareSecret) {
      throw new Error('密钥错误')
    }

    const newData = plazaData.filter((item: any) => item.shareId !== shareId)
    await this.saveIndex(newData)

    return { success: true }
  }

  /**
   * 批量删除分享
   */
  async batchDeleteShares(shareIds: string[], shareSecret: string) {
    const plazaData = await this.getIndex()

    // 验证所有分享是否属于该用户
    for (const shareId of shareIds) {
      const share = plazaData.find((item: any) => item.shareId === shareId)
      if (!share || share.shareSecret !== shareSecret) {
        throw new Error(`无权删除分享: ${shareId}`)
      }
    }

    const newData = plazaData.filter((item: any) => !shareIds.includes(item.shareId))
    await this.saveIndex(newData)

    return {
      success: true,
      deleted: shareIds.length
    }
  }

  /**
   * 生成哈希
   */
  private async generateHash(input: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hash = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hash))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}
