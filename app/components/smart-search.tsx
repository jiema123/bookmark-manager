"use client"

import { useState, useEffect } from "react"
import { Search, Sparkles, ArrowRight, Loader2, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

interface SearchResult {
    serial_number: number
    website_name: string
    url: string
    core_function: string
    recommendation_reason: string
    language_cost: string
    web_screenshot: string
}

function RefreshedImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [refreshKey, setRefreshKey] = useState(0)

    // Refresh only once after 3 seconds to check for updates
    useEffect(() => {
        const timer = setTimeout(() => {
            setRefreshKey(k => k + 1)
        }, 3000)
        return () => clearTimeout(timer)
    }, [])

    const finalSrc = src.includes('?') ? `${src}&t=${refreshKey}` : `${src}?t=${refreshKey}`

    return (
        <img
            src={finalSrc}
            alt={alt}
            className={className}
            onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg?height=200&width=300&text=Loading..."
            }}
        />
    )
}

export default function SmartSearch() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    const recommendations = [
        "一个免费的在线PS工具，无需下载安装",
        "适合程序员使用的在线绘图工具，支持流程图和架构图",
        "高质量的免费无版权高清图片素材网站",
        "中国电动车公开拆解类网站"
    ]

    const handleSearch = async (searchQuery: string = query) => {
        if (!searchQuery.trim()) {
            toast({
                title: "请输入搜索内容",
                variant: "destructive",
            })
            return
        }

        setLoading(true)
        setHasSearched(true)
        setResults([]) // Clear previous results

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query: searchQuery })
            })

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`)
            }

            const data: any = await response.json()
            const content = data.choices[0]?.message?.content

            if (!content) {
                throw new Error("No content received from AI")
            }

            // Parse current content which might be wrapped in markdown code blocks or just text
            let jsonString = content
            // Remove markdown code blocks if present
            if (content.includes("```json")) {
                jsonString = content.split("```json")[1].split("```")[0]
            } else if (content.includes("```")) {
                jsonString = content.split("```")[1].split("```")[0]
            }

            try {
                const parsedResults = JSON.parse(jsonString)
                if (Array.isArray(parsedResults)) {
                    setResults(parsedResults)
                } else {
                    console.error("Parsed result is not an array", parsedResults)
                    toast({
                        title: "解析失败",
                        description: "AI返回的数据格式不正确",
                        variant: "destructive",
                    })
                }
            } catch (e) {
                console.error("JSON Parse Error", e)
                toast({
                    title: "解析失败",
                    description: "无法解析AI返回的数据",
                    variant: "destructive",
                })
            }

        } catch (error) {
            console.error("Search Error", error)
            toast({
                title: "搜索失败",
                description: error instanceof Error ? error.message : "未知错误",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSearch()
        }
    }

    const handleRecommendationClick = (text: string) => {
        setQuery(text)
        handleSearch(text)
    }

    return (
        <div className={`flex flex-col items-center w-full transition-all duration-500 ease-in-out ${hasSearched ? "py-8" : "min-h-[60vh] justify-center"}`}>

            {/* Search Header Area */}
            <div className={`w-full max-w-3xl flex flex-col items-center gap-8 ${hasSearched ? "mb-8 gap-4" : "mb-12"}`}>
                <div className={`flex items-center gap-3 transition-all ${hasSearched ? "scale-75" : "scale-100"}`}>
                    <div className="p-3 bg-primary/20 rounded-xl glow-box">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/120">
                        Smart Search
                    </h1>
                </div>

                <div className="w-full relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <div className="relative bg-[#0a0a0a] rounded-xl border border-white/10 p-1">
                        <Textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="描述您的需求，例如：'找一个免费的在线PS工具'..."
                            className="min-h-[80px] text-lg bg-transparent border-none focus-visible:ring-0 resize-none py-3 px-4 placeholder:text-muted-foreground/50"
                            style={{ minHeight: "5rem" }} // Roughly 3 lines
                        />
                        <div className="flex justify-between items-center px-2 pb-2">
                            <div className="text-xs text-muted-foreground/50 px-2">
                                按 Enter 搜索
                            </div>
                            <Button
                                onClick={() => handleSearch()}
                                disabled={loading}
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Recommendations - Only show if not searched or if just starting */}
                {!hasSearched && (
                    <div className="flex flex-wrap gap-3 justify-center w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {recommendations.map((text, index) => (
                            <button
                                key={index}
                                onClick={() => handleRecommendationClick(text)}
                                className="px-4 py-2 rounded-full bg-secondary/30 hover:bg-secondary/60 border border-white/5 text-sm text-zinc-400 hover:text-white transition-all hover:scale-105 cursor-pointer backdrop-blur-sm"
                            >
                                {text}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Results Area */}
            {loading && !results.length && (
                <div className="w-full max-w-5xl flex flex-col gap-4 animate-in fade-in duration-500">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-full h-40 bg-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            )}

            {results.length > 0 && (
                <div className="w-full max-w-5xl grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    {results.map((result) => (
                        <Card key={result.serial_number} className="bg-[#111]/80 backdrop-blur border-white/10 overflow-hidden hover:border-primary/50 transition-colors group">
                            <div className="flex flex-col md:flex-row gap-6 p-6">
                                {/* Screenshot / Image */}
                                <div className="w-full md:w-64 flex-shrink-0 aspect-video md:aspect-[4/3] rounded-lg overflow-hidden bg-black/50 relative border border-white/5">
                                    <RefreshedImage
                                        src={`/api/screenshot?url=${encodeURIComponent(result.url)}`}
                                        alt={result.website_name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute top-2 left-2">
                                        <Badge className="bg-black/60 backdrop-blur text-white border-white/10 hover:bg-black/80">
                                            #{result.serial_number}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex flex-col gap-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                                                {result.website_name}
                                                <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-1 transition-all" />
                                            </h3>
                                            <p className="text-sm text-primary/80 mt-1 font-medium">{result.core_function}</p>
                                        </div>
                                        <Badge variant="outline" className="text-xs border-primary/20 text-primary bg-primary/5 shrink-0">
                                            {result.language_cost}
                                        </Badge>
                                    </div>

                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {result.recommendation_reason}
                                    </p>

                                    <div className="mt-auto pt-4 flex items-center gap-4">
                                        <Button
                                            className="bg-white/10 hover:bg-white/20 text-white border border-white/10 gap-2"
                                            onClick={() => window.open(result.url, '_blank')}
                                        >
                                            <Globe className="w-4 h-4" />
                                            访问网站
                                        </Button>
                                        <div className="text-xs text-zinc-600 truncate max-w-[300px]">
                                            {result.url}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
