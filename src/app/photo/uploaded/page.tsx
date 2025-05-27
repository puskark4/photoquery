
"use client";

import Image from "next/image";
import { useSearchParams } from 'next/navigation';
import type { Photo } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ArrowLeft, MessageCircle } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";

function UploadedPhotoDisplayContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const src = searchParams.get('src'); // This is the data URI
  const alt = searchParams.get('alt');

  if (!id || !src || !alt) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-semibold mb-4">Photo data missing</h1>
        <p className="text-muted-foreground mb-6">Could not load the uploaded photo. Necessary information is missing.</p>
         <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to gallery
          </Link>
        </Button>
      </div>
    );
  }

  const photo: Photo = {
    id,
    src, 
    alt,
    dataUri: src, 
  };
  
  const isPortraitHeuristic = src.includes("data:image") ? false : 
                               (photo.src.includes("400x600") || photo.src.includes("200x300") || photo.src.includes("350x600") || photo.src.includes("450x600"));
  const aspectRatio = isPortraitHeuristic ? 2/3 : 4/3;

  const chatLink = `/chat?uploadedId=${encodeURIComponent(id)}&src=${encodeURIComponent(src)}&alt=${encodeURIComponent(alt)}`;

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground text-center break-all">{photo.alt}</h1>
        <Card className="overflow-hidden shadow-lg">
           <AspectRatio ratio={aspectRatio}>
             <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
              priority 
            />
          </AspectRatio>
        </Card>
        
        <div className="text-center">
          <Button asChild size="lg">
            <Link href={chatLink} prefetch={false}>
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

export default function UploadedPhotoPage() {
  return (
    <Suspense fallback={<div className="text-center py-10"><ArrowLeft className="inline mr-2 h-4 w-4" />Loading photo details...</div>}>
      <UploadedPhotoDisplayContent />
    </Suspense>
  );
}
