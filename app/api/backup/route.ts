import { type NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { writeFile, readFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

const BACKUP_DIR = path.join(process.cwd(), "backups")

// 确保备份目录存在
async function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    await mkdir(BACKUP_DIR, { recursive: true })
  }
}

// 生成文件名 - 基于key和secret的MD5哈希
function generateFileName(key: string, secret: string): string {
  const hash = createHash("md5")
    .update(key + secret)
    .digest("hex")
  return `backup_${hash}.json`
}

// POST - 备份数据
export async function POST(request: NextRequest) {
  try {
    const { key, secret, data } = await request.json()

    if (!key || !secret || !data) {
      return NextResponse.json({ error: "缺少必要字段：key, secret, data" }, { status: 400 })
    }

    await ensureBackupDir()

    const fileName = generateFileName(key, secret)
    const filePath = path.join(BACKUP_DIR, fileName)

    // 生成用户标识哈希
    const userHash = createHash("md5")
      .update(key + secret)
      .digest("hex")

    const backupData = {
      bookmarks: data,
      updatedAt: new Date().toISOString(),
      userHash: userHash,
      metadata: {
        totalBookmarks: Array.isArray(data) ? data.length : 0,
        backupVersion: "1.0",
      },
    }

    await writeFile(filePath, JSON.stringify(backupData, null, 2))

    return NextResponse.json({
      success: true,
      message: "数据备份成功",
      hash: userHash.substring(0, 8), // 只返回部分哈希用于显示
      fileName: fileName,
      totalBookmarks: backupData.metadata.totalBookmarks,
    })
  } catch (error) {
    console.error("备份错误:", error)
    return NextResponse.json({ error: "备份失败，请稍后重试" }, { status: 500 })
  }
}

// GET - 恢复数据
export async function GET(request: NextRequest) {
  try {
    const key = request.headers.get("X-Cloud-Key")
    const secret = request.headers.get("X-Cloud-Secret")

    if (!key || !secret) {
      return NextResponse.json({ error: "缺少认证凭据" }, { status: 400 })
    }

    await ensureBackupDir()

    const fileName = generateFileName(key, secret)
    const filePath = path.join(BACKUP_DIR, fileName)

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "未找到对应的备份文件，请检查您的凭据是否正确" }, { status: 404 })
    }

    const backupData = JSON.parse(await readFile(filePath, "utf-8"))

    // 验证用户身份
    const expectedHash = createHash("md5")
      .update(key + secret)
      .digest("hex")

    if (backupData.userHash !== expectedHash) {
      return NextResponse.json({ error: "凭据验证失败" }, { status: 401 })
    }

    return NextResponse.json({
      bookmarks: backupData.bookmarks || [],
      updatedAt: backupData.updatedAt,
      metadata: backupData.metadata || {},
    })
  } catch (error) {
    console.error("恢复错误:", error)
    return NextResponse.json({ error: "数据恢复失败，请稍后重试" }, { status: 500 })
  }
}

// PUT - 更新备份
export async function PUT(request: NextRequest) {
  try {
    const { key, secret, data } = await request.json()

    if (!key || !secret || !data) {
      return NextResponse.json({ error: "缺少必要字段：key, secret, data" }, { status: 400 })
    }

    await ensureBackupDir()

    const fileName = generateFileName(key, secret)
    const filePath = path.join(BACKUP_DIR, fileName)

    // 检查备份是否存在
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "备份文件不存在，请先创建备份" }, { status: 404 })
    }

    // 验证现有备份
    const existingData = JSON.parse(await readFile(filePath, "utf-8"))
    const expectedHash = createHash("md5")
      .update(key + secret)
      .digest("hex")

    if (existingData.userHash !== expectedHash) {
      return NextResponse.json({ error: "凭据验证失败" }, { status: 401 })
    }

    // 更新备份
    const updatedData = {
      bookmarks: data,
      updatedAt: new Date().toISOString(),
      userHash: expectedHash,
      metadata: {
        totalBookmarks: Array.isArray(data) ? data.length : 0,
        backupVersion: "1.0",
        previousUpdate: existingData.updatedAt,
      },
    }

    await writeFile(filePath, JSON.stringify(updatedData, null, 2))

    return NextResponse.json({
      success: true,
      message: "备份更新成功",
      totalBookmarks: updatedData.metadata.totalBookmarks,
    })
  } catch (error) {
    console.error("更新错误:", error)
    return NextResponse.json({ error: "备份更新失败，请稍后重试" }, { status: 500 })
  }
}
