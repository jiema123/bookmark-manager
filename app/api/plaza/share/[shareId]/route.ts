import { type NextRequest, NextResponse } from "next/server"
import { writeFile, readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const PLAZA_INDEX_FILE = path.join(process.cwd(), "plaza", "index.json")

// DELETE - 删除分享的书签
export async function DELETE(request: NextRequest, { params }: { params: { shareId: string } }) {
  try {
    const { shareId } = params
    const { shareSecret } = await request.json()

    if (!shareSecret) {
      return NextResponse.json({ error: "缺少分享密钥" }, { status: 400 })
    }

    if (!existsSync(PLAZA_INDEX_FILE)) {
      return NextResponse.json({ error: "分享不存在" }, { status: 404 })
    }

    const data = await readFile(PLAZA_INDEX_FILE, "utf-8")
    const plazaData = JSON.parse(data)

    const shareIndex = plazaData.findIndex((item: any) => item.shareId === shareId)
    if (shareIndex === -1) {
      return NextResponse.json({ error: "分享不存在" }, { status: 404 })
    }

    // 验证删除权限
    if (plazaData[shareIndex].shareSecret !== shareSecret) {
      return NextResponse.json({ error: "分享密钥验证失败，无权删除此分享" }, { status: 401 })
    }

    // 删除分享
    plazaData.splice(shareIndex, 1)
    await writeFile(PLAZA_INDEX_FILE, JSON.stringify(plazaData, null, 2))

    return NextResponse.json({
      success: true,
      message: "分享删除成功",
    })
  } catch (error) {
    console.error("删除分享错误:", error)
    return NextResponse.json({ error: "删除失败，请稍后重试" }, { status: 500 })
  }
}
