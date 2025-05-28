import React, { useState } from "react";
import { Target, Brain, Utensils, TrendingUp, Check, Star, ChevronDown, ChevronUp, Sparkles, Shield } from "lucide-react";

// Benefits/Features Section
const BenefitsSection = () => {
  const [hovered, setHovered] = useState(-1);

  const benefits = [
    {
      title: "Personalized Plans",
      description: "AI-crafted workout and nutrition plans tailored specifically to your body type, goals, and preferences.",
      icon: <Target className="w-8 h-8 text-primary" />,
    },
    {
      title: "AI-Powered Recommendations",
      description: "Smart algorithms analyze your progress and adapt your plan in real-time for maximum results.",
      icon: <Brain className="w-8 h-8 text-primary" />,
    },
    {
      title: "Complete Nutrition & Workout Integration",
      description: "Seamlessly combined meal planning and exercise routines that work together to achieve your goals.",
      icon: <Utensils className="w-8 h-8 text-primary" />,
    },
    {
      title: "Progress Tracking",
      description: "Advanced analytics and insights to monitor your journey and celebrate every milestone.",
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
    },
  ];

  return (
    <div className="py-16 bg-background dark:bg-background">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <h2 className="text-3xl font-bold text-primary text-center mb-14 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Why Choose Our AI Fitness Assistant
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`bg-card p-6 rounded-xl shadow-md transition-all duration-300 cursor-pointer transform ${
                hovered === index ? "scale-105 shadow-lg" : ""
              }`}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(-1)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{benefit.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BenefitsSection