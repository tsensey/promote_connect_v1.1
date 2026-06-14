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
import { useTranslation } from '@/lib/i18n';

interface CreatePostFABProps {
  onSubmit: ReturnType<typeof useFeed>['createPost'];
  onUpload: ReturnType<typeof useFeed>['uploadImage'];
}

export function CreatePostFAB({ onSubmit, onUpload }: CreatePostFABProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector('main.overflow-y-auto') || window;
    
    const handleScroll = (e: Event | { target: any }) => {
      const target = e.target as any;
      const scrollY = target === document || target === window 
        ? window.scrollY 
        : target.scrollTop;
        
      if (scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll({ target: scrollContainer });

    return () => scrollContainer.removeEventListener('scroll', handleScroll);
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
          "fixed md:hidden bottom-20 right-6 z-40 rounded-full hover:transition-all duration-300 h-14 w-14 sm:h-auto sm:w-auto sm:px-4",
          visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-20 opacity-0 scale-90 pointer-events-none"
        )}
      >
        <Send className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-2" />
        <span className="hidden sm:inline">{t('feed.create.publish')}</span>
      </Button>

      {/* Modal - Sheet on mobile, Dialog on desktop */}
      {isMobile ? (
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent side="bottom" className="max-h-[95vh] overflow-y-auto rounded-t-3xl p-0 border-none">
            <div className="bg-background px-4 pb-6 pt-4">
              <div className="mb-4 text-center">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/20" />
              </div>
              <CreatePost
                onSubmit={onSubmit}
                onUpload={onUpload}
                onSuccess={() => setOpen(false)}
                onCancel={() => setOpen(false)}
                initiallyExpanded={true}
                variant="ghost"
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className={cn(
            "fixed bottom-0 left-[50%] translate-x-[-50%] top-auto translate-y-0", // Stick to very bottom
            "max-w-2xl p-0 overflow-hidden border-none rounded-t-3xl animate-in slide-in-from-bottom-full duration-300"
          )}>
            <div className="bg-background p-6">
              <CreatePost
                onSubmit={onSubmit}
                onUpload={onUpload}
                onSuccess={() => setOpen(false)}
                onCancel={() => setOpen(false)}
                initiallyExpanded={true}
                variant="ghost"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
