"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface AISettings {
  enabled: boolean
  modelHost: string
  apiKey: string
  modelName: string
}

interface AISettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: AISettings
  onSave: (settings: AISettings) => void
}

export default function AISettingsDialog({ open, onOpenChange, settings, onSave }: AISettingsDialogProps) {
  const [aiSettings, setAISettings] = useState<AISettings>(settings)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<"success" | "error" | null>(null)
  const { toast } = useToast()

  const handleToggleEnabled = (checked: boolean) => {
    setAISettings((prev) => ({ ...prev, enabled: checked }))
  }

  const validateSettings = async () => {
    if (!aiSettings.enabled) {
      toast({
        title: "AI功能已禁用",
        description: "请先启用AI功能再进行验证",
      })
      return
    }

    if (!aiSettings.modelHost || !aiSettings.apiKey || !aiSettings.modelName) {
      toast({
        title: "验证失败",
        description: "请填写完整的AI配置信息",
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      // 发送一个简单的请求来验证API连接
      const response = await fetch(aiSettings.modelHost + "/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiSettings.apiKey}`,
        },
        body: JSON.stringify({
          model: aiSettings.modelName,
          messages: [
            {
              role: "system",
              content: "This is a test message to verify the API connection. Please respond with a short message.",
            },
            {
              role: "user",
              content: "Test connection",
            },
          ],
        }),
      })

      if (response.ok) {
        setValidationResult("success")
        toast({
          title: "验证成功",
          description: "AI模型配置有效",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Unknown error")
      }
    } catch (error) {
      console.error("AI模型验证错误:", error)
      setValidationResult("error")
      toast({
        title: "验证失败",
        description: error instanceof Error ? error.message : "无法连接到AI模型",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleSaveSettings = () => {
    onSave(aiSettings)
    toast({
      title: "设置已保存",
      description: aiSettings.enabled ? "AI功能已启用" : "AI功能已禁用",
    })
  }

  const resetToDefaults = () => {
    setAISettings({
      enabled: true,
      modelHost: "https://openkey.cloud/v1",
      apiKey: "sk-0AGhSrqYzhL09KSe81FfB0D5EeE34eCf970a4b0494C14c4e",
      modelName: "gpt-3.5-turbo",
    })
    toast({
      title: "已重置为默认设置",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-purple-600 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M12 7V13M12 13H16M12 13L8 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            AI 模型设置
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="ai-enabled" checked={aiSettings.enabled} onCheckedChange={handleToggleEnabled} />
            <Label htmlFor="ai-enabled" className="text-white cursor-pointer">
              启用 AI 辅助功能
            </Label>
          </div>

          <div className="text-sm text-purple-200 bg-purple-900/30 p-3 rounded-lg">
            <p>AI 功能可以自动获取网页描述和生成标签。</p>
            <p>如不设置，将使用默认配置。</p>
          </div>

          <div>
            <Label htmlFor="modelHost" className="text-white">
              API 地址
            </Label>
            <Input
              id="modelHost"
              value={aiSettings.modelHost}
              onChange={(e) => setAISettings((prev) => ({ ...prev, modelHost: e.target.value }))}
              placeholder="https://openkey.cloud/v1"
              className="mt-1 bg-slate-700 border-purple-600 text-white"
              disabled={!aiSettings.enabled}
            />
          </div>

          <div>
            <Label htmlFor="apiKey" className="text-white">
              API 密钥
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={aiSettings.apiKey}
              onChange={(e) => setAISettings((prev) => ({ ...prev, apiKey: e.target.value }))}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxx"
              className="mt-1 bg-slate-700 border-purple-600 text-white"
              disabled={!aiSettings.enabled}
            />
          </div>

          <div>
            <Label htmlFor="modelName" className="text-white">
              模型名称
            </Label>
            <Input
              id="modelName"
              value={aiSettings.modelName}
              onChange={(e) => setAISettings((prev) => ({ ...prev, modelName: e.target.value }))}
              placeholder="gpt-3.5-turbo"
              className="mt-1 bg-slate-700 border-purple-600 text-white"
              disabled={!aiSettings.enabled}
            />
          </div>

          <div className="flex justify-between gap-3">
            <Button
              onClick={validateSettings}
              disabled={isValidating || !aiSettings.enabled}
              variant="outline"
              className="flex-1 bg-purple-800/50 border-purple-600 text-white hover:bg-purple-700/50"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  验证中...
                </>
              ) : validationResult === "success" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-400" />
                  验证成功
                </>
              ) : validationResult === "error" ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4 text-red-400" />
                  验证失败
                </>
              ) : (
                "验证连接"
              )}
            </Button>
            <Button
              onClick={resetToDefaults}
              variant="outline"
              className="flex-1 bg-purple-800/50 border-purple-600 text-white hover:bg-purple-700/50"
            >
              重置默认
            </Button>
          </div>

          <Button
            onClick={handleSaveSettings}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            保存设置
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
