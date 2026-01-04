import { getRequestContext } from '@cloudflare/next-on-pages';

export class ScreenshotService {
    private static BROWSERLESS_TOKENS = [
        '2TjGdjPl8Ekbgv1f4ccad3434a80b1fa52772fbc5b8a62681',
        '2TjH4QHBFX5hD3c5ac2a0b704cce2993c085abfa15b21105e',
        '2TjHXL7XutO7yfgff7fa22fbd6088a4cb059ce78c365ae341',
        '2TjHYoazfeVe2Pvcef4ba480cc29a684ebe096e46a1e5efda',
        '2TjHs1M58TCV4Vd7cc568f16c24e58564619cbe0a82e1154b'
    ];
    private static KV_BINDING_NAME = 'SCREENSHOT_KV';

    /**
     * Retrieves the KV binding from the Cloudflare request context.
     * Returns null if not available (e.g. running locally without wrangler or binding)
     */
    private static getKV(): KVNamespace | null {
        if (process.env.NODE_ENV === 'development') {
            return null;
        }
        try {
            // @ts-ignore - The type definition for getRequestContext might strictly type env usually
            const ctx = getRequestContext();
            if (ctx && ctx.env && (ctx.env as any)[ScreenshotService.KV_BINDING_NAME]) {
                return (ctx.env as any)[ScreenshotService.KV_BINDING_NAME] as KVNamespace;
            }
        } catch (e) {
            console.warn('Failed to get KV context:', e);
        }
        return null;
    }

    /**
     * Fetches a screenshot for the given URL.
     * Tries to read from KV cache first.
     * If miss, calls Browserless.io, saves to KV, and returns the image.
     * Returns the image as a Buffer (binary data).
     */
    public static async getScreenshot(url: string): Promise<Buffer | null> {
        const kv = this.getKV();
        const cacheKey = url;

        // 1. Try Cache
        if (kv) {
            try {
                const cachedBase64 = await kv.get(cacheKey);
                if (cachedBase64) {
                    console.log('Cache HIT for:', url);
                    return Buffer.from(cachedBase64, 'base64');
                }
            } catch (e) {
                console.error('KV get error:', e);
            }
        } else {
            console.log('No KV binding found, skipping cache lookup.');
        }

        // 2. Fetch from Browserless with Retries
        let availableTokens = [...this.BROWSERLESS_TOKENS];
        let base64Image: string | null = null;
        let lastError: any = null;

        while (availableTokens.length > 0) {
            // Pick a random token
            const randomIndex = Math.floor(Math.random() * availableTokens.length);
            const token = availableTokens[randomIndex];

            // Remove the used token from the list
            availableTokens.splice(randomIndex, 1);

            const browserlessUrl = `https://production-sfo.browserless.io/screenshot?token=${token}`;
            console.log(`Fetching screenshot from Browserless for: ${url} (Token: ...${token.slice(-5)})`);

            try {
                const response = await fetch(browserlessUrl, {
                    method: 'POST',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        url: url,
                        options: {
                            fullPage: false,
                            type: 'png',
                            clip: {
                                width: 900,
                                height: 500,
                                x: 0,
                                y: 0
                            },
                            encoding: 'base64'
                        }
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    const status = response.status;
                    // If it's a 4xx error (client error), maybe don't retry? 
                    // But 429 (Too Many Requests) or 401/403 (Token issues) should definitely retry with another token.
                    // 5xx errors should also retry.
                    // Let's retry on everything for robustness as per user request (exception handling).
                    throw new Error(`Browserless API error: ${status} ${errorText}`);
                }

                base64Image = await response.text();
                // If success, break the loop
                break;

            } catch (error) {
                console.warn(`Attempt failed with token ...${token.slice(-5)}:`, error);
                lastError = error;
                // Loop continues to next token
                await new Promise(resolve => setTimeout(resolve, 400));
            }
        }

        if (!base64Image) {
            console.error('All Browserless tokens exhausted or failed.', lastError);
            return null;
        }

        // 3. Save to Cache
        if (kv && base64Image) {
            try {
                // Cache for 24 hours (86400 seconds)
                await kv.put(cacheKey, base64Image, { expirationTtl: 86400 });
                console.log('Saved to KV cache:', url);
            } catch (e) {
                console.error('KV put error:', e);
            }
        }

        return Buffer.from(base64Image, 'base64');
    }
}
