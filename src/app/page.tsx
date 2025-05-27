
"use client";

import { useState, useRef, type ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UploadCloud, Camera as CameraIcon, Loader2, Languages, Image as ImageIcon } from "lucide-react"; // Updated ImageIcon
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { 
  CURRENT_PHOTO_DATA_SESSION_KEY,
  CURRENT_PHOTO_ALT_SESSION_KEY,
  SUPPORTED_LANGUAGES,
  SESSION_STORAGE_LANGUAGE_KEY,
  type LanguageCode
} from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MAX_SIZE_BEFORE_RESIZE_BYTES = 2 * 1024 * 1024; // 2MB
const RESIZE_TARGET_WIDTH = 1920;
const RESIZE_TARGET_HEIGHT = 1080;
const RESIZE_QUALITY = 0.8; // For JPEGs

// Localization object
const pageText: Record<LanguageCode, Record<string, string | ((...args: any[]) => string)>> = {
  en: {
    title: "UltronxGemini Image Review Tool",
    welcome: "Welcome! Select an image from your device or take a photo with your camera. You can then chat with Gemini AI about your photo.",
    feature1: "Select or Capture: Choose an image from your device or take one with your camera.",
    feature2: "Chat with AI: You'll be taken to a chat page to ask Gemini questions about your photo.",
    feature3: "API Key: Provide your Google AI API key (stored in session storage) for AI features.",
    feature4: "Large Files: Images over ~2MB are automatically resized to help with processing. Very large files (e.g. over 5-10MB original) may still exceed browser storage limits even after resizing and might fail to load.",
    selectPhotoButton: "Select Photo",
    takePhotoButton: "Take Photo",
    processing: "Processing...",
    cameraAccessDeniedTitle: "Camera Access Denied",
    cameraAccessDeniedDesc: "Please enable camera permissions in your browser settings and refresh the page.",
    captureButton: "Capture",
    cancelButton: "Cancel",
    previewTitle: "Preview",
    useThisPhotoButton: "Use this Photo",
    retakeButton: "Retake",
    uploadErrorTitle: "Upload Error",
    quotaErrorResize: (altText: string) => `The photo "${altText}" is too large to process, even after trying to resize. Please select a smaller file or capture a lower resolution image. Session storage quota exceeded.`,
    quotaErrorGeneral: (altText: string) => `The photo "${altText}" is too large to process. Please select a smaller file.`,
    fileReadError: (altText: string, specificError?: string) => `Failed to read file "${altText}"${specificError ? `: ${specificError}` : ''}.`,
    processingError: (altText: string, errorMsg: string) => `Error processing photo "${altText}": ${errorMsg}`,
    unknownProcessingError: (altText: string) => `An unknown error occurred while processing "${altText}".`,
    resizeWarningTitle: "Resizing Issue",
    resizeWarningDesc: (fileName: string) => `Could not resize "${fileName}". Using original. This might cause issues if the file is very large.`,
    imageLoadErrorResizeTitle: "Image Load Error for Resizing",
    imageLoadErrorResizeDesc: (fileName: string) => `Could not load "${fileName}" to resize it. Using original. This might cause issues if the file is very large.`,
    invalidFileTitle: "Invalid File",
    invalidFileDesc: "Please select an image file.",
    captureErrorTitle: "Capture Error",
    captureErrorDesc: "Could not capture photo.",
    languageUpdatedToastTitle: "Language Updated",
    languageUpdatedToastDesc: (langName: string) => `Display language is now ${langName}. AI responses will also be in this language if selected on the chat page.`,
    uploadProcessingToastTitle: "Processing Photo",
    uploadProcessingToastDesc: (fileName: string) => `Processing "${fileName}"...`,
    sessionStorageClearFailed: "Could not clear previous photo data from session storage. This might affect new uploads if storage is full.",
  },
  ne: {
    title: "अल्ट्रोनxजेमिनी छवि समीक्षा उपकरण",
    welcome: "स्वागत छ! आफ्नो यन्त्रबाट छवि चयन गर्नुहोस् वा आफ्नो क्यामेराले फोटो खिच्नुहोस्। त्यसपछि तपाईं आफ्नो फोटोको बारेमा Gemini AI सँग च्याट गर्न सक्नुहुन्छ।",
    feature1: "चयन वा क्याप्चर गर्नुहोस्: आफ्नो यन्त्रबाट एउटा छवि छान्नुहोस् वा आफ्नो क्यामेराबाट एउटा खिच्नुहोस्।",
    feature2: "एआईसँग च्याट गर्नुहोस्: तपाईंलाई आफ्नो फोटोको बारेमा Gemini लाई प्रश्नहरू सोध्न च्याट पृष्ठमा लगिनेछ।",
    feature3: "एपीआई कुञ्जी: एआई सुविधाहरूको लागि आफ्नो Google AI एपीआई कुञ्जी (सत्र भण्डारणमा भण्डार गरिएको) प्रदान गर्नुहोस्।",
    feature4: "ठूला फाइलहरू: ~2MB भन्दा ठूला छविहरू प्रशोधनमा मद्दत गर्न स्वचालित रूपमा रिसाइज हुन्छन्। धेरै ठूला फाइलहरू (उदाहरणका लागि 5-10MB भन्दा माथि) रिसाइज गरेपछि पनि ब्राउजर भण्डारण सीमा नाघ्न सक्छन् र लोड हुन असफल हुन सक्छन्।",
    selectPhotoButton: "फोटो चयन गर्नुहोस्",
    takePhotoButton: "फोटो खिच्नुहोस्",
    processing: "प्रशोधन गर्दै...",
    cameraAccessDeniedTitle: "क्यामेरा पहुँच अस्वीकृत",
    cameraAccessDeniedDesc: "कृपया आफ्नो ब्राउजर सेटिङहरूमा क्यामेरा अनुमतिहरू सक्षम गर्नुहोस् र पृष्ठ रिफ्रेस गर्नुहोस्।",
    captureButton: "खिच्नुहोस्",
    cancelButton: "रद्द गर्नुहोस्",
    previewTitle: "पूर्वावलोकन",
    useThisPhotoButton: "यो फोटो प्रयोग गर्नुहोस्",
    retakeButton: "पुनः खिच्नुहोस्",
    uploadErrorTitle: "अपलोड त्रुटि",
    quotaErrorResize: (altText: string) => `फोटो "${altText}" प्रशोधन गर्न धेरै ठूलो छ, रिसाइज गर्ने प्रयास गरेपछि पनि। कृपया सानो फाइल चयन गर्नुहोस् वा कम रिजोल्युसनको छवि खिच्नुहोस्। सत्र भण्डारण कोटा नाघ्यो।`,
    quotaErrorGeneral: (altText: string) => `फोटो "${altText}" प्रशोधन गर्न धेरै ठूलो छ। कृपया सानो फाइल चयन गर्नुहोस्।`,
    fileReadError: (altText: string, specificError?: string) => `फाइल "${altText}" पढ्न असफल भयो${specificError ? `: ${specificError}` : ''}।`,
    processingError: (altText: string, errorMsg: string) => `फोटो "${altText}" प्रशोधन गर्दा त्रुटि: ${errorMsg}`,
    unknownProcessingError: (altText: string) => `"${altText}" प्रशोधन गर्दा अज्ञात त्रुटि भयो।`,
    resizeWarningTitle: "रिसाइज समस्या",
    resizeWarningDesc: (fileName: string) => `"${fileName}" रिसाइज गर्न सकिएन। मूल प्रयोग गर्दै। यदि फाइल धेरै ठूलो छ भने यसले समस्या निम्त्याउन सक्छ।`,
    imageLoadErrorResizeTitle: "रिसाइजको लागि छवि लोड त्रुटि",
    imageLoadErrorResizeDesc: (fileName: string) => `"${fileName}" लाई रिसाइज गर्न लोड गर्न सकिएन। मूल प्रयोग गर्दै। यदि फाइल धेरै ठूलो छ भने यसले समस्या निम्त्याउन सक्छ।`,
    invalidFileTitle: "अमान्य फाइल",
    invalidFileDesc: "कृपया एउटा छवि फाइल चयन गर्नुहोस्।",
    captureErrorTitle: "क्याप्चर त्रुटि",
    captureErrorDesc: "फोटो खिच्न सकिएन।",
    languageUpdatedToastTitle: "भाषा अद्यावधिक गरियो",
    languageUpdatedToastDesc: (langName: string) => `प्रदर्शन भाषा अब ${langName} हो। च्याट पृष्ठमा चयन गरिएमा एआई प्रतिक्रियाहरू पनि यही भाषामा हुनेछन्।`,
    uploadProcessingToastTitle: "फोटो प्रशोधन गर्दै",
    uploadProcessingToastDesc: (fileName: string) => `"${fileName}" प्रशोधन भइरहेको छ...`,
    sessionStorageClearFailed: "पहिलेको फोटो डेटा सत्र भण्डारणबाट हटाउन सकिएन। यदि भण्डारण भरिएको छ भने यसले नयाँ अपलोडहरूलाई असर गर्न सक्छ।",
  }
};


export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); 

  const { toast } = useToast();
  const router = useRouter();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImageDataUri, setCapturedImageDataUri] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');

  useEffect(() => {
    const storedLanguage = sessionStorage.getItem(SESSION_STORAGE_LANGUAGE_KEY) as LanguageCode | null;
    if (storedLanguage && SUPPORTED_LANGUAGES.some(lang => lang.code === storedLanguage)) {
      setSelectedLanguage(storedLanguage);
    } else {
      setSelectedLanguage('en'); 
      sessionStorage.setItem(SESSION_STORAGE_LANGUAGE_KEY, 'en');
    }
  }, []);

  const texts = pageText[selectedLanguage];

  const handleLanguageChange = (value: string) => {
    const langCode = value as LanguageCode;
    setSelectedLanguage(langCode);
    sessionStorage.setItem(SESSION_STORAGE_LANGUAGE_KEY, langCode);
    const langName = SUPPORTED_LANGUAGES.find(l => l.code === langCode)?.name || 'the selected language';
    const currentToastTexts = pageText[langCode];
    toast({ 
        title: currentToastTexts.languageUpdatedToastTitle as string, 
        description: (currentToastTexts.languageUpdatedToastDesc as (langName: string) => string)(langName) 
    });
  };

  const clearPreviousPhotoData = () => {
    try {
      sessionStorage.removeItem(CURRENT_PHOTO_DATA_SESSION_KEY);
      sessionStorage.removeItem(CURRENT_PHOTO_ALT_SESSION_KEY);
    } catch (e) {
      console.warn("Could not clear previous photo data from session storage:", e);
      toast({
        title: texts.uploadErrorTitle as string,
        description: texts.sessionStorageClearFailed as string,
        variant: "destructive"
      });
    }
  };

  const processAndNavigate = async (dataUri: string, altText: string) => {
    setIsProcessing(true); 
    try {
      const isLikelyLarge = dataUri.length > (MAX_SIZE_BEFORE_RESIZE_BYTES * 1.33); // Base64 overhead approx.
      const isCameraCapture = capturedImageDataUri === dataUri; // Check if this dataUri is from camera

      let finalDataUri = dataUri;
      if (isLikelyLarge || isCameraCapture) { // Always resize camera captures for consistency, or if file is large
        finalDataUri = await resizeDataUri(dataUri, altText);
      }

      clearPreviousPhotoData(); 
      sessionStorage.setItem(CURRENT_PHOTO_DATA_SESSION_KEY, finalDataUri);
      sessionStorage.setItem(CURRENT_PHOTO_ALT_SESSION_KEY, altText);
      await router.push("/chat");
    } catch (error) {
      let errorMessage = texts.unknownProcessingError(altText) as string;
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        errorMessage = (texts.quotaErrorResize as (altText: string) => string)(altText);
      } else if (error instanceof Error) {
        errorMessage = (texts.processingError as (altText: string, errorMsg: string) => string)(altText, error.message);
      }
      toast({
        title: texts.uploadErrorTitle as string,
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Error in processAndNavigate:", error);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
      if (showCamera && !capturedImageDataUri) { // If camera was open but capture didn't finalize (e.g. error before capture)
        stopCameraStream();
        setShowCamera(false);
      }
      // Do not clear capturedImageDataUri here as it might be needed for retake/use logic if error occurs after capture but before navigation
    }
  };

  const resizeDataUri = (dataUri: string, fileName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
          let { width, height } = img;
          const aspectRatio = width / height;

          if (width > RESIZE_TARGET_WIDTH) {
            width = RESIZE_TARGET_WIDTH;
            height = width / aspectRatio;
          }
          if (height > RESIZE_TARGET_HEIGHT) {
            height = RESIZE_TARGET_HEIGHT;
            width = height * aspectRatio;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            console.warn(`Canvas 2D context not available for resizing "${fileName}". Using original image.`);
            toast({
              title: texts.resizeWarningTitle as string,
              description: (texts.resizeWarningDesc as (fileName: string) => string)(fileName),
              variant: "destructive",
            });
            resolve(dataUri); // Fallback to original if canvas fails
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          // Determine mime type from data URI (safer than assuming based on original file extension after processing)
          const mimeTypeMatch = dataUri.match(/^data:(image\/(jpeg|png|webp));base64,/);
          const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg'; // Default to jpeg
          
          const quality = mimeType === "image/jpeg" ? RESIZE_QUALITY : undefined; // Only apply quality for jpeg
          
          const resized = canvas.toDataURL(mimeType, quality);
          resolve(resized);
        };
        img.onerror = (error) => {
          console.warn(`Error loading image "${fileName}" for resizing. Using original image.`, error);
           toast({
              title: texts.imageLoadErrorResizeTitle as string,
              description: (texts.imageLoadErrorResizeDesc as (fileName: string) => string)(fileName),
              variant: "destructive",
            });
          resolve(dataUri); // Fallback to original if image load fails
        };
        img.src = dataUri;
    });
  }

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true); // Set processing true immediately

    if (!file.type.startsWith("image/")) {
      toast({ title: texts.invalidFileTitle as string, description: texts.invalidFileDesc as string, variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsProcessing(false);
      return;
    }
    
    const altText = file.name || `uploaded-image-${uuidv4()}`;
    
    toast({
      title: texts.uploadProcessingToastTitle as string,
      description: (texts.uploadProcessingToastDesc as (fileName: string) => string)(altText),
    });

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUriFromFile = e.target?.result as string;
        await processAndNavigate(dataUriFromFile, altText);
      };
      reader.onerror = () => {
        throw new Error((texts.fileReadError as (altText: string, specificError?: string) => string)(altText, reader.error ? reader.error.message : undefined));
      };
      reader.readAsDataURL(file);
    } catch (error) {
        let errorMessage = texts.unknownProcessingError(altText) as string;
         if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          errorMessage = (texts.quotaErrorGeneral as (altText: string) => string)(altText);
        } else if (error instanceof Error) {
          errorMessage = (texts.processingError as (altText: string, errorMsg: string) => string)(altText, error.message);
        }
        toast({
          title: texts.uploadErrorTitle as string,
          description: errorMessage,
          variant: "destructive",
        });
        console.error("Error in handleFileSelect:", error);
        setIsProcessing(false); // Reset processing on error
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
    } 
    // Note: setIsProcessing(false) is primarily handled by processAndNavigate's finally block
  };

  const triggerFileInput = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const startCamera = async () => {
    if (isProcessing) return;
    setIsProcessing(true); // Show spinner while camera initializes
    setCapturedImageDataUri(null); 
    setShowCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream); 
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: texts.cameraAccessDeniedTitle as string,
        description: texts.cameraAccessDeniedDesc.split(' and refresh the page.')[0] as string, // Simpler message for toast
      });
      setShowCamera(false); 
    } finally {
      setIsProcessing(false); // Hide spinner after camera attempt
    }
  };

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null; 
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;
    setIsProcessing(true); // Show spinner during capture processing
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg', 0.9); // Capture as JPEG, quality 0.9
      setCapturedImageDataUri(dataUri);
      stopCameraStream(); 
    } else {
      toast({ title: texts.captureErrorTitle as string, description: texts.captureErrorDesc as string, variant: "destructive"});
    }
    setIsProcessing(false); // Hide spinner after capture
  };
  
  const handleUseCapturedPhoto = async () => {
    if (capturedImageDataUri && !isProcessing) {
      const altText = `captured-photo-${uuidv4()}.jpg`;
      await processAndNavigate(capturedImageDataUri, altText);
      // processAndNavigate will set isProcessing and handle its reset
    }
  };

  const handleRetake = () => {
    if (isProcessing) return;
    setCapturedImageDataUri(null); 
    startCamera(); 
  };

  const handleCancelCamera = () => {
    if (isProcessing) return;
    stopCameraStream();
    setShowCamera(false);
    setCapturedImageDataUri(null);
    setHasCameraPermission(null); 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center space-y-8 px-4">
      <div className="absolute top-28 right-4 sm:right-6 lg:right-8">
        <Select value={selectedLanguage} onValueChange={handleLanguageChange} disabled={isProcessing}>
          <SelectTrigger className="w-[150px] text-sm" aria-label="Select language for display">
            <Languages className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map(lang => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <section className="max-w-2xl">
        <ImageIcon className="mx-auto h-16 w-16 text-primary mb-6" />
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {texts.title}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          {texts.welcome}
        </p>
        <ul className="mt-4 text-left text-muted-foreground list-disc list-inside space-y-2 bg-card p-6 rounded-lg shadow">
          <li><strong>{(texts.feature1 as string).split(':')[0]}:</strong> {(texts.feature1 as string).split(':').slice(1).join(':').trim()}</li>
          <li><strong>{(texts.feature2 as string).split(':')[0]}:</strong> {(texts.feature2 as string).split(':').slice(1).join(':').trim()}</li>
          <li><strong>{(texts.feature3 as string).split(':')[0]}:</strong> {(texts.feature3 as string).split(':').slice(1).join(':').trim()}</li>
          <li><strong>{(texts.feature4 as string).split(':')[0]}:</strong> {(texts.feature4 as string).split(':').slice(1).join(':').trim()}</li>
        </ul>

        <canvas ref={canvasRef} className="hidden"></canvas>

        {!showCamera && !capturedImageDataUri && (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload-input"
              disabled={isProcessing}
            />
            <Button onClick={triggerFileInput} size="lg" className="w-full py-6 text-lg" disabled={isProcessing}>
              {isProcessing ? ( 
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-5 w-5" />
              )}
              {texts.selectPhotoButton}
            </Button>
            <Button onClick={startCamera} size="lg" className="w-full py-6 text-lg" disabled={isProcessing}>
               {isProcessing ? ( 
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CameraIcon className="mr-2 h-5 w-5" />
              )}
              {texts.takePhotoButton}
            </Button>
          </div>
        )}

        {showCamera && !capturedImageDataUri && (
          <div className="mt-6 space-y-4">
            {hasCameraPermission === false && ( 
              <Alert variant="destructive">
                <AlertTitle>{texts.cameraAccessDeniedTitle}</AlertTitle>
                <AlertDescription>
                  {texts.cameraAccessDeniedDesc}
                </AlertDescription>
              </Alert>
            )}
            <div className="aspect-video bg-muted rounded-md overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleCapturePhoto} disabled={isProcessing || hasCameraPermission === false} className="w-full">
                    {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CameraIcon className="mr-2 h-4 w-4"/>} {texts.captureButton}
                </Button>
                <Button onClick={handleCancelCamera} variant="outline" className="w-full" disabled={isProcessing}>{texts.cancelButton}</Button>
            </div>
          </div>
        )}

        {capturedImageDataUri && (
          <div className="mt-6 space-y-4">
            <h2 className="text-2xl font-semibold">{texts.previewTitle}</h2>
            <img src={capturedImageDataUri} alt="Captured preview" className="rounded-md max-w-full max-h-[400px] mx-auto" />
            <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleUseCapturedPhoto} disabled={isProcessing} className="w-full">
                    {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : texts.useThisPhotoButton}
                </Button>
                <Button onClick={handleRetake} variant="outline" className="w-full" disabled={isProcessing}>{texts.retakeButton}</Button>
            </div>
            <Button onClick={handleCancelCamera} variant="ghost" className="w-full text-muted-foreground" disabled={isProcessing}>{texts.cancelButton}</Button>
          </div>
        )}
        
        {isProcessing && (
            <div className="mt-4 flex items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {texts.processing}
            </div>
        )}
      </section>
    </div>
  );
}
    

    