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
      // 1. 使用Jina AI获取网站描述
      let websiteTitle = ""
      let websiteDescription = ""

      try {
        const jinaResponse = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        })

        if (jinaResponse.ok) {
          const jinaData = await jinaResponse.json()
          websiteTitle = jinaData.data?.title || url
          websiteDescription = jinaData.data?.description || ""
        } else {
          console.error("Jina API返回错误:", await jinaResponse.text())
          throw new Error("无法获取网站信息")
        }
      } catch (error) {
        console.error("获取网站信息失败:", error)
        throw new Error("获取网站信息失败，请检查网址是否正确")
      }

      // 2. 如果AI功能启用，使用大模型生成标签
      let generatedTags: string[] = []

      if (aiSettings.enabled && websiteDescription) {
        try {
          const modelResponse = await fetch(aiSettings.modelHost + "/chat/completions", {
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
                  content:
                    '给定你一些网站的描述信息，判断总结出发当前网站是属于什么类型的网站，总结出3-5个标签，每个标签限定在2-4个字,如果是英文请翻译成中文再处理，返回一个JSON对象，格式为{"tags":["标签1","标签2","标签3"]}',
                },
                {
                  role: "user",
                  content: `标题: ${websiteTitle}\n描述: ${websiteDescription}`,
                },
              ],
            }),
          })

          if (modelResponse.ok) {
            const modelData = await modelResponse.json()
            const content = modelData.choices[0]?.message?.content

            try {
              // 尝试解析返回的JSON
              const parsedContent = JSON.parse(content)
              if (Array.isArray(parsedContent.tags)) {
                generatedTags = parsedContent.tags.filter((tag) => typeof tag === "string")
              }
            } catch (parseError) {
              // 如果解析失败，尝试从文本中提取标签
              console.error("解析AI返回内容失败:", parseError)
              const tagMatches = content.match(/"([^"]+)"/g)
              if (tagMatches) {
                generatedTags = tagMatches.map((match) => match.replace(/"/g, "")).filter(Boolean)
              }
            }
          } else {
            console.error("AI API返回错误:", await modelResponse.text())
          }
        } catch (error) {
          console.error("生成标签失败:", error)
          // 继续使用已获取的信息，但不生成标签
        }
      }

      // 3. 返回获取的数据
      onFetchComplete({
        title: websiteTitle || url,
        description: websiteDescription || "",
        tags: generatedTags,
      })

      setHasFetched(true)
      toast({
        title: "网站信息获取成功",
        description: generatedTags.length > 0 ? `已生成 ${generatedTags.length} 个标签` : "已获取网站描述",
      })
    } catch (error) {
      console.error("获取元数据错误:", error)
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
      className={`${
        hasFetched ? "bg-green-700/50 border-green-600" : "bg-slate-700/50 border-slate-600"
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
