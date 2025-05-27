
// This file is no longer needed and can be deleted.
// If Next.js throws an error because it's missing, ensure all links to /gallery are removed.
// For now, returning a simple message or redirecting.
import Link from 'next/link';
import {Button} from '@/components/ui/button';

export default function GalleryPageRedirect() {
  return (
    <div className="text-center py-10">
      <p className="text-xl">The photo gallery has been simplified.</p>
      <Button asChild className="mt-4">
        <Link href="/">Go to Upload Page</Link>
      </Button>
    </div>
  );
}
