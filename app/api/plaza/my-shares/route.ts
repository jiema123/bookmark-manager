import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const PLAZA_INDEX_FILE = path.join(process.cwd(), "plaza", "index.json")

// GET - 获取用户的分享列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    if (!secret) {
      return NextResponse.json({ error: "缺少分享密钥" }, { status: 400 })
    }

    if (!existsSync(PLAZA_INDEX_FILE)) {
      return NextResponse.json({ bookmarks: [] })
    }

    const data = await readFile(PLAZA_INDEX_FILE, "utf-8")
    const plazaData = JSON.parse(data)

    // 筛选出用户的分享
    const userShares = plazaData.filter((item: any) => item.shareSecret === secret)

    // 返回用户分享的书签（包含shareSecret用于前端验证）
    const userBookmarks = userShares.map((item: any) => ({
      shareId: item.shareId,
      ...item.bookmark,
      sharedBy: item.sharedBy,
      sharedAt: item.sharedAt,
      likes: item.likes || 0,
      shareSecret: item.shareSecret,
    }))

    // 按分享时间倒序排列
    userBookmarks.sort((a: any, b: any) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime())

    return NextResponse.json({
      bookmarks: userBookmarks,
      total: userBookmarks.length,
    })
  } catch (error) {
    console.error("获取用户分享错误:", error)
    return NextResponse.json({ error: "获取分享列表失败" }, { status: 500 })
  }
}
