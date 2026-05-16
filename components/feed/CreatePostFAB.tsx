'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { useFeed } from '@/hooks/useFeed';
import { CreatePost } from './CreatePost';

interface CreatePostFABProps {
  onSubmit: ReturnType<typeof useFeed>['createPost'];
  onUpload: ReturnType<typeof useFeed>['uploadImage'];
}

export function CreatePostFAB({ onSubmit, onUpload }: CreatePostFABProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return (
    <>
      {/* FAB Button */}
      <Button
        onClick={() => setOpen(true)}
        size="lg"
        className={cn(
          "fixed bottom-6 right-6 z-40 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 h-14 w-14 sm:h-auto sm:w-auto sm:px-4",
          visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-90 pointer-events-none"
        )}
      >
        <Send className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
        <span className="hidden sm:inline">Partager</span>
      </Button>

      {/* Modal - Sheet on mobile, Dialog on desktop */}
      {isMobile ? (
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent side="bottom" className="max-h-[95vh] overflow-y-auto rounded-t-3xl px-0 pb-0 border-none">
            <div className="px-4 pb-4 pt-2">
              <CreatePost
                onSubmit={onSubmit}
                onUpload={onUpload}
                onSuccess={() => setOpen(false)}
                onCancel={() => setOpen(false)}
                initiallyExpanded={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className={cn(
            "fixed bottom-6 left-[50%] translate-x-[-50%] top-auto translate-y-0", // Stick to bottom
            "max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl animate-in slide-in-from-bottom-5"
          )}>
            <div className="p-1">
              <CreatePost
                onSubmit={onSubmit}
                onUpload={onUpload}
                onSuccess={() => setOpen(false)}
                onCancel={() => setOpen(false)}
                initiallyExpanded={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
