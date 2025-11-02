/**
 * Cloudflare Workers 类型定义
 */

declare global {
  interface KVNamespace {
    get(key: string, type?: 'text'): Promise<string | null>
    get(key: string, type: 'json'): Promise<any>
    get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>
    get(key: string, type: 'stream'): Promise<ReadableStream | null>
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: {
      expiration?: number
      expirationTtl?: number
      metadata?: any
    }): Promise<void>
    delete(key: string): Promise<void>
    list(options?: {
      prefix?: string
      limit?: number
      cursor?: string
    }): Promise<{
      keys: { name: string; expiration?: number; metadata?: any }[]
      list_complete: boolean
      cursor?: string
    }>
  }

  interface Env {
    BOOKMARKS_KV: KVNamespace
    PLAZA_KV: KVNamespace
  }
}

export {}
