import type { Request as CfRequest, ExecutionContext } from '@cloudflare/workers-types'

/**
 * Cloudflare Pages 函数绑定
 * 这个文件处理 Next.js API 路由到 Cloudflare Workers 的适配
 */

declare module 'next' {
  export interface NextRequest extends Request {
    env?: Env & {
      BROWSERLESS_TOKENS?: string;
    }
  }
}

// 扩展 context 类型以包含 env
declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env { }
  }
}

export { }
