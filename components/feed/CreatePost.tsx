"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ImagePlus,
  Send,
  X,
  Loader2,
  Megaphone,
  Newspaper,
  Briefcase,
  CalendarDays,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { useFeed } from "@/hooks/useFeed";

interface CreatePostProps {
  onSubmit: ReturnType<typeof useFeed>["createPost"];
  onUpload: ReturnType<typeof useFeed>["uploadImage"];
}

const POST_TYPES = [
  {
    value: "general",
    label: "Général",
    icon: Globe,
    color:
      "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300",
    active: "bg-slate-600 text-white",
  },
  {
    value: "annonce",
    label: "Annonce",
    icon: Megaphone,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300",
    active: "bg-blue-600 text-white",
  },
  {
    value: "actualite",
    label: "Actualité",
    icon: Newspaper,
    color:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
    active: "bg-emerald-600 text-white",
  },
  {
    value: "offre",
    label: "Offre d'emploi",
    icon: Briefcase,
    color:
      "bg-violet-50 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300",
    active: "bg-violet-600 text-white",
  },
  {
    value: "evenement",
    label: "Événement",
    icon: CalendarDays,
    color:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
    active: "bg-amber-600 text-white",
  },
];

const MAX_CHARS = 1200;

export function CreatePost({ onSubmit, onUpload }: CreatePostProps) {
  const { profile } = useAuth();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("general");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const isNearLimit = charsLeft < 100 && !isOverLimit;

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 5 Mo)");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      toast.error("Format non supporté (JPEG, PNG, WebP, GIF)");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFileSelect(e.dataTransfer.files?.[0]);
    },
    [handleFileSelect],
  );

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim() || submitting || isOverLimit) return;

      setSubmitting(true);
      try {
        let imageUrl: string | null = null;
        if (imageFile) {
          setUploading(true);
          imageUrl = await onUpload(imageFile);
          setUploading(false);
        }

        const result = await onSubmit(
          content,
          postType,
          postType !== "general"
            ? POST_TYPES.find((t) => t.value === postType)?.label
            : undefined,
          imageUrl ?? undefined,
        );

        if (result && !result.error) {
          setContent("");
          setImageFile(null);
          setImagePreview(null);
          setIsExpanded(false);
          setPostType("general");
          toast.success("Publication envoyée !");
        }
      } catch {
        toast.error("Erreur lors de la publication");
      } finally {
        setSubmitting(false);
        setUploading(false);
      }
    },
    [content, postType, imageFile, submitting, isOverLimit, onSubmit, onUpload],
  );

  const handleCancel = () => {
    setContent("");
    setImageFile(null);
    setImagePreview(null);
    setIsExpanded(false);
    setPostType("general");
  };

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 80);
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const selectedType =
    POST_TYPES.find((t) => t.value === postType) ?? POST_TYPES[0];

  return (
    <Card
      className={cn(
        "border-border/60 p-0 transition-all duration-300",
        isExpanded && "shadow-md border-primary/20",
      )}
    >
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <div className="flex-1  min-w-0">
              {/* Collapsed trigger */}
              {!isExpanded ? (
                <div className="flex flex-row gap-2 items-center">
                  {/* Avatar */}
                  <Avatar className="size-10 shrink-0 ring-2 ring-border/20">
                    {profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <button
                    type="button"
                    onClick={handleExpand}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left text-sm text-muted-foreground transition-all duration-200",
                      "border-border bg-muted/40 hover:bg-muted/70 hover:border-primary/30",
                      profile?.role === "exposant" &&
                        "border-primary/30 bg-primary/5 text-primary/70 hover:bg-primary/10",
                    )}
                  >
                    {profile?.role === "exposant"
                      ? "Publiez une annonce ou une actualité pour votre stand..."
                      : "Partagez une actualité, une annonce ou une opportunité..."}
                  </button>
                </div>
              ) : (
                <>
                  {/* Type selector pills */}
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {POST_TYPES.map((t) => {
                      const Icon = t.icon;
                      const isActive = postType === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setPostType(t.value)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
                            isActive
                              ? t.active + " shadow-sm scale-105"
                              : t.color + " hover:opacity-80",
                          )}
                        >
                          <Icon className="size-3" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Textarea */}
                  <div
                    className={cn(
                      "relative rounded-2xl border transition-all duration-200",
                      "border-border/60 bg-muted/20 focus-within:border-primary/40 focus-within:bg-background focus-within:shadow-sm",
                    )}
                  >
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        autoResize(e.target);
                      }}
                      placeholder={
                        postType === "annonce"
                          ? "Rédigez votre annonce..."
                          : postType === "actualite"
                            ? "Quelle est votre actualité ?"
                            : postType === "offre"
                              ? "Décrivez le poste et le profil recherché..."
                              : postType === "evenement"
                                ? "Présentez votre événement (lieu, date, horaires)..."
                                : "De quoi voulez-vous parler ?"
                      }
                      rows={3}
                      className="w-full resize-none rounded-2xl bg-transparent px-4 pt-4 pb-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 leading-relaxed"
                      style={{ minHeight: "100px" }}
                    />

                    {/* Char counter */}
                    <div className="flex items-center justify-end px-4 pb-2">
                      <span
                        className={cn(
                          "text-[11px] tabular-nums transition-colors",
                          isOverLimit
                            ? "text-destructive font-semibold"
                            : isNearLimit
                              ? "text-amber-500"
                              : "text-muted-foreground/40",
                        )}
                      >
                        {charsLeft}
                      </span>
                    </div>
                  </div>

                  {/* Image preview */}
                  {imagePreview && (
                    <div className="relative mt-3 overflow-hidden rounded-2xl border border-border bg-muted/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="max-h-72 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                      >
                        <X className="size-3.5" />
                      </button>
                      <div className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                        {imageFile?.name}
                      </div>
                    </div>
                  )}

                  {/* Drag & drop zone (only when no image) */}
                  {!imagePreview && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-3 text-xs transition-all duration-150",
                        dragOver
                          ? "border-primary bg-primary/5 scale-[1.01]"
                          : "border-border/60 text-muted-foreground hover:border-primary/40 hover:bg-muted/30",
                      )}
                    >
                      <ImagePlus
                        className={cn(
                          "size-4 transition-colors",
                          dragOver && "text-primary",
                        )}
                      />
                      <span>
                        {dragOver
                          ? "Déposez l'image ici"
                          : "Ajouter une image — glisser-déposer ou cliquer"}
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) =>
                          handleFileSelect(e.target.files?.[0] || null)
                        }
                      />
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          selectedType.color,
                        )}
                      >
                        {selectedType.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="rounded-full text-muted-foreground"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!content.trim() || submitting || isOverLimit}
                        className={cn(
                          "rounded-full gap-1.5 font-semibold transition-all",
                          content.trim() && !isOverLimit && "shadow-sm",
                        )}
                      >
                        {submitting ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        {uploading
                          ? "Upload…"
                          : submitting
                            ? "Publication…"
                            : "Publier"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
