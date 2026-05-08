/**
 * Image optimization utilities for responsive images and compression
 */

interface ImageDimensions {
    width: number;
    height: number;
}

/**
 * Supported image formats for optimization
 */
export const SUPPORTED_FORMATS = {
    WEBP: "webp",
    JPEG: "jpeg",
    PNG: "png",
} as const;

/**
 * Standard breakpoints for responsive images
 */
export const IMAGE_BREAKPOINTS = {
    mobile: 400,
    tablet: 600,
    desktop: 800,
    wide: 1000,
    ultrawide: 1200,
} as const;

/**
 * Aspect ratios for different image types
 */
export const ASPECT_RATIOS = {
    square: 1,
    landscape: 16 / 9,
    portrait: 9 / 16,
} as const;

/**
 * Calculate image dimensions based on aspect ratio
 */
export function calculateImageDimensions(
    width: number,
    aspectRatio: number
): ImageDimensions {
    return {
        width,
        height: Math.round(width / aspectRatio),
    };
}

/**
 * Check if browser supports WebP
 */
export function supportsWebP(): Promise<boolean> {
    return new Promise((resolve) => {
        const webp = new Image();
        webp.onload = webp.onerror = () => resolve(webp.height === 2);
        webp.src =
            "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAAw=";
    });
}

/**
 * Get optimal image size for device
 */
export function getOptimalImageSize(
    containerWidth: number
): number {
    const pixelRatio = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    const width = containerWidth * pixelRatio;

    const breakpoints = Object.values(IMAGE_BREAKPOINTS).sort((a, b) => a - b);
    return breakpoints.find((bp) => bp >= width) || breakpoints[breakpoints.length - 1];
}

/**
 * Format image size for display
 */
export function formatImageSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Estimate compression savings for WebP
 */
export function estimateWebpSavings(jpegSize: number): {
    webpSize: number;
    savings: number;
    savingsPercent: number;
} {
    // WebP typically saves 25-35% compared to JPEG
    const savingsPercent = 0.3; // 30% average
    const webpSize = Math.round(jpegSize * (1 - savingsPercent));
    return {
        webpSize,
        savings: jpegSize - webpSize,
        savingsPercent: Math.round(savingsPercent * 100),
    };
}

/**
 * Build Supabase image transformation URL
 */
export function buildSupabaseImageUrl(
    originalUrl: string,
    options?: {
        width?: number;
        height?: number;
        format?: "webp" | "jpeg" | "png";
        quality?: number;
    }
): string {
    if (!originalUrl || !originalUrl.includes("supabase")) {
        return originalUrl;
    }

    const params = new URLSearchParams();

    if (options?.width) params.append("width", options.width.toString());
    if (options?.height) params.append("height", options.height.toString());
    if (options?.format) params.append("format", options.format);
    if (options?.quality) params.append("quality", options.quality.toString());

    const separator = originalUrl.includes("?") ? "&" : "?";
    return `${originalUrl}${separator}${params.toString()}`;
}

/**
 * Preload image for better performance
 */
export function preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
        img.src = src;
    });
}

/**
 * Batch preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void[]> {
    return Promise.allSettled(srcs.map(preloadImage)).then((results) =>
        results.map((result) =>
            result.status === "fulfilled" ? result.value : undefined
        )
    );
}
