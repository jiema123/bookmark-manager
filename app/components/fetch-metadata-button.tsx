"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, LinkIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FetchMetadataButtonProps {
  url: string
  onFetchComplete: (metadata: { title: string; description: string; tags: string[] }) => void
  aiSettings: {
    enabled: boolean
    modelHost: string
    apiKey: string
    modelName: string
  }
  isDisabled?: boolean
}

export default function FetchMetadataButton({
  url,
  onFetchComplete,
  aiSettings,
  isDisabled = false,
}: FetchMetadataButtonProps) {
  const [isFetching, setIsFetching] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const { toast } = useToast()

  const fetchMetadata = async () => {
    if (!url || !url.startsWith("http")) {
      toast({
        title: "请输入有效的网址",
        description: "网址必须以 http:// 或 https:// 开头",
        variant: "destructive",
      })
      return
    }

    setIsFetching(true)
    setHasFetched(false)

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "请根据我提供的网址，利用联网搜索获取该网站的最新信息（包括官方介绍、核心功能、用户评价及背景），并严格按照以下模板撰写介绍，返回内容不超过200字，只返回结果不要做解释：\n**网站描述：[网站名称]**\n**概述：**\n[1-2句话概括网站的核心价值及主要功能，突出一句话介绍。]\n**关键特点：**\n* **[特点1]**：[简述优势]\n* **[特点2]**：[简述优势]\n* **[特点3]**：[简述优势]\n* **[特点4]**：[简述优势]\n**目标受众：**\n[列出适用人群及场景]\n**公司/站点信息：**\n[创始人/公司、成立时间、运营模式（免费/商业/开源）及背景]",
            },
            {
              role: "user",
              content: url,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data: any = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error("No content received from AI")
      }

      // Extract title from the specific format **网站描述：[Title]**
      const titleMatch = content.match(/\*\*网站描述：(.*?)\*\*/)
      const extractedTitle = titleMatch ? titleMatch[1].trim() : url

      // The description is the full content since it follows the template
      const description = content

      // The new prompt does not generate tags, so we return an empty list or try to extract if possible.
      // Given strict stricture, we simply return empty tags.
      const generatedTags: string[] = []

      onFetchComplete({
        title: extractedTitle,
        description: description,
        tags: generatedTags,
      })

      setHasFetched(true)
      toast({
        title: "网站信息获取成功",
        description: "已获取网站详细介绍",
      })
    } catch (error) {
      console.error("Fetch metadata error:", error)
      toast({
        title: "获取失败",
        description: error instanceof Error ? error.message : "无法获取网站信息",
        variant: "destructive",
      })
    } finally {
      setIsFetching(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={fetchMetadata}
      disabled={isFetching || isDisabled || !url}
      className={`${hasFetched ? "bg-green-700/50 border-green-600" : "bg-slate-700/50 border-slate-600"
        } text-white hover:bg-purple-700/50`}
    >
      {isFetching ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          获取中...
        </>
      ) : (
        <>
          <LinkIcon className="mr-2 h-4 w-4" />
          {hasFetched ? "已获取" : "获取网站信息"}
        </>
      )}
    </Button>
  )
}
