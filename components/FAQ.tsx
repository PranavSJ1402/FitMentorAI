import { ChevronDown, ChevronUp, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(-1);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [heights, setHeights] = useState<number[]>([]);

  const faqs = [
    {
      question: "How accurate are AI recommendations?",
      answer:
        "Our AI uses advanced machine learning algorithms trained on thousands of fitness and nutrition data points. The recommendations are highly accurate and continuously improve as you provide feedback and track your progress.",
    },
    {
      question: "What if I have dietary restrictions?",
      answer:
        "Our AI fully supports dietary restrictions including vegetarian, vegan, keto, gluten-free, and many others. Simply input your restrictions during setup, and all meal plans will be customized accordingly.",
    },
    {
      question: "Can beginners use this?",
      answer:
        "Absolutely! Our AI is designed for all fitness levels. It starts with your current fitness level and gradually progresses your workouts. Beginners receive detailed exercise instructions and form guidance.",
    },
    {
      question: "How long does plan generation take?",
      answer:
        "Plan generation typically takes 2-3 minutes. Our AI analyzes your profile, goals, and preferences to create a comprehensive weekly plan. The process is automated and happens in real-time.",
    },
    {
      question: "Can I modify my plan after it's generated?",
      answer:
        "Yes! You can request modifications anytime. The AI will adjust your plan based on your feedback, progress, or changing preferences while maintaining the effectiveness of your program.",
    },
    {
      question: "Is my personal data secure?",
      answer:
        "We take privacy seriously. All your data is encrypted and stored securely. We never share personal information with third parties and comply with all major data protection regulations.",
    },
  ];

  // Update heights of all FAQ content divs on mount or when openFAQ changes
  useEffect(() => {
    const newHeights = contentRefs.current.map((el) =>
      el ? el.scrollHeight : 0
    );
    setHeights(newHeights);
  }, [openFAQ, faqs.length]);

  return (
    <div className="py-16 bg-background dark:bg-background">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <h2 className="text-3xl font-bold text-primary text-center mb-14 flex items-center justify-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFAQ === index;
            return (
              <div
                key={index}
                className="bg-card rounded-xl shadow-md overflow-hidden transition-all duration-300"
              >
                <button
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenFAQ(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-content-${index}`}
                  id={`faq-header-${index}`}
                >
                  <h3 className="text-lg font-semibold text-foreground pr-4">
                    {faq.question}
                  </h3>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
                <div
                  id={`faq-content-${index}`}
                  role="region"
                  aria-labelledby={`faq-header-${index}`}
                  ref={(el) => {
                    contentRefs.current[index] = el;
                  }}
                  style={{
                    maxHeight: isOpen ? heights[index] + "px" : "0px",
                    opacity: isOpen ? 1 : 0,
                    transition: "max-height 0.4s ease, opacity 0.3s ease",
                    overflow: "hidden",
                    padding: isOpen ? "0 1.5rem 1.5rem" : "0 1.5rem 0",
                  }}
                >
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FAQSection;
