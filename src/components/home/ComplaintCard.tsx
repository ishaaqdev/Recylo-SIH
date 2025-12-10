import { useState } from "react";
import { Trash2, Truck, CalendarX, HelpCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const complaintCategories = [
  { id: "bin_issue", label: "Bin Issue", icon: Trash2, color: "bg-orange-50 text-orange-600" },
  { id: "truck_issue", label: "Truck Issue", icon: Truck, color: "bg-blue-50 text-blue-600" },
  { id: "missed_pickup", label: "Missed Pickup", icon: CalendarX, color: "bg-red-50 text-red-600" },
  { id: "other", label: "Other", icon: HelpCircle, color: "bg-gray-50 text-gray-600" },
];

interface ComplaintCardProps {
  householdId: string;
}

export const ComplaintCard = ({ householdId }: ComplaintCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !description.trim()) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("complaints").insert({
        household_id: householdId,
        category: selectedCategory,
        description: description.trim(),
      });

      if (error) throw error;

      toast({
        title: "Complaint submitted!",
        description: "We'll resolve it as soon as possible.",
      });
      setIsModalOpen(false);
      setDescription("");
      setSelectedCategory(null);
    } catch (error) {
      toast({
        title: "Failed to submit complaint",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-card rounded-3xl p-5 premium-shadow animate-fade-up stagger-4">
        <h3 className="text-lg font-bold text-foreground mb-2">File a Complaint</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Having issues? Let us know and we'll help.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {complaintCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`flex items-center gap-3 p-4 rounded-2xl ${category.color} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
            >
              <category.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-up">
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">
                {complaintCategories.find((c) => c.id === selectedCategory)?.label}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <Textarea
              placeholder="Describe your issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] rounded-2xl border-border/50 focus:border-primary resize-none mb-4"
            />
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl text-base font-semibold"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Complaint
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
