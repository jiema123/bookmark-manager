import { NextResponse } from "next/server"
import { PlazaManager } from "@/lib/kv-storage"

export const runtime = 'edge'

// 获取环境绑定
function getEnv(request: Request): Env {
  return (request as any).env || (globalThis as any).process?.env || {}
}

// DELETE - 批量删除分享
export async function DELETE(request: Request) {
  try {
    const { shareIds, shareSecret } = await request.json()

    if (!shareIds || !Array.isArray(shareIds) || shareIds.length === 0) {
      return NextResponse.json({ error: "缺少要删除的分享ID列表" }, { status: 400 })
    }

    if (!shareSecret) {
      return NextResponse.json({ error: "缺少分享密钥" }, { status: 400 })
    }

    const env = getEnv(request)
    const plazaManager = new PlazaManager(env.PLAZA_KV)
    
    try {
      const result = await plazaManager.batchDeleteShares(shareIds, shareSecret)
      
      return NextResponse.json({
        success: true,
        message: `批量删除完成`,
        deletedCount: result.deleted,
      })
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 401 })
      }
      throw error
    }
  } catch (error) {
    console.error("批量删除错误:", error)
    return NextResponse.json({ error: "批量删除失败，请稍后重试" }, { status: 500 })
  }
}
