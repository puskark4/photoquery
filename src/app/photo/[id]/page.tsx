
import Image from "next/image";
import { placeholderPhotos, defaultPhotoId } from "@/lib/constants";
import type { Photo } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PhotoPageProps {
  params: {
    id: string;
  };
}

export default function PhotoPage({ params }: PhotoPageProps) {
  const photoId = params.id || defaultPhotoId;
  const photo: Photo | undefined = placeholderPhotos.find(p => p.id === photoId);

  if (!photo) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-semibold mb-4">Photo not found</h1>
        <p className="text-muted-foreground mb-6">The photo you are looking for does not exist.</p>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to gallery
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground text-center">{photo.alt}</h1>
        <Card className="overflow-hidden shadow-lg">
          <AspectRatio ratio={photo.src.includes("400x600") || photo.src.includes("200x300") || photo.src.includes("350x600") || photo.src.includes("450x600") ? 2/3 : 4/3}>
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
              priority
              data-ai-hint={photo.dataAiHint}
            />
          </AspectRatio>
        </Card>
        
        <div className="text-center">
          <Button asChild size="lg">
            <Link href={`/chat?photoId=${photo.id}`}>
              <MessageCircle className="mr-2 h-5 w-5" /> Chat about this photo
            </Link>
          </Button>
        </div>
        
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Developer Note: API Key</AlertTitle>
          <AlertDescription>
            To use the AI features, please ensure your Gemini API key is set as the <code>GOOGLE_API_KEY</code> environment variable in a <code>.env.local</code> file. This app uses Genkit flows that rely on this for authentication.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return placeholderPhotos.map((photo) => ({
    id: photo.id,
  }));
}
