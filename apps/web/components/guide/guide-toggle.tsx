"use client";

import { useGuideStore } from "@/stores/use-guide-store";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { HelpCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideToggleProps {
  className?: string;
}

export function GuideToggle({ className }: GuideToggleProps) {
  const { isHelpMode, toggleHelpMode } = useGuideStore();

  return (
    <div
      className={cn(
        "flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all duration-300",
        isHelpMode
          ? "bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 shadow-sm"
          : "bg-background/50 border-transparent hover:bg-muted/50 hover:border-border",
        className,
      )}
    >
      <Switch
        id="guide-mode-toggle"
        checked={isHelpMode}
        onCheckedChange={toggleHelpMode}
        className={cn(
          "data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500",
        )}
      />
      <Label
        htmlFor="guide-mode-toggle"
        className={cn(
          "text-xs font-bold flex items-center gap-1.5 cursor-pointer select-none transition-colors",
          isHelpMode
            ? "text-blue-700 dark:text-blue-400"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {isHelpMode ? (
          <Sparkles className="h-3.5 w-3.5 fill-blue-300 animate-pulse" />
        ) : (
          <HelpCircle className="h-3.5 w-3.5" />
        )}
        Guía Interactiva
      </Label>
    </div>
  );
}
