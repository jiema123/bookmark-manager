import { NextResponse } from "next/server"
import { PlazaManager } from "@/lib/kv-storage"

export const runtime = 'edge'

// POST - 分享书签到广场
export async function POST(request: Request, context: { env: Env }) {
  try {
    const { bookmark, shareSecret, displayName } = await request.json()

    if (!bookmark || !shareSecret) {
      return NextResponse.json({ error: "缺少必要字段：bookmark, shareSecret" }, { status: 400 })
    }

    // 验证书签数据
    if (!bookmark.title || !bookmark.url) {
      return NextResponse.json({ error: "书签数据不完整，缺少标题或链接" }, { status: 400 })
    }

    const plazaManager = new PlazaManager(context.env.PLAZA_KV)
    
    try {
      const result = await plazaManager.addShare(bookmark, shareSecret, displayName)
      
      return NextResponse.json({
        success: true,
        shareId: result.shareId,
        message: "书签分享成功",
        sharedBy: result.sharedBy,
      })
    } catch (error) {
      if (error instanceof Error && error.message === '您已经分享过这个书签了') {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      throw error
    }
  } catch (error) {
    console.error("分享错误:", error)
    return NextResponse.json({ error: "分享失败，请稍后重试" }, { status: 500 })
  }
}
