import { NextRequest, NextResponse } from "next/server";
import { getServerAIConfig } from "@/lib/ai-config";

export const runtime = "edge";

export async function POST(req: NextRequest) {
    try {
        const { messages, model } = await req.json() as any;

        const { apiKey, baseUrl, model: defaultModel } = getServerAIConfig();

        if (!apiKey) {
            console.error("GEMINI_API_KEY is not defined");
            return NextResponse.json(
                { error: "Server configuration error: GEMINI_API_KEY is missing" },
                { status: 500 }
            );
        }

        const url = `${baseUrl}/chat/completions`;
        const body = JSON.stringify({
            model: model || defaultModel,
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
