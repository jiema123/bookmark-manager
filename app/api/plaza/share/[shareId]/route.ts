import { NextResponse } from "next/server"
import { PlazaManager } from "@/lib/kv-storage"

export const runtime = 'edge'

// DELETE - 删除分享的书签
export async function DELETE(
  request: Request, 
  context: { params: { shareId: string }, env: Env }
) {
  try {
    const { shareId } = context.params
    const { shareSecret } = await request.json()

    if (!shareSecret) {
      return NextResponse.json({ error: "缺少分享密钥" }, { status: 400 })
    }

    const plazaManager = new PlazaManager(context.env.PLAZA_KV)
    
    try {
      await plazaManager.deleteShare(shareId, shareSecret)
      
      return NextResponse.json({
        success: true,
        message: "分享删除成功",
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === '分享不存在') {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        if (error.message === '密钥错误') {
          return NextResponse.json({ error: "分享密钥验证失败，无权删除此分享" }, { status: 401 })
        }
      }
      throw error
    }
  } catch (error) {
    console.error("删除分享错误:", error)
    return NextResponse.json({ error: "删除失败，请稍后重试" }, { status: 500 })
  }
}
