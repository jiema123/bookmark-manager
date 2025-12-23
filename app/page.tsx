"use client"

import { Toaster } from "@/components/ui/toaster"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import {
  Plus,
  Download,
  Upload,
  Cloud,
  Share2,
  Globe,
  Trash2,
  Edit3,
  ExternalLink,
  Heart,
  Star,
  Filter,
  Home,
  Sparkles,
  Settings,
  Search,
  Eye,
  EyeOff,
  Tags,
  X,
  Cpu,
  CheckSquare,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import AISettingsDialog from "./components/ai-settings-dialog"
import FetchMetadataButton from "./components/fetch-metadata-button"
import BatchManageDialog from "./components/batch-manage-dialog"
import SnowEffect from "./components/snow-effect"

interface Bookmark {
  id: string
  title: string
  url: string
  image?: string
  tags: string[]
  description?: string
  createdAt: string
  updatedAt: string
}

interface CloudSettings {
  key: string
  secret: string
}

interface AISettings {
  enabled: boolean
  modelHost: string
  apiKey: string
  modelName: string
}

interface SharedBookmark extends Bookmark {
  shareId: string
  sharedBy: string
  sharedAt: string
  likes: number
  shareSecret?: string // 用于删除的密钥
}

interface ShareSettings {
  shareSecret: string
  displayName: string
}

export default function BookmarkManager() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  // 修改初始状态，默认选中"全部"标签
  const [selectedTags, setSelectedTags] = useState<string[]>(["全部"])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCloudDialogOpen, setIsCloudDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isManageSharesDialogOpen, setIsManageSharesDialogOpen] = useState(false)
  const [isAISettingsDialogOpen, setIsAISettingsDialogOpen] = useState(false)
  const [isBatchManageDialogOpen, setIsBatchManageDialogOpen] = useState(false)
  const [isTagSelectorOpen, setIsTagSelectorOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [sharingBookmark, setSharingBookmark] = useState<Bookmark | null>(null)
  const [cloudSettings, setCloudSettings] = useState<CloudSettings>({ key: "", secret: "" })
  const [shareSettings, setShareSettings] = useState<ShareSettings>({ shareSecret: "", displayName: "" })
  const [aiSettings, setAISettings] = useState<AISettings>({
    enabled: false,
    modelHost: "https://openkey.cloud/v1",
    apiKey: "sk-0AGhSrqYzhL09KSe81FfB0D5EeE34eCf970a4b0494C14c4e",
    modelName: "gpt-3.5-turbo",
  })
  const [sharedBookmarks, setSharedBookmarks] = useState<SharedBookmark[]>([])
  const [mySharedBookmarks, setMySharedBookmarks] = useState<SharedBookmark[]>([])
  const [activeTab, setActiveTab] = useState("plaza")
  const [plazaSearchQuery, setPlazaSearchQuery] = useState("")
  const [plazaSelectedTags, setPlazaSelectedTags] = useState<string[]>(["全部"])
  const [selectedShares, setSelectedShares] = useState<string[]>([])
  const [showMySharesOnly, setShowMySharesOnly] = useState(false)
  const [deleteSecret, setDeleteSecret] = useState("")
  const [showDeleteSecret, setShowDeleteSecret] = useState(false)
  const [currentEditingTags, setCurrentEditingTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isEditingMode, setIsEditingMode] = useState(false)
  const { toast } = useToast()

  // 新书签表单状态
  const [newBookmark, setNewBookmark] = useState({
    title: "",
    url: "",
    image: "",
    tags: "",
    description: "",
  })

  // 预设标签
  const presetTags = [
    "开源",
    "设计",
    "灵感"
  ]

  // 从localStorage加载数据
  useEffect(() => {
    const savedBookmarks = localStorage.getItem("bookmarks")
    const savedCloudSettings = localStorage.getItem("cloudSettings")
    const savedShareSettings = localStorage.getItem("shareSettings")
    const savedAISettings = localStorage.getItem("aiSettings")

    if (savedBookmarks) {
      try {
        const parsed = JSON.parse(savedBookmarks)
        if (Array.isArray(parsed)) {
          setBookmarks(parsed)
        }
      } catch (error) {
        console.error("Failed to parse saved bookmarks:", error)
        localStorage.removeItem("bookmarks")
      }
    }
    if (savedCloudSettings) {
      try {
        setCloudSettings(JSON.parse(savedCloudSettings))
      } catch (error) {
        console.error("Failed to parse cloud settings:", error)
        localStorage.removeItem("cloudSettings")
      }
    }
    if (savedShareSettings) {
      try {
        setShareSettings(JSON.parse(savedShareSettings))
      } catch (error) {
        console.error("Failed to parse share settings:", error)
        localStorage.removeItem("shareSettings")
      }
    }
    if (savedAISettings) {
      try {
        setAISettings(JSON.parse(savedAISettings))
      } catch (error) {
        console.error("Failed to parse AI settings:", error)
        localStorage.removeItem("aiSettings")
      }
    }
  }, [])
  // Fetch plaza bookmarks when tab changes
  useEffect(() => {
    if (activeTab === "plaza") {
      fetchPlazaBookmarks()
    }
  }, [activeTab])

  // 保存到localStorage
  const saveToStorage = (data: Bookmark[]) => {
    localStorage.setItem("bookmarks", JSON.stringify(data))
    setBookmarks(data)
  }

  // 获取所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    bookmarks.forEach((bookmark) => {
      bookmark.tags.forEach((tag) => tags.add(tag))
    })
    // 合并预设标签和用户标签
    presetTags.forEach((tag) => tags.add(tag))
    return Array.from(tags).sort()
  }, [bookmarks])

  // 获取广场所有标签
  const plazaTags = useMemo(() => {
    const tags = new Set<string>()
    sharedBookmarks.forEach((bookmark) => {
      bookmark.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags)
  }, [sharedBookmarks])

  // 过滤书签
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((bookmark) => {
      // 搜索匹配逻辑
      const matchesSearch =
        searchQuery === "" ||
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      // 标签匹配逻辑 - 使用 OR 关系
      // 如果没有选择标签或者选择了"全部"标签，则显示所有书签
      // 否则，只要书签包含任一选中的标签即可
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.includes("全部") ||
        selectedTags.some((tag) => bookmark.tags.includes(tag))

      return matchesSearch && matchesTags
    })
  }, [bookmarks, searchQuery, selectedTags])

  // 过滤广场书签
  const filteredPlazaBookmarks = useMemo(() => {
    let filtered = sharedBookmarks

    // 如果显示我的分享，先过滤
    if (showMySharesOnly && shareSettings.shareSecret) {
      filtered = filtered.filter((bookmark) => bookmark.shareSecret === shareSettings.shareSecret)
    }

    // 搜索过滤
    if (plazaSearchQuery) {
      filtered = filtered.filter(
        (bookmark) =>
          bookmark.title.toLowerCase().includes(plazaSearchQuery.toLowerCase()) ||
          bookmark.description?.toLowerCase().includes(plazaSearchQuery.toLowerCase()) ||
          bookmark.tags.some((tag) => tag.toLowerCase().includes(plazaSearchQuery.toLowerCase())) ||
          bookmark.sharedBy.toLowerCase().includes(plazaSearchQuery.toLowerCase()),
      )
    }

    // 标签过滤 - 使用 OR 关系
    if (plazaSelectedTags.length > 0 && !plazaSelectedTags.includes("全部")) {
      filtered = filtered.filter((bookmark) => plazaSelectedTags.some((tag) => bookmark.tags.includes(tag)))
    }

    return filtered
  }, [sharedBookmarks, plazaSearchQuery, plazaSelectedTags, showMySharesOnly, shareSettings.shareSecret])

  // 打开标签选择器
  const openTagSelector = (isEdit = false) => {
    setIsEditingMode(isEdit)
    if (isEdit && editingBookmark) {
      setCurrentEditingTags([...editingBookmark.tags])
    } else {
      // 解析新书签的标签
      const tags = newBookmark.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
      setCurrentEditingTags(tags)
    }
    setTagInput("")
    setIsTagSelectorOpen(true)
  }

  // 切换标签选择
  const toggleTagInSelector = (tag: string) => {
    setCurrentEditingTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  // 添加新标签
  const addNewTag = () => {
    const newTag = tagInput.trim()
    if (newTag && !currentEditingTags.includes(newTag)) {
      setCurrentEditingTags((prev) => [...prev, newTag])
      setTagInput("")
    }
  }

  // 移除标签
  const removeTag = (tag: string) => {
    setCurrentEditingTags((prev) => prev.filter((t) => t !== tag))
  }

  // 确认标签选择
  const confirmTagSelection = () => {
    if (isEditingMode && editingBookmark) {
      setEditingBookmark((prev) => (prev ? { ...prev, tags: currentEditingTags } : null))
    } else {
      setNewBookmark((prev) => ({ ...prev, tags: currentEditingTags.join(", ") }))
    }
    setIsTagSelectorOpen(false)
  }

  // 处理网站元数据获取
  const handleMetadataFetch = (metadata: { title: string; description: string; tags: string[] }) => {
    if (isEditingMode && editingBookmark) {
      // 如果是编辑模式
      setEditingBookmark((prev) => {
        if (!prev) return null
        return {
          ...prev,
          title: metadata.title || prev.title,
          description: metadata.description || prev.description,
          tags: [...new Set([...prev.tags, ...metadata.tags])],
        }
      })
    } else {
      // 如果是添加模式
      setNewBookmark((prev) => ({
        ...prev,
        title: metadata.title || prev.title,
        description: metadata.description || prev.description,
        tags: [
          ...metadata.tags,
          ...(prev.tags
            ? prev.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
            : []),
        ].join(", "),
      }))
    }
  }

  // 添加书签
  const addBookmark = () => {
    if (!newBookmark.title || !newBookmark.url) {
      toast({
        title: "错误",
        description: "标题和链接不能为空",
        variant: "destructive",
      })
      return
    }

    const bookmark: Bookmark = {
      id: Date.now().toString(),
      title: newBookmark.title,
      url: newBookmark.url,
      image: newBookmark.image || undefined,
      tags: newBookmark.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      description: newBookmark.description || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updatedBookmarks = [...bookmarks, bookmark]
    saveToStorage(updatedBookmarks)

    setNewBookmark({ title: "", url: "", image: "", tags: "", description: "" })
    setIsAddDialogOpen(false)

    toast({
      title: "成功",
      description: "书签已添加",
    })
  }

  // 编辑书签
  const updateBookmark = () => {
    if (!editingBookmark) return

    const updatedBookmarks = bookmarks.map((bookmark) =>
      bookmark.id === editingBookmark.id ? { ...editingBookmark, updatedAt: new Date().toISOString() } : bookmark,
    )

    saveToStorage(updatedBookmarks)
    setEditingBookmark(null)
    setIsEditDialogOpen(false)

    toast({
      title: "成功",
      description: "书签已更新",
    })
  }

  // 删除书签
  const deleteBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter((bookmark) => bookmark.id !== id)
    saveToStorage(updatedBookmarks)

    toast({
      title: "成功",
      description: "书签已删除",
    })
  }

  // 批量删除书签
  const handleBatchDelete = (ids: string[]) => {
    const updatedBookmarks = bookmarks.filter((bookmark) => !ids.includes(bookmark.id))
    saveToStorage(updatedBookmarks)
  }

  // 批量删除标签
  const handleBatchDeleteTags = (updatedBookmarks: Bookmark[]) => {
    const bookmarkMap = new Map(updatedBookmarks.map((bookmark) => [bookmark.id, bookmark]))
    const newBookmarks = bookmarks.map((bookmark) => bookmarkMap.get(bookmark.id) || bookmark)
    saveToStorage(newBookmarks)
  }

  // 批量分享书签
  const handleBatchShare = async (bookmarksToShare: Bookmark[]) => {
    if (!shareSettings.shareSecret) {
      toast({
        title: "错误",
        description: "请先设置分享密钥",
        variant: "destructive",
      })
      return
    }

    let successCount = 0
    let failCount = 0

    for (const bookmark of bookmarksToShare) {
      try {
        const response = await fetch("/api/plaza/share", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookmark,
            shareSecret: shareSettings.shareSecret,
            displayName: shareSettings.displayName || "匿名用户",
          }),
        })

        if (response.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        failCount++
      }
    }

    if (successCount > 0) {
      toast({
        title: "分享完成",
        description: `成功分享 ${successCount} 个书签${failCount > 0 ? `，失败 ${failCount} 个` : ""}`,
      })
      // 刷新广场数据
      fetchPlazaBookmarks()
    } else {
      toast({
        title: "分享失败",
        description: "所有书签分享失败，请检查网络连接",
        variant: "destructive",
      })
    }
  }

  // 导出数据
  const exportData = () => {
    const dataStr = JSON.stringify(bookmarks, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `bookmarks-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "成功",
      description: "数据已导出",
    })
  }

  // 解析HTML书签文件
  const parseBookmarksHTML = (htmlContent: string): Bookmark[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, "text/html")
    const bookmarks: Bookmark[] = []

    // 递归解析书签，支持文件夹结构
    const parseBookmarkNode = (node: Element, folderPath: string[] = []) => {
      const links = node.querySelectorAll("a")
      const folders = node.querySelectorAll("dt > h3")

      // 处理书签链接
      links.forEach((link, index) => {
        const href = link.getAttribute("href")
        const title = link.textContent?.trim()

        if (href && title && href.startsWith("http")) {
          const bookmark: Bookmark = {
            id: `imported_${Date.now()}_${index}_${Math.random()}`,
            title: title,
            url: href,
            tags: folderPath.length > 0 ? [...folderPath] : ["导入"],
            description: link.getAttribute("description") || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          bookmarks.push(bookmark)
        }
      })

      // 处理文件夹
      folders.forEach((folder) => {
        const folderName = folder.textContent?.trim()
        if (folderName) {
          const nextDL = folder.parentElement?.nextElementSibling
          if (nextDL && nextDL.tagName === "DL") {
            parseBookmarkNode(nextDL, [...folderPath, folderName])
          }
        }
      })
    }

    // 开始解析
    const bookmarksList = doc.querySelector("dl")
    if (bookmarksList) {
      parseBookmarkNode(bookmarksList)
    }

    return bookmarks
  }

  // 导入浏览器收藏夹
  const importBrowserBookmarks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result
        if (typeof result !== "string") {
          throw new Error("文件读取失败")
        }

        let processedData: Bookmark[]

        // 检查文件类型
        if (file.name.toLowerCase().endsWith(".html") || file.name.toLowerCase().endsWith(".htm")) {
          // HTML书签文件
          processedData = parseBookmarksHTML(result)
        } else {
          // JSON文件
          try {
            const importedData = JSON.parse(result)
            if (Array.isArray(importedData)) {
              processedData = importedData
                .filter((item) => item.title && item.url)
                .map((item, index) => ({
                  id: item.id || `imported_${Date.now()}_${index}`,
                  title: String(item.title || "未命名书签"),
                  url: String(item.url || ""),
                  image: item.image ? String(item.image) : undefined,
                  tags: Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === "string") : ["导入"],
                  description: item.description ? String(item.description) : undefined,
                  createdAt: item.createdAt || new Date().toISOString(),
                  updatedAt: item.updatedAt || new Date().toISOString(),
                }))
            } else {
              throw new Error("不支持的JSON格式")
            }
          } catch (parseError) {
            throw new Error("文件格式不正确")
          }
        }

        if (processedData.length === 0) {
          throw new Error("没有找到有效的书签数据")
        }

        // 检查重复
        const existingUrls = new Set(bookmarks.map((b) => b.url))
        const newBookmarks = processedData.filter((bookmark) => !existingUrls.has(bookmark.url))
        const duplicateCount = processedData.length - newBookmarks.length

        if (newBookmarks.length === 0) {
          toast({
            title: "提示",
            description: "所有书签都已存在，没有导入新的书签",
          })
          return
        }

        const mergedBookmarks = [...bookmarks, ...newBookmarks]
        saveToStorage(mergedBookmarks)

        let message = `成功导入 ${newBookmarks.length} 个书签`
        if (duplicateCount > 0) {
          message += `，跳过 ${duplicateCount} 个重复书签`
        }

        toast({
          title: "导入成功",
          description: message,
        })
      } catch (error) {
        console.error("Import error:", error)
        toast({
          title: "导入失败",
          description: error instanceof Error ? error.message : "文件格式不正确或数据无效",
          variant: "destructive",
        })
      }
    }

    reader.onerror = () => {
      toast({
        title: "错误",
        description: "文件读取失败",
        variant: "destructive",
      })
    }

    reader.readAsText(file, "UTF-8")
    // 清空文件输入，允许重复选择同一文件
    event.target.value = ""
  }

  // 导入数据 - 修复版本
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result
        if (typeof result !== "string") {
          throw new Error("文件读取失败")
        }

        let importedData
        try {
          importedData = JSON.parse(result)
        } catch (parseError) {
          throw new Error("JSON格式无效")
        }

        // 支持多种格式的书签导入
        let processedData: Bookmark[]

        if (Array.isArray(importedData)) {
          // 检查是否是我们的格式
          if (importedData.length > 0 && importedData[0].id && importedData[0].title && importedData[0].url) {
            // 验证并清理数据
            processedData = importedData
              .filter((item) => item.title && item.url) // 过滤无效数据
              .map((item, index) => ({
                id: item.id || `imported_${Date.now()}_${index}`,
                title: String(item.title || "未命名书签"),
                url: String(item.url || ""),
                image: item.image ? String(item.image) : undefined,
                tags: Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === "string") : [],
                description: item.description ? String(item.description) : undefined,
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.updatedAt || new Date().toISOString(),
              }))
          } else {
            // 尝试转换其他格式（如浏览器书签）
            processedData = importedData
              .filter((item) => (item.name || item.title) && (item.url || item.href)) // 过滤无效数据
              .map((item, index) => ({
                id: `imported_${Date.now()}_${index}`,
                title: String(item.name || item.title || "未命名书签"),
                url: String(item.url || item.href || ""),
                image: item.image ? String(item.image) : undefined,
                tags: Array.isArray(item.tags) ? item.tags.filter((tag) => typeof tag === "string") : [],
                description: item.description ? String(item.description) : undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }))
          }
        } else if (importedData && typeof importedData === "object") {
          // 单个书签对象
          if (importedData.title && importedData.url) {
            processedData = [
              {
                id: importedData.id || `imported_${Date.now()}`,
                title: String(importedData.title),
                url: String(importedData.url),
                image: importedData.image ? String(importedData.image) : undefined,
                tags: Array.isArray(importedData.tags)
                  ? importedData.tags.filter((tag) => typeof tag === "string")
                  : [],
                description: importedData.description ? String(importedData.description) : undefined,
                createdAt: importedData.createdAt || new Date().toISOString(),
                updatedAt: importedData.updatedAt || new Date().toISOString(),
              },
            ]
          } else {
            throw new Error("书签数据格式不正确")
          }
        } else {
          throw new Error("不支持的文件格式")
        }

        if (processedData.length === 0) {
          throw new Error("没有找到有效的书签数据")
        }

        // 检查重复
        const existingUrls = new Set(bookmarks.map((b) => b.url))
        const newBookmarks = processedData.filter((bookmark) => !existingUrls.has(bookmark.url))
        const duplicateCount = processedData.length - newBookmarks.length

        if (newBookmarks.length === 0) {
          toast({
            title: "提示",
            description: "所有书签都已存在，没有导入新的书签",
          })
          return
        }

        const mergedBookmarks = [...bookmarks, ...newBookmarks]
        saveToStorage(mergedBookmarks)

        let message = `成功导入 ${newBookmarks.length} 个书签`
        if (duplicateCount > 0) {
          message += `，跳过 ${duplicateCount} 个重复书签`
        }

        toast({
          title: "导入成功",
          description: message,
        })
      } catch (error) {
        console.error("Import error:", error)
        toast({
          title: "导入失败",
          description: error instanceof Error ? error.message : "文件格式不正确或数据无效",
          variant: "destructive",
        })
      }
    }

    reader.onerror = () => {
      toast({
        title: "错误",
        description: "文件读取失败",
        variant: "destructive",
      })
    }

    reader.readAsText(file, "UTF-8")
    // 清空文件输入，允许重复选择同一文件
    event.target.value = ""
  }

  // 云端备份
  const backupToCloud = async () => {
    if (!cloudSettings.key || !cloudSettings.secret) {
      toast({
        title: "错误",
        description: "请先设置云端凭据",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/backup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: cloudSettings.key,
          secret: cloudSettings.secret,
          data: bookmarks,
        }),
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: "数据已备份到云端",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Backup failed")
      }
    } catch (error) {
      toast({
        title: "错误",
        description: `云端备份失败: ${error instanceof Error ? error.message : "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 从云端恢复
  const restoreFromCloud = async () => {
    if (!cloudSettings.key || !cloudSettings.secret) {
      toast({
        title: "错误",
        description: "请先设置云端凭据",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/backup", {
        method: "GET",
        headers: {
          "X-Cloud-Key": cloudSettings.key,
          "X-Cloud-Secret": cloudSettings.secret,
        },
      })

      if (response.ok) {
        const data = await response.json()
        saveToStorage(data.bookmarks)
        toast({
          title: "成功",
          description: "数据已从云端恢复",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Restore failed")
      }
    } catch (error) {
      toast({
        title: "错误",
        description: `云端恢复失败: ${error instanceof Error ? error.message : "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 保存云端设置
  const saveCloudSettings = () => {
    localStorage.setItem("cloudSettings", JSON.stringify(cloudSettings))
    setIsCloudDialogOpen(false)
    toast({
      title: "成功",
      description: "云端设置已保存",
    })
  }

  // 保存AI设置
  const saveAISettings = (settings: AISettings) => {
    setAISettings(settings)
    localStorage.setItem("aiSettings", JSON.stringify(settings))
    setIsAISettingsDialogOpen(false)
  }

  // 保存分享设置
  const saveShareSettings = () => {
    if (!shareSettings.shareSecret) {
      toast({
        title: "错误",
        description: "请设置分享密钥",
        variant: "destructive",
      })
      return
    }

    localStorage.setItem("shareSettings", JSON.stringify(shareSettings))
    toast({
      title: "成功",
      description: "分享设置已保存",
    })
  }

  // 分享到广场
  const shareToPlaza = async (bookmark: Bookmark) => {
    if (!shareSettings.shareSecret) {
      toast({
        title: "错误",
        description: "请先设置分享密钥",
        variant: "destructive",
      })
      setSharingBookmark(bookmark)
      setIsShareDialogOpen(true)
      return
    }

    try {
      const response = await fetch("/api/plaza/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookmark,
          shareSecret: shareSettings.shareSecret,
          displayName: shareSettings.displayName || "匿名用户",
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "成功",
          description: "书签已分享到广场",
        })
        // 刷新广场数据
        fetchPlazaBookmarks()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Share failed")
      }
    } catch (error) {
      toast({
        title: "错误",
        description: `分享失败: ${error instanceof Error ? error.message : "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 确认分享
  const confirmShare = async () => {
    if (!sharingBookmark) return

    // 保存分享设置
    localStorage.setItem("shareSettings", JSON.stringify(shareSettings))

    // 执行分享
    await shareToPlaza(sharingBookmark)

    // 关闭对话框
    setIsShareDialogOpen(false)
    setSharingBookmark(null)
  }

  // 获取广场书签
  const fetchPlazaBookmarks = async () => {
    try {
      const response = await fetch("/api/plaza/bookmarks")
      if (response.ok) {
        const data = await response.json()
        setSharedBookmarks(data.bookmarks || [])
      } else {
        console.error("Failed to fetch plaza bookmarks")
      }
    } catch (error) {
      console.error("Failed to fetch plaza bookmarks:", error)
    }
  }

  // 获取我的分享
  const fetchMyShares = async () => {
    if (!shareSettings.shareSecret) {
      toast({
        title: "提示",
        description: "请先设置分享密钥",
      })
      return
    }

    try {
      const response = await fetch(`/api/plaza/my-shares?secret=${encodeURIComponent(shareSettings.shareSecret)}`)
      if (response.ok) {
        const data = await response.json()
        setMySharedBookmarks(data.bookmarks || [])
      }
    } catch (error) {
      console.error("Failed to fetch my shares:", error)
    }
  }

  // 删除单个分享
  const deleteShare = async (shareId: string) => {
    if (!deleteSecret) {
      toast({
        title: "错误",
        description: "请输入删除密钥",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/plaza/share/${shareId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shareSecret: deleteSecret,
        }),
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: "分享已删除",
        })
        // 刷新数据
        fetchPlazaBookmarks()
        fetchMyShares()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Delete failed")
      }
    } catch (error) {
      toast({
        title: "错误",
        description: `删除失败: ${error instanceof Error ? error.message : "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 批量删除分享
  const batchDeleteShares = async () => {
    if (selectedShares.length === 0) {
      toast({
        title: "提示",
        description: "请选择要删除的分享",
      })
      return
    }

    if (!deleteSecret) {
      toast({
        title: "错误",
        description: "请输入删除密钥",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/plaza/batch-delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shareIds: selectedShares,
          shareSecret: deleteSecret,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "成功",
          description: `已删除 ${result.deletedCount} 个分享`,
        })
        // 清空选择
        setSelectedShares([])
        // 刷新数据
        fetchPlazaBookmarks()
        fetchMyShares()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Batch delete failed")
      }
    } catch (error) {
      toast({
        title: "错误",
        description: `批量删除失败: ${error instanceof Error ? error.message : "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 修改 toggleTag 函数，处理"全部"标签的特殊逻辑
  const toggleTag = (tag: string) => {
    if (tag === "全部") {
      setSelectedTags(["全部"])
      return
    }

    setSelectedTags((prev) => {
      // 如果之前选择了"全部"，现在选择了具体标签，则移除"全部"
      if (prev.includes("全部")) {
        return [tag]
      }

      // 如果已经选择了这个标签，则移除它
      if (prev.includes(tag)) {
        const newTags = prev.filter((t) => t !== tag)
        // 如果移除后没有标签了，则显示"全部"
        return newTags.length === 0 ? ["全部"] : newTags
      }

      // 否则添加这个标签
      return [...prev, tag]
    })
  }

  // 同样修改广场标签切换函数
  const togglePlazaTag = (tag: string) => {
    if (tag === "全部") {
      setPlazaSelectedTags(["全部"])
      return
    }

    setPlazaSelectedTags((prev) => {
      // 如果之前选择了"全部"，现在选择了具体标签，则移除"全部"
      if (prev.includes("全部")) {
        return [tag]
      }

      // 如果已经选择了这个标签，则移除它
      if (prev.includes(tag)) {
        const newTags = prev.filter((t) => t !== tag)
        // 如果移除后没有标签了，则显示"全部"
        return newTags.length === 0 ? ["全部"] : newTags
      }

      // 否则添加这个标签
      return [...prev, tag]
    })
  }

  // 切换分享选择
  const toggleShareSelection = (shareId: string) => {
    setSelectedShares((prev) => (prev.includes(shareId) ? prev.filter((id) => id !== shareId) : [...prev, shareId]))
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedShares.length === filteredPlazaBookmarks.length) {
      setSelectedShares([])
    } else {
      setSelectedShares(filteredPlazaBookmarks.map((bookmark) => bookmark.shareId))
    }
  }

  // 获取域名图标
  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return "/placeholder.svg?height=32&width=32"
    }
  }

  // 在分享书签但没有设置密钥时显示的对话框
  const confirmShareWithoutKey = async () => {
    if (!sharingBookmark) return

    // 保存分享设置
    localStorage.setItem("shareSettings", JSON.stringify(shareSettings))

    // 执行分享
    await shareToPlaza(sharingBookmark)

    // 关闭对话框
    setIsShareDialogOpen(false)
    setSharingBookmark(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      <SnowEffect />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">个人导航</h1>
            <script defer src="https://umami-jiema66.env.pm/script.js" data-website-id="188469dd-eaf0-4e5d-9cd9-d93cd78fbf79"></script>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="bg-purple-800/50 border-purple-600 text-white hover:bg-purple-700/50"
              onClick={() => setActiveTab("my-bookmarks")}
            >
              <Home className="w-4 h-4 mr-2" />
              我的主页
            </Button>
            <Button
              variant="outline"
              className="bg-purple-800/50 border-purple-600 text-white hover:bg-purple-700/50"
              onClick={() => {
                setActiveTab("plaza")
                fetchPlazaBookmarks()
              }}
            >
              <Globe className="w-4 h-4 mr-2" />
              书签广场
            </Button>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsContent value="my-bookmarks" className="space-y-8">
              {/* 标语 */}
              <div className="text-center py-12">
                <h2 className="text-4xl font-bold text-white mb-4">智能管理您的常用网页和资源</h2>
              </div>

              {/* 功能按钮组 */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <>
                  <Button
                    onClick={() => document.getElementById("import-file-input")?.click()}
                    variant="outline"
                    className="bg-purple-800/30 border-purple-600/50 text-white hover:bg-purple-700/50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    导入书签
                  </Button>
                  <input
                    id="import-file-input"
                    type="file"
                    accept=".json,.txt"
                    onChange={importData}
                    className="hidden"
                  />
                </>
                <>
                  <Button
                    onClick={() => document.getElementById("import-browser-bookmarks-input")?.click()}
                    variant="outline"
                    className="bg-purple-800/30 border-purple-600/50 text-white hover:bg-purple-700/50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    导入浏览器收藏夹
                  </Button>
                  <input
                    id="import-browser-bookmarks-input"
                    type="file"
                    accept=".html,.htm"
                    onChange={importBrowserBookmarks}
                    className="hidden"
                  />
                </>
                <Button
                  onClick={exportData}
                  variant="outline"
                  className="bg-purple-800/30 border-purple-600/50 text-white hover:bg-purple-700/50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  导出JSON
                </Button>
                <Dialog open={isCloudDialogOpen} onOpenChange={setIsCloudDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-purple-800/30 border-purple-600/50 text-white hover:bg-purple-700/50"
                    >
                      <Cloud className="w-4 h-4 mr-2" />
                      云端备份
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-purple-600">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center gap-2">
                        <Cloud className="w-5 h-5" />
                        云端设置
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-sm text-purple-200 bg-purple-900/30 p-3 rounded-lg">
                        <p>💡 提示：不同的密钥和密码组合会创建独立的备份文件</p>
                        <p>您可以使用多组凭据管理不同的书签集合</p>
                      </div>
                      <div>
                        <Label htmlFor="cloudKey" className="text-white">
                          密钥
                        </Label>
                        <Input
                          id="cloudKey"
                          value={cloudSettings.key}
                          onChange={(e) => setCloudSettings((prev) => ({ ...prev, key: e.target.value }))}
                          placeholder="输入您的密钥"
                          className="mt-1 bg-slate-700 border-purple-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cloudSecret" className="text-white">
                          密码
                        </Label>
                        <Input
                          id="cloudSecret"
                          type="password"
                          value={cloudSettings.secret}
                          onChange={(e) => setCloudSettings((prev) => ({ ...prev, secret: e.target.value }))}
                          placeholder="输入您的密码"
                          className="mt-1 bg-slate-700 border-purple-600 text-white"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          onClick={saveCloudSettings}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          保存
                        </Button>
                        <Button
                          onClick={backupToCloud}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          备份
                        </Button>
                        <Button
                          onClick={restoreFromCloud}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          恢复
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  className="bg-purple-800/30 border-purple-600/50 text-white hover:bg-purple-700/50"
                  onClick={() => setIsShareDialogOpen(true)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  分享设置
                </Button>
                <Button
                  variant="outline"
                  className="bg-purple-800/30 border-purple-600/50 text-white hover:bg-purple-700/50"
                  onClick={() => setIsBatchManageDialogOpen(true)}
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  批量管理
                </Button>
                <Button
                  variant="outline"
                  className="bg-purple-800/30 border-purple-600/50 text-white hover:bg-purple-700/50"
                  onClick={() => setIsAISettingsDialogOpen(true)}
                >
                  <Cpu className="w-4 h-4 mr-2" />
                  AI 设置
                </Button>
              </div>

              {/* 搜索框 */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <Input
                    placeholder="搜索标题、描述或标签..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 text-lg bg-purple-800/30 border-purple-600/50 text-white placeholder:text-purple-300 pr-12"
                  />
                  <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                </div>
              </div>

              {/* 标签云 */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <Button
                  key="all"
                  variant="outline"
                  size="sm"
                  className={`rounded-full px-4 py-2 transition-all ${selectedTags.includes("全部") || selectedTags.length === 0
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "bg-purple-800/30 border-purple-600/50 text-purple-200 hover:bg-purple-700/50"
                    }`}
                  onClick={() => setSelectedTags(["全部"])}
                >
                  全部
                </Button>
                {allTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className={`rounded-full px-4 py-2 transition-all ${selectedTags.includes(tag)
                      ? "bg-purple-600 border-purple-500 text-white"
                      : "bg-purple-800/30 border-purple-600/50 text-purple-200 hover:bg-purple-700/50"
                      }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>

              {/* 添加新书签按钮 */}
              <div className="text-center mb-12">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg rounded-full">
                      <Plus className="w-5 h-5 mr-2" />
                      添加新书签
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-purple-600 sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        添加新书签
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="url" className="text-white">
                          链接 *
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="url"
                            value={newBookmark.url}
                            onChange={(e) => setNewBookmark((prev) => ({ ...prev, url: e.target.value }))}
                            placeholder="https://example.com"
                            className="bg-slate-700 border-purple-600 text-white"
                          />
                          <FetchMetadataButton
                            url={newBookmark.url}
                            onFetchComplete={handleMetadataFetch}
                            aiSettings={aiSettings}
                            isDisabled={!newBookmark.url.trim()}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="title" className="text-white">
                          标题 *
                        </Label>
                        <Input
                          id="title"
                          value={newBookmark.title}
                          onChange={(e) => setNewBookmark((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="输入书签标题"
                          className="mt-1 bg-slate-700 border-purple-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="image" className="text-white">
                          图片链接
                        </Label>
                        <Input
                          id="image"
                          value={newBookmark.image}
                          onChange={(e) => setNewBookmark((prev) => ({ ...prev, image: e.target.value }))}
                          placeholder="https://example.com/image.jpg"
                          className="mt-1 bg-slate-700 border-purple-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tags" className="text-white">
                          标签
                        </Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="tags"
                            value={newBookmark.tags}
                            onChange={(e) => setNewBookmark((prev) => ({ ...prev, tags: e.target.value }))}
                            placeholder="标签1, 标签2, 标签3"
                            className="bg-slate-700 border-purple-600 text-white"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openTagSelector(false)}
                            className="border-purple-600 text-white hover:bg-purple-700/50"
                          >
                            <Tags className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description" className="text-white">
                          描述
                        </Label>
                        <Textarea
                          id="description"
                          value={newBookmark.description}
                          onChange={(e) => setNewBookmark((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="书签描述"
                          className="mt-1 bg-slate-700 border-purple-600 text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setIsAddDialogOpen(false)}
                          className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
                        >
                          取消
                        </Button>
                        <Button
                          onClick={addBookmark}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          添加书签
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 书签展示 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBookmarks.map((bookmark) => (
                  <Card
                    key={bookmark.id}
                    className="group bg-slate-800/50 border-purple-600/30 hover:bg-slate-800/70 transition-all duration-300 overflow-hidden backdrop-blur-sm"
                  >
                    <div className="relative">
                      {bookmark.image ? (
                        <img
                          src={bookmark.image || "/placeholder.svg"}
                          alt={bookmark.title}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            ; (e.target as HTMLImageElement).style.display = "none"
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-purple-800/50 to-slate-800/50 flex items-center justify-center">
                          <img
                            src={getFavicon(bookmark.url) || "/placeholder.svg?height=48&width=48"}
                            alt=""
                            className="w-16 h-16 opacity-50"
                            onError={(e) => {
                              ; (e.target as HTMLImageElement).src = "/placeholder.svg?height=48&width=48"
                            }}
                          />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="secondary" className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70">
                              <span className="sr-only">操作</span>
                              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-purple-600">
                            <DropdownMenuItem
                              onClick={() => window.open(bookmark.url, "_blank")}
                              className="text-white hover:bg-purple-700/50"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              访问
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => shareToPlaza(bookmark)}
                              className="text-white hover:bg-purple-700/50"
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              分享到广场
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingBookmark(bookmark)
                                setIsEditDialogOpen(true)
                              }}
                              className="text-white hover:bg-purple-700/50"
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteBookmark(bookmark.id)}
                              className="text-red-400 hover:bg-red-700/50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={getFavicon(bookmark.url) || "/placeholder.svg"}
                          alt=""
                          className="w-8 h-8 rounded flex-shrink-0 mt-1"
                          onError={(e) => {
                            ; (e.target as HTMLImageElement).src = "/placeholder.svg?height=32&width=32"
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{bookmark.title}</h3>
                          <p className="text-purple-200 text-sm line-clamp-2">{bookmark.description || "暂无描述"}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {bookmark.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-purple-800/50 text-purple-200">
                            {tag}
                          </Badge>
                        ))}
                        {bookmark.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-purple-800/50 text-purple-200">
                            +{bookmark.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        onClick={() => window.open(bookmark.url, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        访问网站
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredBookmarks.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-purple-300 text-lg mb-4">暂无书签</div>
                  <p className="text-purple-400">点击上方"添加新书签"按钮开始收藏您喜欢的网站</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="plaza" className="space-y-8">
              <div className="text-center py-12">
                <h2 className="text-4xl font-bold text-white mb-4">书签广场</h2>
                <p className="text-purple-200 text-lg">发现和收藏他人分享的精彩书签</p>
              </div>

              {/* 广场搜索和筛选 */}
              <div className="space-y-6">
                {/* 搜索框 */}
                <div className="max-w-2xl mx-auto">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                    <Input
                      placeholder="搜索标题、描述、标签或分享者..."
                      value={plazaSearchQuery}
                      onChange={(e) => setPlazaSearchQuery(e.target.value)}
                      className="h-12 text-lg bg-purple-800/30 border-purple-600/50 text-white placeholder:text-purple-300 pl-12"
                    />
                  </div>
                </div>

                {/* 控制按钮 */}
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    variant="outline"
                    className={`${showMySharesOnly
                      ? "bg-purple-600 border-purple-500 text-white"
                      : "bg-purple-800/30 border-purple-600/50 text-purple-200 hover:bg-purple-700/50"
                      }`}
                    onClick={() => {
                      setShowMySharesOnly(!showMySharesOnly)
                      if (!showMySharesOnly) {
                        fetchMyShares()
                      }
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showMySharesOnly ? "显示全部" : "我的分享"}
                  </Button>

                  <Dialog open={isManageSharesDialogOpen} onOpenChange={setIsManageSharesDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-purple-800/30 border-purple-600/50 text-purple-200 hover:bg-purple-700/50"
                        onClick={fetchMyShares}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        管理分享
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-purple-600 sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                          <Settings className="w-5 h-5" />
                          管理我的分享
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label htmlFor="deleteSecret" className="text-white">
                              删除密钥
                            </Label>
                            <div className="relative">
                              <Input
                                id="deleteSecret"
                                type={showDeleteSecret ? "text" : "password"}
                                value={deleteSecret}
                                onChange={(e) => setDeleteSecret(e.target.value)}
                                placeholder="输入您的分享密钥"
                                className="mt-1 bg-slate-700 border-purple-600 text-white pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-1 h-8 w-8 p-0 text-purple-300 hover:text-white"
                                onClick={() => setShowDeleteSecret(!showDeleteSecret)}
                              >
                                {showDeleteSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-6">
                            <Button
                              onClick={toggleSelectAll}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                            >
                              {selectedShares.length === filteredPlazaBookmarks.length ? "取消全选" : "全选"}
                            </Button>
                            <Button
                              onClick={batchDeleteShares}
                              variant="destructive"
                              size="sm"
                              disabled={selectedShares.length === 0}
                            >
                              删除选中 ({selectedShares.length})
                            </Button>
                          </div>
                        </div>

                        <Separator className="bg-purple-600/30" />

                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {mySharedBookmarks.map((bookmark) => (
                            <div
                              key={bookmark.shareId}
                              className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg"
                            >
                              <Checkbox
                                checked={selectedShares.includes(bookmark.shareId)}
                                onCheckedChange={() => toggleShareSelection(bookmark.shareId)}
                                className="border-purple-400"
                              />
                              <img
                                src={getFavicon(bookmark.url) || "/placeholder.svg"}
                                alt=""
                                className="w-8 h-8 rounded flex-shrink-0"
                                onError={(e) => {
                                  ; (e.target as HTMLImageElement).src = "/placeholder.svg?height=32&width=32"
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">{bookmark.title.length > 40 ? `${bookmark.title.substring(0, 35)}...` : bookmark.title}</h4>
                                <p className="text-purple-300 text-sm truncate">{bookmark.url.length > 60 ? `${bookmark.url.substring(0, 60)}...` : bookmark.url}</p>
                              </div>
                              <Button
                                onClick={() => deleteShare(bookmark.shareId)}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* 标签筛选 */}
                {plazaTags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="text-sm text-purple-300 flex items-center gap-2 mr-2">
                      <Filter className="w-4 h-4" />
                      标签筛选:
                    </span>
                    <Button
                      key="all"
                      variant="outline"
                      size="sm"
                      className={`rounded-full px-3 py-1 text-xs transition-all ${plazaSelectedTags.includes("全部") || plazaSelectedTags.length === 0
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-purple-800/30 border-purple-600/50 text-purple-200 hover:bg-purple-700/50"
                        }`}
                      onClick={() => setPlazaSelectedTags(["全部"])}
                    >
                      全部
                    </Button>
                    {plazaTags.slice(0, 11).map((tag) => (
                      <Button
                        key={tag}
                        variant="outline"
                        size="sm"
                        className={`rounded-full px-3 py-1 text-xs transition-all ${plazaSelectedTags.includes(tag)
                          ? "bg-purple-600 border-purple-500 text-white"
                          : "bg-purple-800/30 border-purple-600/50 text-purple-200 hover:bg-purple-700/50"
                          }`}
                        onClick={() => togglePlazaTag(tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* 广场书签展示 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPlazaBookmarks.map((bookmark) => (
                  <Card
                    key={bookmark.shareId}
                    className="group bg-slate-800/50 border-purple-600/30 hover:bg-slate-800/70 transition-all duration-300 overflow-hidden backdrop-blur-sm"
                  >
                    <div className="relative">
                      {bookmark.image ? (
                        <img
                          src={bookmark.image || "/placeholder.svg"}
                          alt={bookmark.title}
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            ; (e.target as HTMLImageElement).style.display = "none"
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-purple-800/50 to-slate-800/50 flex items-center justify-center">
                          <img
                            src={getFavicon(bookmark.url) || "/placeholder.svg?height=48&width=48"}
                            alt=""
                            className="w-16 h-16 opacity-50"
                            onError={(e) => {
                              ; (e.target as HTMLImageElement).src = "/placeholder.svg?height=48&width=48"
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={getFavicon(bookmark.url) || "/placeholder.svg"}
                          alt=""
                          className="w-8 h-8 rounded flex-shrink-0 mt-1"
                          onError={(e) => {
                            ; (e.target as HTMLImageElement).src = "/placeholder.svg?height=32&width=32"
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{bookmark.title}</h3>
                          <p className="text-purple-200 text-sm line-clamp-2">{bookmark.description || "暂无描述"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-purple-300 mb-3">
                        <span>分享者: {bookmark.sharedBy}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {bookmark.likes}
                        </div>
                        <span>•</span>
                        <span>{new Date(bookmark.sharedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {bookmark.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-purple-800/50 text-purple-200">
                            {tag}
                          </Badge>
                        ))}
                        {bookmark.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-purple-800/50 text-purple-200">
                            +{bookmark.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
                          onClick={() => window.open(bookmark.url, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          访问
                        </Button>
                        <Button
                          variant="outline"
                          className="border-purple-600 text-white hover:bg-purple-700/50"
                          onClick={() => {
                            // 收藏到我的书签
                            const newBookmark: Bookmark = {
                              id: Date.now().toString(),
                              title: bookmark.title,
                              url: bookmark.url,
                              image: bookmark.image,
                              tags: bookmark.tags,
                              description: bookmark.description,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                            }
                            const updatedBookmarks = [...bookmarks, newBookmark]
                            saveToStorage(updatedBookmarks)
                            toast({
                              title: "成功",
                              description: "书签已收藏到我的书签",
                            })
                          }}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredPlazaBookmarks.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-purple-300 text-lg mb-4">
                    {showMySharesOnly ? "您还没有分享任何书签" : "暂无分享的书签"}
                  </div>
                  <p className="text-purple-400">
                    {showMySharesOnly ? "去我的书签页面分享一些精彩内容吧！" : "成为第一个分享书签的用户吧！"}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* 标签选择器对话框 */}
          <Dialog open={isTagSelectorOpen} onOpenChange={setIsTagSelectorOpen}>
            <DialogContent className="bg-slate-800 border-purple-600 sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Tags className="w-5 h-5" />
                  选择标签
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* 当前选中的标签 */}
                <div>
                  <Label className="text-white text-sm">已选择的标签</Label>
                  <div className="flex flex-wrap gap-2 mt-2 p-3 bg-slate-700/50 rounded-lg min-h-[60px]">
                    {currentEditingTags.length === 0 ? (
                      <span className="text-purple-300 text-sm">暂无选择的标签</span>
                    ) : (
                      currentEditingTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-purple-600 text-white flex items-center gap-1"
                        >
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-purple-700"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* 添加新标签 */}
                <div>
                  <Label className="text-white text-sm">添加新标签</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="输入新标签名称"
                      className="bg-slate-700 border-purple-600 text-white"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addNewTag()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addNewTag}
                      disabled={!tagInput.trim() || currentEditingTags.includes(tagInput.trim())}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      添加
                    </Button>
                  </div>
                </div>

                <Separator className="bg-purple-600/30" />

                {/* 现有标签选择 */}
                <div>
                  <Label className="text-white text-sm">从现有标签中选择</Label>
                  <div className="max-h-60 overflow-y-auto mt-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {allTags.map((tag) => (
                        <Button
                          key={tag}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`justify-start text-left ${currentEditingTags.includes(tag)
                            ? "bg-purple-600 border-purple-500 text-white"
                            : "bg-slate-700 border-purple-600/50 text-purple-200 hover:bg-purple-700/50"
                            }`}
                          onClick={() => toggleTagInSelector(tag)}
                        >
                          <Checkbox checked={currentEditingTags.includes(tag)} className="mr-2 h-3 w-3" />
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    onClick={() => setIsTagSelectorOpen(false)}
                    className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
                  >
                    取消
                  </Button>
                  <Button
                    type="button"
                    onClick={confirmTagSelection}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  >
                    确认选择
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 分享设置对话框 */}
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogContent className="bg-slate-800 border-purple-600 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  分享设置
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-purple-200 bg-purple-900/30 p-3 rounded-lg">
                  <p>🔐 分享密钥用于管理您的分享内容</p>
                  <p>请设置并妥善保管您的分享密钥，它将用于：</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>标识您分享的书签</li>
                    <li>管理和删除您的分享</li>
                    <li>批量操作您的分享内容</li>
                  </ul>
                </div>
                <div>
                  <Label htmlFor="shareSecret" className="text-white">
                    分享密钥 *
                  </Label>
                  <Input
                    id="shareSecret"
                    value={shareSettings.shareSecret}
                    onChange={(e) => setShareSettings((prev) => ({ ...prev, shareSecret: e.target.value }))}
                    placeholder="设置一个唯一的分享密钥"
                    className="mt-1 bg-slate-700 border-purple-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="displayName" className="text-white">
                    显示名称
                  </Label>
                  <Input
                    id="displayName"
                    value={shareSettings.displayName}
                    onChange={(e) => setShareSettings((prev) => ({ ...prev, displayName: e.target.value }))}
                    placeholder="您的显示名称（可选）"
                    className="mt-1 bg-slate-700 border-purple-600 text-white"
                  />
                </div>
                <Button
                  onClick={saveShareSettings}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  保存设置
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* 编辑对话框 */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="bg-slate-800 border-purple-600 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  编辑书签
                </DialogTitle>
              </DialogHeader>
              {editingBookmark && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editUrl" className="text-white">
                      链接
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="editUrl"
                        value={editingBookmark.url}
                        onChange={(e) => setEditingBookmark((prev) => (prev ? { ...prev, url: e.target.value } : null))}
                        className="bg-slate-700 border-purple-600 text-white"
                      />
                      <FetchMetadataButton
                        url={editingBookmark.url}
                        onFetchComplete={handleMetadataFetch}
                        aiSettings={aiSettings}
                        isDisabled={!editingBookmark.url.trim()}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="editTitle" className="text-white">
                      标题
                    </Label>
                    <Input
                      id="editTitle"
                      value={editingBookmark.title}
                      onChange={(e) => setEditingBookmark((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                      className="mt-1 bg-slate-700 border-purple-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editImage" className="text-white">
                      图片链接
                    </Label>
                    <Input
                      id="editImage"
                      value={editingBookmark.image || ""}
                      onChange={(e) => setEditingBookmark((prev) => (prev ? { ...prev, image: e.target.value } : null))}
                      className="mt-1 bg-slate-700 border-purple-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editTags" className="text-white">
                      标签
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="editTags"
                        value={editingBookmark.tags.join(", ")}
                        onChange={(e) =>
                          setEditingBookmark((prev) =>
                            prev
                              ? {
                                ...prev,
                                tags: e.target.value
                                  .split(",")
                                  .map((tag) => tag.trim())
                                  .filter((tag) => tag),
                              }
                              : null,
                          )
                        }
                        className="bg-slate-700 border-purple-600 text-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openTagSelector(true)}
                        className="border-purple-600 text-white hover:bg-purple-700/50"
                      >
                        <Tags className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="editDescription" className="text-white">
                      描述
                    </Label>
                    <Textarea
                      id="editDescription"
                      value={editingBookmark.description || ""}
                      onChange={(e) =>
                        setEditingBookmark((prev) => (prev ? { ...prev, description: e.target.value } : null))
                      }
                      className="mt-1 bg-slate-700 border-purple-600 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsEditDialogOpen(false)}
                      className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={updateBookmark}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      更新书签
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* AI设置对话框 */}
          <AISettingsDialog
            open={isAISettingsDialogOpen}
            onOpenChange={setIsAISettingsDialogOpen}
            settings={aiSettings}
            onSave={saveAISettings}
          />

          {/* 批量管理对话框 */}
          <BatchManageDialog
            open={isBatchManageDialogOpen}
            onOpenChange={setIsBatchManageDialogOpen}
            bookmarks={filteredBookmarks}
            onBatchDelete={handleBatchDelete}
            onBatchShare={handleBatchShare}
            onBatchDeleteTags={handleBatchDeleteTags}
            shareSettings={shareSettings}
          />
        </div>
      </div>
      <Toaster />
    </div>
  )
}
