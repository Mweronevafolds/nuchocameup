import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    loading?: "lazy" | "eager";
    sizes?: string;
    priority?: boolean;
    onLoad?: () => void;
}

/**
 * Optimized image component with lazy loading, WebP support, and responsive sizing
 */
export function OptimizedImage({
    src,
    alt,
    width = 800,
    height = 800,
    className = "",
    loading = "lazy",
    sizes = "100vw",
    priority = false,
    onLoad,
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(!priority);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (priority) {
            setIsLoading(false);
        }
    }, [priority]);

    if (error) {
        return (
            <div className={`bg-secondary flex items-center justify-center ${className}`}>
                <span className="text-xs text-muted-foreground">Failed to load image</span>
            </div>
        );
    }

    const handleLoad = () => {
        setIsLoading(false);
        onLoad?.();
    };

    const srcset = generateSrcSet(src, [400, 600, 800, 1000, 1200]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {isLoading && <Skeleton className="absolute inset-0" />}

            <picture>
                {/* WebP format for modern browsers */}
                <source
                    srcSet={generateWebPSrcSet(src, [400, 600, 800, 1000, 1200])}
                    type="image/webp"
                    sizes={sizes}
                />

                {/* Fallback to JPEG */}
                <img
                    src={src}
                    srcSet={srcset}
                    sizes={sizes}
                    alt={alt}
                    width={width}
                    height={height}
                    loading={loading}
                    onLoad={handleLoad}
                    onError={() => setError(true)}
                    className={`w-full h-full object-cover ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
                    decoding="async"
                />
            </picture>
        </div>
    );
}

/**
 * Generate srcset for JPEG images
 */
function generateSrcSet(src: string, widths: number[]): string {
    return widths
        .map((width) => `${generateImageUrl(src, width, "jpeg")} ${width}w`)
        .join(", ");
}

/**
 * Generate srcset for WebP images
 */
function generateWebPSrcSet(src: string, widths: number[]): string {
    return widths
        .map((width) => `${generateImageUrl(src, width, "webp")} ${width}w`)
        .join(", ");
}

/**
 * Generate optimized image URL with format and width
 * This uses Supabase image transformation if available, otherwise returns original
 */
function generateImageUrl(
    src: string,
    width: number,
    format: "webp" | "jpeg"
): string {
    // If it's a Supabase Storage URL, add transformation parameters
    if (src.includes("supabase") || src.includes("storage")) {
        // Supabase transformation format
        const separator = src.includes("?") ? "&" : "?";
        return `${src}${separator}width=${width}&format=${format}`;
    }

    // For external URLs or local paths, return as-is
    // In production, implement image proxy or CDN
    return src;
}

/**
 * Get LQIP (Low Quality Image Placeholder) - blurred thumbnail
 */
export function getLqipUrl(src: string): string {
    if (src.includes("supabase") || src.includes("storage")) {
        const separator = src.includes("?") ? "&" : "?";
        return `${src}${separator}width=100&quality=30`;
    }
    return src;
}
