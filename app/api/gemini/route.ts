import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
    try {
        const { messages, model } = await req.json() as any;

        const apiKey = process.env.GEMINI_API_KEY;
        // 使用用户提供的默认URL作为基础，允许通过环境变量覆盖
        // 注意：用户提供的完整URL是 https://gemini-api.21588.org/v1beta/openai/chat/completions
        // 这里我们定义BASE_URL为不包含 /chat/completions 的部分
        const baseUrl = process.env.GEMINI_API_BASE_URL || "https://gemini-api.21588.org/v1beta/openai";

        if (!apiKey) {
            console.error("GEMINI_API_KEY is not defined");
            return NextResponse.json(
                { error: "Server configuration error: GEMINI_API_KEY is missing" },
                { status: 500 }
            );
        }

        const url = `${baseUrl}/chat/completions`;
        const body = JSON.stringify({
            model: model || "gemini-3-flash-preview",
            messages,
        });

        const curlCommand = `curl "${url}" \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${apiKey}" \\
-d '${body}'`;

        console.log("----------------------------------------------------------------");
        console.log("Gemini API Request (CURL):");
        console.log(curlCommand);
        console.log("----------------------------------------------------------------");

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: body,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini Upstream API Error:", data);
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Gemini API Route Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
