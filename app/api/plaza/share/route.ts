import { type NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { writeFile, readFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const PLAZA_DIR = path.join(process.cwd(), "plaza")
const PLAZA_INDEX_FILE = path.join(PLAZA_DIR, "index.json")

interface SharedBookmark {
  shareId: string
  bookmark: any
  sharedBy: string
  sharedAt: string
  shareSecret: string
  likes: number
}

// 确保广场目录存在
async function ensurePlazaDir() {
  if (!existsSync(PLAZA_DIR)) {
    await mkdir(PLAZA_DIR, { recursive: true })
  }
}

// 读取广场索引
async function readPlazaIndex(): Promise<SharedBookmark[]> {
  if (!existsSync(PLAZA_INDEX_FILE)) {
    return []
  }
  try {
    const data = await readFile(PLAZA_INDEX_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("读取广场索引失败:", error)
    return []
  }
}

// 写入广场索引
async function writePlazaIndex(data: SharedBookmark[]) {
  await writeFile(PLAZA_INDEX_FILE, JSON.stringify(data, null, 2))
}

// POST - 分享书签到广场
export async function POST(request: NextRequest) {
  try {
    const { bookmark, shareSecret, displayName } = await request.json()

    if (!bookmark || !shareSecret) {
      return NextResponse.json({ error: "缺少必要字段：bookmark, shareSecret" }, { status: 400 })
    }

    // 验证书签数据
    if (!bookmark.title || !bookmark.url) {
      return NextResponse.json({ error: "书签数据不完整，缺少标题或链接" }, { status: 400 })
    }

    await ensurePlazaDir()

    // 生成分享者标识（基于shareSecret的哈希）
    const sharedByHash = createHash("md5").update(shareSecret).digest("hex")

    // 生成唯一的分享ID
    const shareId = createHash("md5")
      .update(bookmark.id + bookmark.title + bookmark.url + shareSecret + Date.now())
      .digest("hex")

    const sharedBookmark: SharedBookmark = {
      shareId,
      bookmark: {
        ...bookmark,
        id: shareId, // 使用新的ID
      },
      sharedBy: displayName || sharedByHash.substring(0, 8), // 使用显示名称或哈希前8位
      sharedAt: new Date().toISOString(),
      shareSecret: shareSecret, // 存储完整的分享密钥用于验证删除权限
      likes: 0,
    }

    const plazaData = await readPlazaIndex()

    // 检查是否已经分享过相同的书签
    const existingShare = plazaData.find(
      (item) => item.bookmark.url === bookmark.url && item.shareSecret === shareSecret,
    )

    if (existingShare) {
      return NextResponse.json({ error: "您已经分享过这个书签了" }, { status: 409 })
    }

    plazaData.push(sharedBookmark)
    await writePlazaIndex(plazaData)

    return NextResponse.json({
      success: true,
      shareId,
      message: "书签分享成功",
      sharedBy: sharedBookmark.sharedBy,
    })
  } catch (error) {
    console.error("分享错误:", error)
    return NextResponse.json({ error: "分享失败，请稍后重试" }, { status: 500 })
  }
}
