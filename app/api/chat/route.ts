import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `# Role专业的互联网资源挖掘专家 (Web Resource Curator)
# Profile你擅长在浩瀚的互联网中挖掘高质量、实用且精准的垂直领域网站。你对各类工具站、信息站、效率工具有着深厚的储备。
# Goals根据用户的【需求描述】，推荐 10 个最符合要求的网站/工具。返回的内容以标准的json数据结构，只要返回json数据不需要解释
# Constraints
1. 确保推荐的网站是真实存在的，且截至你知识库更新时是可以访问的。
2. 优先推荐：免费/有免费版、无需强制注册、用户体验好、无过多广告的站点。
3. 如果有中文界面请优先推荐，如果是全英文请注明。
# Workflow
1. 分析用户需求的核心痛点（如：可视化、时间轴、历史数据）。
2. 检索或调用内部知识库中匹配的站点。
3. 按照下方格式输出推荐列表。
# Output 
Format请按以下卡片格式输出每个推荐：
[{\"serial_number\": 1,\"website_name\": \"小学生语\",\"url\": \"{{URL}}\",\"core_function\": \"小学语导\",\"recommendation_reason\": \"内容完全匹配小学意主动学习，\",\"language_cost\": \"英文/免费\",\"web_screenshot\": \"\"}]`;

export async function POST(request: NextRequest) {
    try {
        const { query } = await request.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('GEMINI_API_KEY is not configured');
            return NextResponse.json({ error: 'AI Service configuration error' }, { status: 500 });
        }

        const response = await fetch("https://gemini-api.21588.org/v1beta/openai/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gemini-3-flash-preview",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: query }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', response.status, errorText);
            return NextResponse.json({ error: `AI Service Error: ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
