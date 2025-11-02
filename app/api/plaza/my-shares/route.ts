import { NextResponse } from "next/server"
import { PlazaManager } from "@/lib/kv-storage"

export const runtime = 'edge'

// GET - 获取用户的分享列表
export async function GET(request: Request, context: { env: Env }) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    if (!secret) {
      return NextResponse.json({ error: "缺少分享密钥" }, { status: 400 })
    }

    const plazaManager = new PlazaManager(context.env.PLAZA_KV)
    const userBookmarks = await plazaManager.getMyShares(secret)

    return NextResponse.json({
      bookmarks: userBookmarks,
      total: userBookmarks.length,
    })
  } catch (error) {
    console.error("获取用户分享错误:", error)
    return NextResponse.json({ error: "获取分享列表失败" }, { status: 500 })
  }
}
