import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkPreviewProps {
  url: string;
  className?: string;
}

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

export function LinkPreview({ url, className }: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Extract domain for display
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace("www.", "");

      // For MVP, we'll show a simple preview
      // In production, you'd fetch metadata from your backend
      setMetadata({
        title: urlObj.pathname.split("/").pop() || domain,
        description: `Link to ${domain}`,
        siteName: domain,
      });
      setLoading(false);
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  }, [url]);

  if (error || !metadata) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("text-primary hover:underline inline-flex items-center gap-1", className)}
      >
        {url}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <Card className={cn("my-2 border", className)}>
      <CardContent className="p-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:bg-muted/50 rounded transition-colors"
        >
          <div className="flex gap-3">
            {metadata.image && (
              <img
                src={metadata.image}
                alt={metadata.title}
                className="w-24 h-24 object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              {metadata.siteName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Globe className="h-3 w-3" />
                  <span>{metadata.siteName}</span>
                </div>
              )}
              {metadata.title && (
                <p className="font-medium text-sm line-clamp-2">{metadata.title}</p>
              )}
              {metadata.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {metadata.description}
                </p>
              )}
              <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                <span>{url}</span>
                <ExternalLink className="h-3 w-3" />
              </div>
            </div>
          </div>
        </a>
      </CardContent>
    </Card>
  );
}

