"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Trash2, Share2, ExternalLink, CheckSquare, Square, Tags } from "lucide-react"

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

interface ShareSettings {
  shareSecret: string
  displayName: string
}

interface BatchManageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmarks: Bookmark[]
  onBatchDelete: (ids: string[]) => void
  onBatchShare: (bookmarks: Bookmark[]) => void
  onBatchDeleteTags: (updatedBookmarks: Bookmark[]) => void
  shareSettings: ShareSettings
}

export default function BatchManageDialog({
  open,
  onOpenChange,
  bookmarks,
  onBatchDelete,
  onBatchShare,
  onBatchDeleteTags,
  shareSettings,
}: BatchManageDialogProps) {
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([])
  const [isTagDeleteMode, setIsTagDeleteMode] = useState(false)
  const [tagsToDelete, setTagsToDelete] = useState<string[]>([])
  const { toast } = useToast()

  // 获取域名图标
  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return "/placeholder.svg?height=32&width=32"
    }
  }

  // 截断URL显示
  const truncateUrl = (url: string, maxLength = 50) => {
    if (url.length <= maxLength) return url
    return url.substring(0, maxLength) + "..."
  }

  // 获取选中书签的所有标签
  const getAllTagsFromSelected = () => {
    const tags = new Set<string>()
    const selectedBookmarkObjects = bookmarks.filter((bookmark) => selectedBookmarks.includes(bookmark.id))
    selectedBookmarkObjects.forEach((bookmark) => {
      bookmark.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags).sort()
  }

  // 切换书签选择
  const toggleBookmarkSelection = (bookmarkId: string) => {
    setSelectedBookmarks((prev) =>
      prev.includes(bookmarkId) ? prev.filter((id) => id !== bookmarkId) : [...prev, bookmarkId],
    )
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedBookmarks.length === bookmarks.length) {
      setSelectedBookmarks([])
    } else {
      setSelectedBookmarks(bookmarks.map((bookmark) => bookmark.id))
    }
  }

  // 切换标签删除模式
  const toggleTagDeleteMode = () => {
    setIsTagDeleteMode(!isTagDeleteMode)
    setTagsToDelete([])
  }

  // 切换要删除的标签
  const toggleTagToDelete = (tag: string) => {
    setTagsToDelete((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  // 批量删除书签
  const handleBatchDelete = () => {
    if (selectedBookmarks.length === 0) {
      toast({
        title: "提示",
        description: "请选择要删除的书签",
      })
      return
    }

    onBatchDelete(selectedBookmarks)
    setSelectedBookmarks([])
    toast({
      title: "成功",
      description: `已删除 ${selectedBookmarks.length} 个书签`,
    })
  }

  // 批量分享
  const handleBatchShare = () => {
    if (selectedBookmarks.length === 0) {
      toast({
        title: "提示",
        description: "请选择要分享的书签",
      })
      return
    }

    if (!shareSettings.shareSecret) {
      toast({
        title: "错误",
        description: "请先设置分享密钥",
        variant: "destructive",
      })
      return
    }

    const selectedBookmarkObjects = bookmarks.filter((bookmark) => selectedBookmarks.includes(bookmark.id))
    onBatchShare(selectedBookmarkObjects)
    setSelectedBookmarks([])
  }

  // 批量删除标签
  const handleBatchDeleteTags = () => {
    if (selectedBookmarks.length === 0) {
      toast({
        title: "提示",
        description: "请选择要操作的书签",
      })
      return
    }

    if (tagsToDelete.length === 0) {
      toast({
        title: "提示",
        description: "请选择要删除的标签",
      })
      return
    }

    const selectedBookmarkObjects = bookmarks.filter((bookmark) => selectedBookmarks.includes(bookmark.id))
    const updatedBookmarks = selectedBookmarkObjects.map((bookmark) => ({
      ...bookmark,
      tags: bookmark.tags.filter((tag) => !tagsToDelete.includes(tag)),
    }))

    onBatchDeleteTags(updatedBookmarks)
    setTagsToDelete([])
    setIsTagDeleteMode(false)
    toast({
      title: "成功",
      description: `已从 ${selectedBookmarks.length} 个书签中删除 ${tagsToDelete.length} 个标签`,
    })
  }

  const availableTags = getAllTagsFromSelected()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-purple-600 sm:max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            批量管理书签
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* 操作按钮区域 */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <Button
                onClick={toggleSelectAll}
                variant="outline"
                size="sm"
                className="bg-purple-800/50 border-purple-600 text-white hover:bg-purple-700/50"
              >
                {selectedBookmarks.length === bookmarks.length ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    取消全选
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    全选 ({bookmarks.length})
                  </>
                )}
              </Button>
              <span className="text-purple-300 text-sm">已选择 {selectedBookmarks.length} 个书签</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={toggleTagDeleteMode}
                variant="outline"
                className={`${
                  isTagDeleteMode
                    ? "bg-orange-600 border-orange-500 text-white"
                    : "bg-purple-800/50 border-purple-600 text-white hover:bg-purple-700/50"
                }`}
              >
                <Tags className="w-4 h-4 mr-2" />
                {isTagDeleteMode ? "退出标签删除" : "批量删除标签"}
              </Button>
              <Button
                onClick={handleBatchShare}
                disabled={selectedBookmarks.length === 0}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Share2 className="w-4 h-4 mr-2" />
                批量分享 ({selectedBookmarks.length})
              </Button>
              <Button onClick={handleBatchDelete} disabled={selectedBookmarks.length === 0} variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                批量删除 ({selectedBookmarks.length})
              </Button>
            </div>
          </div>

          {/* 标签删除模式界面 */}
          {isTagDeleteMode && (
            <div className="bg-orange-900/20 border border-orange-600/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Tags className="w-4 h-4" />
                  选择要删除的标签
                </h3>
                <Button
                  onClick={handleBatchDeleteTags}
                  disabled={tagsToDelete.length === 0 || selectedBookmarks.length === 0}
                  variant="destructive"
                  size="sm"
                >
                  删除选中标签 ({tagsToDelete.length})
                </Button>
              </div>

              {availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {availableTags.map((tag) => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      className={`${
                        tagsToDelete.includes(tag)
                          ? "bg-red-600 border-red-500 text-white"
                          : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      }`}
                      onClick={() => toggleTagToDelete(tag)}
                    >
                      <Checkbox checked={tagsToDelete.includes(tag)} className="mr-2 h-3 w-3" readOnly />
                      {tag}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-purple-300 text-sm">请先选择书签以显示可删除的标签</p>
              )}
            </div>
          )}

          <Separator className="bg-purple-600/30" />

          {/* 书签列表 */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  selectedBookmarks.includes(bookmark.id)
                    ? "bg-purple-700/30 border-purple-500"
                    : "bg-slate-700/50 border-slate-600 hover:bg-slate-700/70"
                }`}
              >
                <Checkbox
                  checked={selectedBookmarks.includes(bookmark.id)}
                  onCheckedChange={() => toggleBookmarkSelection(bookmark.id)}
                  className="border-purple-400 flex-shrink-0"
                />
                <img
                  src={getFavicon(bookmark.url) || "/placeholder.svg"}
                  alt=""
                  className="w-8 h-8 rounded flex-shrink-0"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=32&width=32"
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{bookmark.title}</h4>
                  <p className="text-purple-300 text-sm truncate" title={bookmark.url}>
                    {truncateUrl(bookmark.url)}
                  </p>
                  {bookmark.description && (
                    <p className="text-purple-400 text-xs truncate mt-1" title={bookmark.description}>
                      {bookmark.description.length > 60
                        ? bookmark.description.substring(0, 60) + "..."
                        : bookmark.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bookmark.tags.slice(0, 4).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className={`text-xs ${
                          isTagDeleteMode && tagsToDelete.includes(tag)
                            ? "bg-red-600/50 text-red-200 border border-red-500"
                            : "bg-purple-800/50 text-purple-200"
                        }`}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {bookmark.tags.length > 4 && (
                      <Badge variant="secondary" className="text-xs bg-purple-800/50 text-purple-200">
                        +{bookmark.tags.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => window.open(bookmark.url, "_blank")}
                  variant="ghost"
                  size="sm"
                  className="text-purple-300 hover:text-white hover:bg-purple-700/50 flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {bookmarks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-purple-300">暂无书签可管理</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
