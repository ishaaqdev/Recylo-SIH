import { useEffect, useState, useRef } from "react";

interface EcoFact {
  id: string;
  text: string;
  icon: string;
  category: string;
}

interface EcoFactsCarouselProps {
  facts: EcoFact[];
}

const pastelColors = [
  "bg-emerald-50",
  "bg-sky-50",
  "bg-amber-50",
  "bg-rose-50",
  "bg-violet-50",
];

export const EcoFactsCarousel = ({ facts }: EcoFactsCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (facts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % facts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [facts.length]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        left: currentIndex * (containerRef.current.offsetWidth * 0.85 + 12),
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  if (facts.length === 0) return null;

  return (
    <div className="animate-fade-up stagger-3">
      <h3 className="text-lg font-bold text-foreground mb-4">Eco Facts</h3>
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto hide-scrollbar pb-2"
      >
        {facts.map((fact, index) => (
          <div
            key={fact.id}
            className={`flex-shrink-0 w-[85%] ${
              pastelColors[index % pastelColors.length]
            } rounded-2xl p-5 soft-shadow`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{fact.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  {fact.text}
                </p>
                <span className="inline-block mt-2 text-xs font-medium text-muted-foreground bg-background/50 px-2 py-1 rounded-full">
                  {fact.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 mt-3">
        {facts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-primary w-6"
                : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
