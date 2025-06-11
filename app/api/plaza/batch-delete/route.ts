import { type NextRequest, NextResponse } from "next/server"
import { writeFile, readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const PLAZA_INDEX_FILE = path.join(process.cwd(), "plaza", "index.json")

// DELETE - 批量删除分享
export async function DELETE(request: NextRequest) {
  try {
    const { shareIds, shareSecret } = await request.json()

    if (!shareIds || !Array.isArray(shareIds) || shareIds.length === 0) {
      return NextResponse.json({ error: "缺少要删除的分享ID列表" }, { status: 400 })
    }

    if (!shareSecret) {
      return NextResponse.json({ error: "缺少分享密钥" }, { status: 400 })
    }

    if (!existsSync(PLAZA_INDEX_FILE)) {
      return NextResponse.json({ error: "没有找到分享数据" }, { status: 404 })
    }

    const data = await readFile(PLAZA_INDEX_FILE, "utf-8")
    let plazaData = JSON.parse(data)

    let deletedCount = 0
    const failedIds: string[] = []

    // 筛选出要删除的分享并验证权限
    plazaData = plazaData.filter((item: any) => {
      if (shareIds.includes(item.shareId)) {
        // 验证删除权限
        if (item.shareSecret === shareSecret) {
          deletedCount++
          return false // 删除此项
        } else {
          failedIds.push(item.shareId)
          return true // 保留此项
        }
      }
      return true // 保留此项
    })

    // 写回文件
    await writeFile(PLAZA_INDEX_FILE, JSON.stringify(plazaData, null, 2))

    return NextResponse.json({
      success: true,
      message: `批量删除完成`,
      deletedCount,
      failedCount: failedIds.length,
      failedIds: failedIds.length > 0 ? failedIds : undefined,
    })
  } catch (error) {
    console.error("批量删除错误:", error)
    return NextResponse.json({ error: "批量删除失败，请稍后重试" }, { status: 500 })
  }
}
