import { NextResponse } from "next/server"
import { BackupManager } from "@/lib/kv-storage"

export const runtime = 'edge'

// POST - 备份数据
export async function POST(request: Request, context: { env: Env }) {
  try {
    const { key, secret, data } = await request.json()

    if (!key || !secret || !data) {
      return NextResponse.json({ error: "缺少必要字段：key, secret, data" }, { status: 400 })
    }

    const backupManager = new BackupManager(context.env.BOOKMARKS_KV)
    const result = await backupManager.saveBackup(key, secret, data)

    return NextResponse.json({
      success: true,
      message: "数据备份成功",
      hash: result.hash,
      totalBookmarks: result.totalBookmarks,
    })
  } catch (error) {
    console.error("备份错误:", error)
    return NextResponse.json({ error: "备份失败，请稍后重试" }, { status: 500 })
  }
}

// GET - 恢复数据
export async function GET(request: Request, context: { env: Env }) {
  try {
    const key = request.headers.get("X-Cloud-Key")
    const secret = request.headers.get("X-Cloud-Secret")

    if (!key || !secret) {
      return NextResponse.json({ error: "缺少认证凭据" }, { status: 400 })
    }

    const backupManager = new BackupManager(context.env.BOOKMARKS_KV)
    const result = await backupManager.getBackup(key, secret)

    if (!result) {
      return NextResponse.json({ error: "未找到对应的备份文件，请检查您的凭据是否正确" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("恢复错误:", error)
    if (error instanceof Error && error.message === '凭据验证失败') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "数据恢复失败，请稍后重试" }, { status: 500 })
  }
}

// PUT - 更新备份
export async function PUT(request: Request, context: { env: Env }) {
  try {
    const { key, secret, data } = await request.json()

    if (!key || !secret || !data) {
      return NextResponse.json({ error: "缺少必要字段：key, secret, data" }, { status: 400 })
    }

    const backupManager = new BackupManager(context.env.BOOKMARKS_KV)
    
    // 先检查是否存在
    const existing = await backupManager.getBackup(key, secret)
    if (!existing) {
      return NextResponse.json({ error: "备份文件不存在，请先创建备份" }, { status: 404 })
    }

    // 保存更新
    const result = await backupManager.saveBackup(key, secret, data)

    return NextResponse.json({
      success: true,
      message: "备份更新成功",
      totalBookmarks: result.totalBookmarks,
    })
  } catch (error) {
    console.error("更新错误:", error)
    if (error instanceof Error && error.message === '凭据验证失败') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: "备份更新失败，请稍后重试" }, { status: 500 })
  }
}
