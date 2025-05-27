
"use client";

import type { Photo, LanguageCode } from "@/lib/constants"; 
import { SUPPORTED_LANGUAGES } from "@/lib/constants"; 
import { useState, useTransition, useEffect, useRef } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Send, RefreshCw, AlertTriangle, Wand2, KeyRound, User, Sparkles } from "lucide-react";
import { handleAnalyzePhotoAction, handleEnhanceQueryAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PhotoQueryClientWrapperProps {
  photo: Photo;
  userApiKey: string | null;
  selectedLanguage: LanguageCode;
}

const FormSchema = z.object({
  question: z.string().min(1, "Question cannot be empty.").max(1000, "Question is too long."), // Adjusted min length
});

type FormValues = z.infer<typeof FormSchema>;

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

// Localization object for PhotoQueryClientWrapper
const queryClientText: Record<LanguageCode, Record<string, string | ((...args: any[]) => string)>> = {
  en: {
    cardTitle: "Chat with Gemini AI",
    yourQuestionLabel: "Your Question",
    questionPlaceholder: "e.g., What are the main colors in this photo?",
    askAiButton: "Ask AI",
    enhanceQueryButton: "Retry / Enhance",
    maxRetriesButton: "Max Retries Reached",
    apiKeyMissingError: "API Key is missing. Please set it via settings to use AI features.",
    apiKeyRequiredToastTitle: "API Key Required",
    apiKeyRequiredToastDesc: "Please set your API key.",
    photoDataMissingError: "AI analysis is not available as photo data could not be loaded. Please try uploading/capturing again.",
    errorToastTitle: "Error",
    queryEnhancedToastTitle: "Response Updated",
    queryEnhancedToastDesc: "AI has provided an updated response.",
    thinking: "Thinking...",
    aiResponseTitle: "AI Response:", // Might not be used directly if history is primary
    photoDataMissingAlertTitle: "Photo Data Missing",
    photoDataMissingAlertDesc: "AI analysis is not available as photo data could not be loaded. Please try uploading/capturing again.",
    apiKeyMissingAlertTitle: "API Key Missing",
    apiKeyMissingAlertDesc: "Please set your Google AI API key using the \"Manage API Key\" button (top of page) to enable chat features.",
    cannotEnhanceToastTitle: "Cannot Enhance",
    cannotEnhanceToastDesc: "Need an initial question and response to enhance.",
    questionMinLengthError: "Question cannot be empty.", // Updated
    userBubbleLabel: "You",
    aiBubbleLabel: "AI",
    chatHistoryTitle: "Chat History",
    sendButtonLabel: "Send",
  },
  ne: {
    cardTitle: "Gemini AI सँग च्याट गर्नुहोस्",
    yourQuestionLabel: "तपाईंको प्रश्न",
    questionPlaceholder: "उदाहरणका लागि, यो फोटोमा मुख्य रंगहरू के के छन्?",
    askAiButton: "AI लाई सोध्नुहोस्",
    enhanceQueryButton: "पुनः प्रयास / सुधार गर्नुहोस्",
    maxRetriesButton: "अधिकतम प्रयास पुग्यो",
    apiKeyMissingError: "एपीआई कुञ्जी छैन। कृपया एआई सुविधाहरू प्रयोग गर्न सेटिङहरू मार्फत सेट गर्नुहोस्।",
    apiKeyRequiredToastTitle: "एपीआई कुञ्जी आवश्यक",
    apiKeyRequiredToastDesc: "कृपया आफ्नो एपीआई कुञ्जी सेट गर्नुहोस्।",
    photoDataMissingError: "फोटो डाटा लोड गर्न नसकिएकाले एआई विश्लेषण उपलब्ध छैन। कृपया फेरि अपलोड/खिच्ने प्रयास गर्नुहोस्।",
    errorToastTitle: "त्रुटि",
    queryEnhancedToastTitle: "प्रतिक्रिया अद्यावधिक गरियो",
    queryEnhancedToastDesc: "एआईले अद्यावधिक प्रतिक्रिया प्रदान गरेको छ।",
    thinking: "सोच्दै...",
    aiResponseTitle: "एआई प्रतिक्रिया:",
    photoDataMissingAlertTitle: "फोटो डाटा छैन",
    photoDataMissingAlertDesc: "फोटो डाटा लोड गर्न नसकिएकाले एआई विश्लेषण उपलब्ध छैन। कृपया फेरि अपलोड/खिच्ने प्रयास गर्नुहोस्।",
    apiKeyMissingAlertTitle: "एपीआई कुञ्जी छैन",
    apiKeyMissingAlertDesc: "कृपया च्याट सुविधाहरू सक्षम गर्न पृष्ठको शीर्षमा रहेको \"एपीआई कुञ्जी व्यवस्थापन गर्नुहोस्\" बटन प्रयोग गरेर आफ्नो Google AI एपीआई कुञ्जी सेट गर्नुहोस्।",
    cannotEnhanceToastTitle: "सुधार गर्न सकिँदैन",
    cannotEnhanceToastDesc: "सुधार गर्न प्रारम्भिक प्रश्न र प्रतिक्रिया आवश्यक छ।",
    questionMinLengthError: "प्रश्न खाली हुन सक्दैन।", // Updated
    userBubbleLabel: "तपाईं",
    aiBubbleLabel: "एआई",
    chatHistoryTitle: "च्याट इतिहास",
    sendButtonLabel: "पठाउनुहोस्",
  }
};


export function PhotoQueryClientWrapper({ photo, userApiKey, selectedLanguage }: PhotoQueryClientWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const [aiResponse, setAiResponse] = useState<string | null>(null); // Holds the LATEST AI response for enhance logic
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const texts = queryClientText[selectedLanguage];

  const localizedFormSchema = z.object({
    question: z.string().min(1, texts.questionMinLengthError as string).max(1000, "Question is too long."),
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(localizedFormSchema),
    defaultValues: {
      question: "",
    },
  });
  
  const isChatDisabled = !userApiKey || !photo.dataUri;

  useEffect(() => {
    const currentTexts = queryClientText[selectedLanguage];
    if (!userApiKey) {
      form.reset();
      setAiResponse(null);
      setChatHistory([]); 
      setErrorMessage(currentTexts.apiKeyMissingAlertDesc as string);
    } else if (!photo.dataUri) {
       form.reset();
       setAiResponse(null);
       setChatHistory([]);
       setErrorMessage(currentTexts.photoDataMissingError as string);
    } else {
      // New photo or API key is available, reset everything for a fresh start
      setErrorMessage(null); 
      setChatHistory([]);
      setAiResponse(null);
      setCurrentQuestion("");
      setRetryCount(0);
      form.reset({ question: "" }); // Ensure form is cleared for new photo context
    }
  }, [userApiKey, photo.dataUri, selectedLanguage]); // `form` removed, it's reset inside. `selectedLanguage` added to re-init on lang change.


  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    const currentTexts = queryClientText[selectedLanguage];
    if (!userApiKey) {
      toast({ title: currentTexts.apiKeyRequiredToastTitle as string, description: currentTexts.apiKeyRequiredToastDesc as string, variant: "destructive" });
      return;
    }
    if (!photo.dataUri) {
      setErrorMessage(currentTexts.photoDataMissingError as string);
      return;
    }

    setErrorMessage(null);
    // setAiResponse(null); // Don't nullify aiResponse here, it's used for "enhance"
    setRetryCount(0); 
    setCurrentQuestion(data.question);

    setChatHistory(prev => [...prev, {
      id: `user-${Date.now()}-${Math.random()}`,
      type: 'user',
      content: data.question,
      timestamp: new Date()
    }]);
    form.reset(); 

    startTransition(async () => {
      try {
        const result = await handleAnalyzePhotoAction({
          photoDataUri: photo.dataUri!,
          question: data.question,
          userApiKey: userApiKey, 
          language: selectedLanguage,
        });
        if (result.error) {
          setErrorMessage(result.error);
          toast({ title: currentTexts.errorToastTitle as string, description: result.error, variant: "destructive" });
          setChatHistory(prev => [...prev, {
            id: `ai-error-${Date.now()}-${Math.random()}`,
            type: 'ai',
            content: `${currentTexts.errorToastTitle}: ${result.error}`,
            timestamp: new Date()
          }]);
        } else {
          const aiMsg = result.answer ?? "No answer received.";
          setAiResponse(aiMsg); 
          setChatHistory(prev => [...prev, {
            id: `ai-${Date.now()}-${Math.random()}`,
            type: 'ai',
            content: aiMsg,
            timestamp: new Date()
          }]);
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
        setErrorMessage(errMsg);
        toast({ title: currentTexts.errorToastTitle as string, description: errMsg, variant: "destructive" });
         setChatHistory(prev => [...prev, {
            id: `ai-exception-${Date.now()}-${Math.random()}`,
            type: 'ai',
            content: `${currentTexts.errorToastTitle}: ${errMsg}`,
            timestamp: new Date()
          }]);
      }
    });
  };

  const handleEnhance = () => {
    const currentTexts = queryClientText[selectedLanguage];
    if (!userApiKey) {
      toast({ title: currentTexts.apiKeyRequiredToastTitle as string, description: "Please set your API key to enhance the query.", variant: "destructive" });
      return;
    }
    if (!photo.dataUri || !currentQuestion || !aiResponse) {
      toast({ title: currentTexts.cannotEnhanceToastTitle as string, description: currentTexts.cannotEnhanceToastDesc as string, variant: "destructive" });
      return;
    }
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await handleEnhanceQueryAction({
          photoDataUri: photo.dataUri!,
          query: currentQuestion,
          previousResponse: aiResponse, // Send the LATEST AI response
          retryCount: retryCount,
          userApiKey: userApiKey,
          language: selectedLanguage,
        });

        if (result.error) {
          setErrorMessage(result.error);
          toast({ title: currentTexts.errorToastTitle as string, description: result.error, variant: "destructive" });
          setChatHistory(prev => [...prev, {
            id: `ai-enhance-error-${Date.now()}-${Math.random()}`,
            type: 'ai',
            content: `${currentTexts.errorToastTitle} (Enhance): ${result.error}`,
            timestamp: new Date()
          }]);
        } else {
          const enhancedMsg = result.enhancedResponse ?? "No enhanced response received.";
          setAiResponse(enhancedMsg); // Update the LATEST AI response
          setRetryCount(result.retryCount ?? retryCount + 1);
          setChatHistory(prev => [...prev, {
            id: `ai-enhanced-${Date.now()}-${Math.random()}`,
            type: 'ai',
            content: enhancedMsg,
            timestamp: new Date()
          }]);
          toast({ title: currentTexts.queryEnhancedToastTitle as string, description: currentTexts.queryEnhancedToastDesc as string});
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "An unexpected error occurred during enhancement.";
        setErrorMessage(errMsg);
        toast({ title: currentTexts.errorToastTitle as string, description: errMsg, variant: "destructive" });
        setChatHistory(prev => [...prev, {
            id: `ai-enhance-exception-${Date.now()}-${Math.random()}`,
            type: 'ai',
            content: `${currentTexts.errorToastTitle} (Enhance): ${errMsg}`,
            timestamp: new Date()
          }]);
      }
    });
  };
  
  useEffect(() => {
    const currentTexts = queryClientText[selectedLanguage];
    const newSchema = z.object({
        question: z.string().min(1, currentTexts.questionMinLengthError as string).max(1000, "Question is too long."),
    });
    // This is tricky, directly manipulating form's resolver like this is not standard.
    // It's better to re-initialize the form or ensure the resolver can access `texts`.
    // For now, the initial schema uses `texts` which updates on `selectedLanguage` change.
    // Re-validating or resetting might be needed if errors don't update dynamically.
    // form.reset(form.getValues(), { resolver: zodResolver(newSchema) } as any); // Potential re-init if needed
  }, [selectedLanguage, form, texts.questionMinLengthError]);


  return (
    <Card className="shadow-lg flex flex-col h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] max-h-[700px] w-full"> {/* Adjusted height */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <Wand2 className="h-6 w-6 text-primary" />
          {texts.cardTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 flex-grow flex flex-col overflow-hidden p-4 sm:p-6">
        {!photo.dataUri && (
           <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{texts.photoDataMissingAlertTitle}</AlertTitle>
            <AlertDescription>{texts.photoDataMissingAlertDesc}</AlertDescription>
          </Alert>
        )}
         {!userApiKey && photo.dataUri && (
            <Alert variant="destructive">
                <KeyRound className="h-4 w-4" />
                <AlertTitle>{texts.apiKeyMissingAlertTitle}</AlertTitle>
                <AlertDescription>{texts.apiKeyMissingAlertDesc}</AlertDescription>
            </Alert>
        )}

        <div className="flex-grow overflow-y-auto pr-2 space-y-3 sm:space-y-4 custom-scrollbar" ref={chatContainerRef}>
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.type === 'ai' && (
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow ${
                  msg.type === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-card border text-card-foreground rounded-bl-none' 
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
              {msg.type === 'user' && (
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>

        {errorMessage && !isPending && ( // Only show general error if not also showing "Thinking..."
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-start gap-2 text-xs sm:text-sm mt-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {isPending && chatHistory.length > 0 && chatHistory[chatHistory.length -1].type === 'user' && (
          <div className="flex items-center justify-start p-2 text-muted-foreground text-sm">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <p>{texts.thinking}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 pb-2 sm:pt-4 sm:pb-4 border-t bg-background/95 backdrop-blur-sm">
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-2">
          <div className="flex gap-2 items-end">
            <Textarea
              id="question"
              placeholder={texts.questionPlaceholder as string}
              {...form.register("question")}
              className="mt-0 min-h-[40px] max-h-[120px] flex-grow resize-none custom-scrollbar p-2 text-sm sm:text-base"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!form.formState.isSubmitting && form.getValues("question").trim() !== "") {
                     form.handleSubmit(onSubmit)();
                  }
                }
              }}
              aria-invalid={form.formState.errors.question ? "true" : "false"}
              disabled={isPending || isChatDisabled}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-10 w-10 flex-shrink-0" 
              disabled={isPending || isChatDisabled || !form.watch("question")?.trim()}
              aria-label={texts.sendButtonLabel as string}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {form.formState.errors.question && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.question.message}</p>
          )}
          {photo.dataUri && userApiKey && aiResponse && chatHistory.some(m => m.type === 'ai') && (
             <Button onClick={handleEnhance} variant="outline" className="w-full mt-2 text-xs sm:text-sm h-9" disabled={isPending || retryCount >= 3 || isChatDisabled}>
                {isPending && currentQuestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                {retryCount >=3 ? texts.maxRetriesButton : texts.enhanceQueryButton}
             </Button>
          )}
        </form>
      </CardFooter>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted) / 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border)); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.8);
        }
      `}</style>
    </Card>
  );
}
