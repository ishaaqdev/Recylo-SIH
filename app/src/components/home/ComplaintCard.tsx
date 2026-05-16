import { useState } from "react";
import { AlertCircle, ChevronRight, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const complaintCategories = [
  { id: "bin_issue", label: "Bin Issue" },
  { id: "truck_issue", label: "Truck Issue" },
  { id: "missed_pickup", label: "Missed Pickup" },
  { id: "other", label: "Other" },
];

interface ComplaintCardProps {
  householdId: string;
}

export const ComplaintCard = ({ householdId }: ComplaintCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        title: "Complaint submitted",
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
      <div className="bg-card rounded-3xl p-5 premium-shadow border border-border/30 animate-fade-up stagger-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">File a Complaint</h3>
              <p className="text-xs text-muted-foreground">Report any issues</p>
            </div>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            className="rounded-xl"
          >
            Report
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Report Issue</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Category Selection */}
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground mb-3">Select Issue Type</p>
              <div className="grid grid-cols-2 gap-2">
                {complaintCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
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
