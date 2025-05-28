import React, { useState, useEffect, FC } from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const tips: string[] = [
  "Stay hydrated! Drink at least 8 glasses of water daily.",
  "Consistency beats intensity. Stick to your workout plan.",
  "Include protein in every meal to support muscle recovery.",
  "Get 7-8 hours of sleep for optimal fitness results.",
  "Warm up before exercising to reduce injury risk.",
  "Balance cardio with strength training.",
  "Track your progress weekly to stay motivated.",
];

const DailyTipCompact: FC = () => {
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % tips.length);
        setVisible(true);
      }, 300);
    }, 4000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="max-w-xl mx-auto px-4 py-6 bg-card/90 backdrop-blur-sm border border-border rounded-lg flex items-center gap-4"
    >
      <Lightbulb className="h-8 w-8 text-primary flex-shrink-0" />
      <p
        className={cn(
          "text-base font-medium text-foreground transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
      >
        {tips[tipIndex]}
      </p>
    </section>
  );
};

export default DailyTipCompact;
