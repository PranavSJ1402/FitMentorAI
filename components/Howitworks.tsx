import React, { useEffect, useRef, useState } from "react";
import {
  UserPlus,
  PhoneCall,
  Dumbbell,
  UserCircle,
  ClipboardCheck,
} from "lucide-react";

const HowItWorks = () => {
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const revealStep = (step: HTMLDivElement) => {
      step.classList.add("opacity-100", "translate-y-0");
    };


    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLDivElement;
          if (entry.isIntersecting) {
            revealStep(target);
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.1 }
    );

    stepsRef.current.forEach((step) => {
      if (step) observer.observe(step);
    });

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      title: "Sign Up",
      description: "Create your account and set your fitness goals.",
      icon: <UserPlus className="w-8 h-8 text-primary" />,
    },
    {
      title: "AI Call & Input Details",
      description:
        "Generate an AI call and enter your age, height, weight, and preferences.",
      icon: <PhoneCall className="w-8 h-8 text-primary" />,
    },
    {
      title: "Get Personalized Plan",
      description:
        "Receive a full weekly meal and workout plan—what to eat, what exercises to do, and how many reps and sets.",
      icon: <Dumbbell className="w-8 h-8 text-primary" />,
    },
    {
      title: "View Plan on Profile",
      description:
        "Once generated, your plan is shown on your personal profile page.",
      icon: <UserCircle className="w-8 h-8 text-primary" />,
    },
  ];

  return (
    <div className="py-16 bg-background dark:bg-background">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <h2
          className={`text-3xl font-bold text-primary text-center mb-14 flex items-center justify-center gap-2 cursor-pointer transition-transform duration-300 ${
            hovered ? "scale-105 text-primary/90" : ""
          }`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <ClipboardCheck
            className={`w-6 h-6 text-primary transition-transform duration-300 ${
              hovered ? "rotate-12" : ""
            }`}
          />
          How It Works
        </h2>
        <div className="space-y-10">
          {steps.map((step, index) => (
            <div
              key={index}
              ref={(el) => {
                stepsRef.current[index] = el;
              }}
              className="opacity-0 transform translate-y-10 transition duration-700 ease-in-out bg-card p-6 rounded-xl shadow-md flex items-start gap-4"
            >
              <div className="flex-shrink-0">{step.icon}</div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  Step {index + 1}: {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
