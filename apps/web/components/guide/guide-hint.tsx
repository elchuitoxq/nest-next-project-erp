"use client";

import { useGuideStore } from "@/stores/use-guide-store";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideHintProps {
  text: string;
  className?: string;
}

export function GuideHint({ text, className }: GuideHintProps) {
  const { isHelpMode } = useGuideStore();

  if (!isHelpMode) return null;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex ml-1.5 cursor-help transition-transform hover:scale-110 align-middle",
              className,
            )}
          >
            <Info className="h-3.5 w-3.5 text-blue-500 hover:text-blue-600" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="max-w-[280px] text-xs p-3 bg-white/95 backdrop-blur-md border-blue-100 text-slate-700 shadow-xl z-50"
        >
          <p className="font-semibold text-blue-600 mb-1 flex items-center gap-1">
            💡 Guía Rápida
          </p>
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
