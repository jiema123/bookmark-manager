import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const PLAZA_INDEX_FILE = path.join(process.cwd(), "plaza", "index.json")

// GET - 获取广场书签列表
export async function GET(request: NextRequest) {
  try {
    if (!existsSync(PLAZA_INDEX_FILE)) {
      return NextResponse.json({ bookmarks: [] })
    }

    const data = await readFile(PLAZA_INDEX_FILE, "utf-8")
    const plazaData = JSON.parse(data)

    // 移除敏感信息，只返回公开数据
    const publicBookmarks = plazaData.map((item: any) => ({
      shareId: item.shareId,
      ...item.bookmark,
      sharedBy: item.sharedBy,
      sharedAt: item.sharedAt,
      likes: item.likes || 0,
      // 不返回 shareSecret
    }))

    // 按分享时间倒序排列
    publicBookmarks.sort((a: any, b: any) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime())

    return NextResponse.json({
      bookmarks: publicBookmarks,
      total: publicBookmarks.length,
    })
  } catch (error) {
    console.error("获取广场书签错误:", error)
    return NextResponse.json({ error: "获取书签列表失败" }, { status: 500 })
  }
}
