import { NextResponse } from "next/server"
import { PlazaManager } from "@/lib/kv-storage"

export const runtime = 'edge'

// GET - 获取广场书签列表
export async function GET(request: Request, context: { env: Env }) {
  try {
    const plazaManager = new PlazaManager(context.env.PLAZA_KV)
    const publicBookmarks = await plazaManager.getPublicBookmarks()

    return NextResponse.json({
      bookmarks: publicBookmarks,
      total: publicBookmarks.length,
    })
  } catch (error) {
    console.error("获取广场书签错误:", error)
    return NextResponse.json({ error: "获取书签列表失败" }, { status: 500 })
  }
}
