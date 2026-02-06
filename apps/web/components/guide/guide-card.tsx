"use client";

import { useGuideStore } from "@/stores/use-guide-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  variant?: "info" | "tip" | "warning";
}

export function GuideCard({
  title,
  children,
  className,
  variant = "info",
}: GuideCardProps) {
  const { isHelpMode } = useGuideStore();

  if (!isHelpMode) return null;

  const styles = {
    info: "border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100",
    tip: "border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100",
    warning:
      "border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100",
  };

  const iconStyles = {
    info: "text-blue-600 dark:text-blue-400",
    tip: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className="overflow-hidden mb-4"
      >
        <Card
          className={cn(
            "border backdrop-blur-sm gap-0 py-0",
            styles[variant],
            className,
          )}
        >
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Lightbulb className={cn("h-4 w-4", iconStyles[variant])} />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs leading-relaxed opacity-90 pb-3">
            {children}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
