import { NextRequest, NextResponse } from 'next/server';
import { ScreenshotService } from '../../lib/screenshot-service';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL basic format
    try {
        new URL(url);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    try {
        const imageBuffer = await ScreenshotService.getScreenshot(url);

        if (!imageBuffer) {
            return NextResponse.json({ error: 'Failed to generate screenshot' }, { status: 500 });
        }

        return new NextResponse(new Uint8Array(imageBuffer), {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=3600', // Browser cache
            },
        });
    } catch (error) {
        console.error('Screenshot generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate screenshot', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
