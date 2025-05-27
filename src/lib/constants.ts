
export interface Photo {
  id: string;
  src: string; // For display (can be URL or data URI for uploaded)
  alt: string;
  dataAiHint?: string; // For placeholder images to find suitable images on Unsplash
  dataUri?: string; // Actual data URI for AI processing. For uploaded images, this will be same as src.
}

// Constant for sessionStorage key for API Key
export const API_KEY_SESSION_STORAGE_KEY = "gemini-eye-user-api-key";

// Constants for the current photo data stored in sessionStorage
export const CURRENT_PHOTO_DATA_SESSION_KEY = "gemini-eye-current-photo-data";
export const CURRENT_PHOTO_ALT_SESSION_KEY = "gemini-eye-current-photo-alt";


export const DEFAULT_AI_MODEL = 'googleai/gemini-2.0-flash';

// Language constants
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ne', name: 'Nepali' },
] as const; // `as const` makes it a readonly tuple with literal types

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];
export type LanguageName = typeof SUPPORTED_LANGUAGES[number]['name'];


export const SESSION_STORAGE_LANGUAGE_KEY = "gemini-eye-selected-language";

export const placeholderPhotos: Photo[] = [
  {
    id: "an-unsplash-photo-1",
    src: "https://images.unsplash.com/photo-1682686580122-cc228122f657?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Beautiful mountain landscape at sunset",
    dataAiHint: "Beautiful mountain landscape at sunset, with warm colors and dramatic clouds."
  },
  {
    id: "an-unsplash-photo-2",
    src: "https://images.unsplash.com/photo-1716696421272-08591a3e9594?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "City skyline at night",
    dataAiHint: "Panoramic view of a city skyline at night, with illuminated buildings and reflections on water."
  },
  {
    id: "an-unsplash-photo-3",
    src: "https://images.unsplash.com/photo-1715847403085-55e025a0e35e?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Close-up of a flower with dew drops",
    dataAiHint: "Macro shot of a vibrant flower with intricate details and water droplets on its petals."
  },
   {
    id: "an-unsplash-photo-4",
    src: "https://images.unsplash.com/photo-1716445347497-d1605a3f015a?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Forest path with dappled sunlight",
    dataAiHint: "Serene view of a forest path with sunlight filtering through the trees, creating a peaceful atmosphere."
  },
  {
    id: "an-unsplash-photo-5",
    src: "https://images.unsplash.com/photo-1682686581493-511f8f601cb7?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Abstract painting with bold colors",
    dataAiHint: "Close-up of an abstract painting featuring a dynamic interplay of bold colors and textures."
  },
  {
    id: "an-unsplash-photo-6",
    src: "https://images.unsplash.com/photo-1716888533639-4d6317278546?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "A person reading a book by a window",
    dataAiHint: "A cozy scene of a person reading a book by a window with soft natural light."
  },
   {
    id: "an-unsplash-photo-7",
    src: "https://images.unsplash.com/photo-1716230670994-6e7f2ab96912?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Still life of fruit on a table",
    dataAiHint: "Classic still life composition with a bowl of fresh fruit on a rustic table."
  },
  {
    id: "an-unsplash-photo-8",
    src: "https://images.unsplash.com/photo-1716823949578-27263f577289?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Ocean waves crashing on a rocky shore",
    dataAiHint: "Dramatic view of ocean waves breaking against a rugged coastline under a cloudy sky."
  },
  {
    id: "an-unsplash-photo-9",
    src: "https://images.unsplash.com/photo-1716793907654-452b092f30c5?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    alt: "Architecture of a modern building",
    dataAiHint: "Sleek and minimalist architecture of a modern building with geometric shapes and glass facades."
  }
];
export const defaultPhotoId = placeholderPhotos[0]?.id || "default-placeholder";


// Removed UPLOADED_PHOTO_SESSION_KEY_PREFIX, 
// SESSION_STORAGE_GALLERY_SUCCESSFUL_KEY, SESSION_STORAGE_GALLERY_FAILED_KEY,
// SuccessfulPhotoMeta, FailedPhotoMeta as gallery is removed.
