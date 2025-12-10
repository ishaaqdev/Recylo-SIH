import { useEffect, useState, useRef } from "react";
import { Leaf } from "lucide-react";

interface EcoFact {
  id: string;
  text: string;
  icon: string;
  category: string;
}

interface EcoFactsCarouselProps {
  facts: EcoFact[];
}

export const EcoFactsCarousel = ({ facts }: EcoFactsCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (facts.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % facts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [facts.length]);

  useEffect(() => {
    if (containerRef.current) {
      const scrollPosition = currentIndex * containerRef.current.offsetWidth;
      containerRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [currentIndex]);

  if (facts.length === 0) return null;

  return (
    <div className="bg-card rounded-3xl p-5 premium-shadow border border-border/30 animate-fade-up stagger-3">
      <div className="flex items-center gap-2 mb-4">
        <Leaf className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Eco Facts</h3>
      </div>
      
      <div
        ref={containerRef}
        className="overflow-hidden"
      >
        <div 
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {facts.map((fact) => (
            <div
              key={fact.id}
              className="w-full flex-shrink-0 px-1"
            >
              <p className="text-sm text-foreground leading-relaxed mb-2">
                {fact.text}
              </p>
              <span className="inline-block text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {fact.category}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {facts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === currentIndex
                ? "bg-primary w-6"
                : "bg-muted-foreground/30 w-1.5"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
