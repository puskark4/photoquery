
"use client";

import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";

import type { LanguageCode } from "@/lib/constants"; 
import { 
  API_KEY_SESSION_STORAGE_KEY,
  CURRENT_PHOTO_DATA_SESSION_KEY,
  CURRENT_PHOTO_ALT_SESSION_KEY,
  SUPPORTED_LANGUAGES,
  SESSION_STORAGE_LANGUAGE_KEY
} from "@/lib/constants";
import { PhotoQueryClientWrapper } from "@/components/shared/photo-query-client-wrapper";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Home, Loader2, KeyRound, Settings, ImageOff, Languages } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CurrentPhoto {
  src: string; // data URI
  alt: string;
}

// Localization object for Chat Page
const chatPageText: Record<LanguageCode, Record<string, string | ((...args: any[]) => string)>> = {
  en: {
    loadingPhotoDetails: "Loading photo details...",
    noPhotoDataFoundTitle: "No Photo Data Found",
    noPhotoDataFoundDesc: "Could not load photo data for chat. Please try selecting or capturing a photo again.",
    uploadCaptureButton: "Upload/Capture Another Photo",
    apiKeyDialogTitle: "API Key Required",
    apiKeyDialogDescription: "Please enter your Google AI API key to use the chat features. You can get one from",
    googleAiStudioLinkText: "Google AI Studio",
    apiKeyDialogPrivacy: "Your API key is stored in your browser's session storage and is only used for this session, ensuring your privacy.",
    apiKeyLabel: "API Key",
    apiKeyInputPlaceholder: "Enter your Google AI API Key",
    saveApiKeyButton: "Save API Key",
    apiKeySavedToastTitle: "API Key Saved",
    apiKeySavedToastDesc: "Your API key has been saved for this session.",
    invalidApiKeyToastTitle: "Invalid API Key",
    invalidApiKeyToastDesc: "Please enter a valid API key.",
    manageApiKeyButton: "Manage API Key",
    languageUpdatedToastTitle: "Language Updated",
    languageUpdatedToastDesc: (langName: string) => `AI responses will now be in ${langName}.`,
    apiKeyMissingAlertTitle: "API Key Missing",
    apiKeyMissingAlertDesc: "Please set your Google AI API key using the \"Manage API Key\" button to enable chat features.",
    aiChatDisabledCardTitle: "AI Chat Disabled",
    aiChatDisabledCardDesc: "Please provide your Google AI API Key to activate the chat functionality. Ensure a photo is loaded.",
    setApiKeyButton: "Set API Key",
    loadingChat: "Loading chat...",
    errorLoadingPhotoToastTitle: "Error Loading Photo",
    errorLoadingPhotoToastDesc: "Could not retrieve the photo data from your session. Please try uploading again.",
  },
  ne: {
    loadingPhotoDetails: "फोटो विवरण लोड हुँदैछ...",
    noPhotoDataFoundTitle: "फोटो डाटा फेला परेन",
    noPhotoDataFoundDesc: "च्याटको लागि फोटो डाटा लोड गर्न सकिएन। कृपया फेरि फोटो चयन वा खिच्ने प्रयास गर्नुहोस्।",
    uploadCaptureButton: "अर्को फोटो अपलोड/खिच्नुहोस्",
    apiKeyDialogTitle: "एपीआई कुञ्जी आवश्यक",
    apiKeyDialogDescription: "कृपया च्याट सुविधाहरू प्रयोग गर्न आफ्नो Google AI एपीआई कुञ्जी प्रविष्ट गर्नुहोस्। तपाईंले यो बाट प्राप्त गर्न सक्नुहुन्छ",
    googleAiStudioLinkText: "Google AI Studio",
    apiKeyDialogPrivacy: "तपाईंको एपीआई कुञ्जी तपाईंको ब्राउजरको सत्र भण्डारणमा भण्डार गरिएको छ र यो सत्रको लागि मात्र प्रयोग गरिन्छ, तपाईंको गोपनीयता सुनिश्चित गर्दै।",
    apiKeyLabel: "एपीआई कुञ्जी",
    apiKeyInputPlaceholder: "आफ्नो Google AI एपीआई कुञ्जी प्रविष्ट गर्नुहोस्",
    saveApiKeyButton: "एपीआई कुञ्जी सुरक्षित गर्नुहोस्",
    apiKeySavedToastTitle: "एपीआई कुञ्जी सुरक्षित भयो",
    apiKeySavedToastDesc: "तपाईंको एपीआई कुञ्जी यो सत्रको लागि सुरक्षित गरिएको छ।",
    invalidApiKeyToastTitle: "अमान्य एपीआई कुञ्जी",
    invalidApiKeyToastDesc: "कृपया मान्य एपीआई कुञ्जी प्रविष्ट गर्नुहोस्।",
    manageApiKeyButton: "एपीआई कुञ्जी व्यवस्थापन गर्नुहोस्",
    languageUpdatedToastTitle: "भाषा अद्यावधिक गरियो",
    languageUpdatedToastDesc: (langName: string) => `एआई प्रतिक्रियाहरू अब ${langName} मा हुनेछन्।`,
    apiKeyMissingAlertTitle: "एपीआई कुञ्जी छैन",
    apiKeyMissingAlertDesc: "कृपया च्याट सुविधाहरू सक्षम गर्न \"एपीआई कुञ्जी व्यवस्थापन गर्नुहोस्\" बटन प्रयोग गरेर आफ्नो Google AI एपीआई कुञ्जी सेट गर्नुहोस्।",
    aiChatDisabledCardTitle: "एआई च्याट असक्षम",
    aiChatDisabledCardDesc: "च्याट कार्यक्षमता सक्रिय गर्न कृपया आफ्नो Google AI एपीआई कुञ्जी प्रदान गर्नुहोस्। फोटो लोड भएको सुनिश्चित गर्नुहोस्।",
    setApiKeyButton: "एपीआई कुञ्जी सेट गर्नुहोस्",
    loadingChat: "च्याट लोड हुँदैछ...",
    errorLoadingPhotoToastTitle: "फोटो लोड गर्दा त्रुटि",
    errorLoadingPhotoToastDesc: "तपाईंको सत्रबाट फोटो डाटा पुन: प्राप्त गर्न सकिएन। कृपया फेरि अपलोड गर्ने प्रयास गर्नुहोस्।",
  }
};

function ChatPageContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentPhoto, setCurrentPhoto] = useState<CurrentPhoto | null | undefined>(undefined); // undefined for loading state
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);

  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const texts = chatPageText[selectedLanguage];

  useEffect(() => {
    const storedLanguage = sessionStorage.getItem(SESSION_STORAGE_LANGUAGE_KEY) as LanguageCode | null;
    if (storedLanguage && SUPPORTED_LANGUAGES.some(lang => lang.code === storedLanguage)) {
      setSelectedLanguage(storedLanguage);
    } else {
      setSelectedLanguage('en'); 
      sessionStorage.setItem(SESSION_STORAGE_LANGUAGE_KEY, 'en');
    }
  }, []);
  
  useEffect(() => {
    const currentToastTexts = chatPageText[selectedLanguage];

    const storedApiKey = sessionStorage.getItem(API_KEY_SESSION_STORAGE_KEY);
    if (storedApiKey) {
      setUserApiKey(storedApiKey.trim());
    } else {
      setShowApiKeyDialog(true);
    }

    setIsLoadingPhoto(true);
    try {
      const photoDataUri = sessionStorage.getItem(CURRENT_PHOTO_DATA_SESSION_KEY);
      const photoAlt = sessionStorage.getItem(CURRENT_PHOTO_ALT_SESSION_KEY);

      if (photoDataUri && photoAlt) {
         if (photoDataUri !== "null" && photoDataUri !== "undefined" && photoAlt !== "null" && photoAlt !== "undefined") {
            setCurrentPhoto({ src: photoDataUri, alt: photoAlt });
        } else {
            console.warn("Photo data or alt text was 'null' or 'undefined' string in session storage.");
            setCurrentPhoto(null);
        }
      } else {
        setCurrentPhoto(null); 
      }
    } catch (e) {
      console.error("Error reading photo data from session storage:", e);
      setCurrentPhoto(null);
      toast({
        title: currentToastTexts.errorLoadingPhotoToastTitle as string,
        description: currentToastTexts.errorLoadingPhotoToastDesc as string,
        variant: "destructive"
      });
    } finally {
      setIsLoadingPhoto(false);
    }

    // The main page (page.tsx) is responsible for clearing CURRENT_PHOTO_DATA_SESSION_KEY 
    // and CURRENT_PHOTO_ALT_SESSION_KEY before setting new data for the next photo.
    // Removing the cleanup here helps prevent issues with React StrictMode's double useEffect invocation in development.
    /*
    return () => {
      try {
        // Check if these keys exist before trying to remove, to avoid unnecessary errors if already cleared
        if (sessionStorage.getItem(CURRENT_PHOTO_DATA_SESSION_KEY)) {
          // sessionStorage.removeItem(CURRENT_PHOTO_DATA_SESSION_KEY);
        }
        if (sessionStorage.getItem(CURRENT_PHOTO_ALT_SESSION_KEY)) {
          // sessionStorage.removeItem(CURRENT_PHOTO_ALT_SESSION_KEY);
        }
      } catch (error) {
        console.warn("Could not clear photo data from session storage on chat unmount:", error);
      }
    };
    */
  }, [toast, selectedLanguage]);

  const handleSaveApiKey = () => {
    const currentToastTexts = chatPageText[selectedLanguage];
    const newApiKey = apiKeyInputRef.current?.value;
    if (newApiKey && newApiKey.trim() !== "") {
      const trimmedKey = newApiKey.trim();
      sessionStorage.setItem(API_KEY_SESSION_STORAGE_KEY, trimmedKey);
      setUserApiKey(trimmedKey);
      setShowApiKeyDialog(false);
      toast({ 
        title: currentToastTexts.apiKeySavedToastTitle as string, 
        description: currentToastTexts.apiKeySavedToastDesc as string 
      });
    } else {
      toast({ 
        title: currentToastTexts.invalidApiKeyToastTitle as string, 
        description: currentToastTexts.invalidApiKeyToastDesc as string, 
        variant: "destructive" 
      });
    }
  };

  const handleLanguageChange = (value: string) => {
    const langCode = value as LanguageCode;
    setSelectedLanguage(langCode); 
    sessionStorage.setItem(SESSION_STORAGE_LANGUAGE_KEY, langCode);
    const langName = SUPPORTED_LANGUAGES.find(l=>l.code === langCode)?.name || 'the selected language';
    const newToastTexts = chatPageText[langCode];
    toast({ 
      title: newToastTexts.languageUpdatedToastTitle as string, 
      description: (newToastTexts.languageUpdatedToastDesc as (langName: string) => string)(langName) 
    });
  };
  
  const photoForQuery = currentPhoto ? { id: "current-photo", src: currentPhoto.src, alt: currentPhoto.alt, dataUri: currentPhoto.src } : null;


  if (isLoadingPhoto || currentPhoto === undefined) { 
    return (
      <div className="text-center py-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{texts.loadingPhotoDetails}</p>
      </div>
    );
  }
  
  if (!currentPhoto) {
    return (
      <div className="text-center py-10 flex flex-col items-center">
        <ImageOff className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-4">{texts.noPhotoDataFoundTitle}</h1>
        <p className="text-muted-foreground mb-6">{texts.noPhotoDataFoundDesc}</p>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" /> {texts.uploadCaptureButton}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound /> {texts.apiKeyDialogTitle}</DialogTitle>
            <DialogDescription>
              {texts.apiKeyDialogDescription}{" "}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80">
                {texts.googleAiStudioLinkText}
              </a>.
              {" "}{texts.apiKeyDialogPrivacy}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-right col-span-1">
                {texts.apiKeyLabel}
              </Label>
              <Input id="apiKey" ref={apiKeyInputRef} className="col-span-3" placeholder={texts.apiKeyInputPlaceholder as string} type="password" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSaveApiKey}>{texts.saveApiKeyButton}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-6 flex flex-wrap gap-4 justify-between items-center">
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> {texts.uploadCaptureButton}
          </Link>
        </Button>
        <div className="flex gap-2 items-center">
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[180px] text-sm" aria-label="Select language for AI responses">
              <Languages className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setShowApiKeyDialog(true)}>
              <Settings className="mr-2 h-4 w-4" /> {texts.manageApiKeyButton}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground break-words">{currentPhoto.alt}</h1>
          <Card className="overflow-hidden shadow-lg rounded-lg">
            <AspectRatio ratio={16/9} className="bg-muted">
              <Image
                src={currentPhoto.src}
                alt={currentPhoto.alt}
                fill
                className="object-contain rounded-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </AspectRatio>
          </Card>
           {!userApiKey && (
             <Alert variant="destructive">
                <KeyRound className="h-4 w-4" />
                <AlertTitle>{texts.apiKeyMissingAlertTitle}</AlertTitle>
                <AlertDescription>
                    {texts.apiKeyMissingAlertDesc}
                </AlertDescription>
            </Alert>
           )}
        </div>

        <div className="sticky top-24">
          {userApiKey && photoForQuery ? (
            <PhotoQueryClientWrapper 
              photo={photoForQuery} 
              userApiKey={userApiKey} 
              selectedLanguage={selectedLanguage} 
            />
          ) : (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                   {texts.aiChatDisabledCardTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{texts.aiChatDisabledCardDesc}</p>
                {!userApiKey && 
                  <Button className="mt-4 w-full" onClick={() => setShowApiKeyDialog(true)}>
                      <KeyRound className="mr-2 h-4 w-4" /> {texts.setApiKeyButton}
                  </Button>
                }
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  let initialLanguage: LanguageCode = 'en';
  if (typeof window !== 'undefined') {
    const storedLanguage = sessionStorage.getItem(SESSION_STORAGE_LANGUAGE_KEY) as LanguageCode | null;
    if (storedLanguage && SUPPORTED_LANGUAGES.some(lang => lang.code === storedLanguage)) {
      initialLanguage = storedLanguage;
    }
  }
  const fallbackTexts = chatPageText[initialLanguage];

  return (
    <Suspense fallback={
      <div className="text-center py-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{fallbackTexts.loadingChat}</p>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}

    

    