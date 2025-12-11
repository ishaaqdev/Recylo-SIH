import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Check, X, Phone, User, Hash, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchHouseholdByPhone, createCollectionLog } from "@/lib/driverActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Household {
  id: string;
  name: string;
  phone: string;
  address: string;
}

const DriverSearch = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [results, setResults] = useState<Household[]>([]);
  const [allHouseholds, setAllHouseholds] = useState<Household[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchAllHouseholds();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/driver/auth");
    }
  };

  const fetchAllHouseholds = async () => {
    const { data } = await supabase
      .from("households")
      .select("id, name, phone, address")
      .order("name")
      .limit(20);
    
    if (data) {
      setAllHouseholds(data);
    }
  };

  const handleSearch = async () => {
    if (phoneNumber.length < 4) {
      toast({
        title: "Enter at least 4 digits",
        variant: "destructive"
      });
      return;
    }

    setSearching(true);
    try {
      const data = await searchHouseholdByPhone(phoneNumber);
      setResults(data || []);
      if (!data || data.length === 0) {
        toast({
          title: "No households found",
          description: "Try a different number"
        });
      }
    } catch (error) {
      toast({
        title: "Search failed",
        variant: "destructive"
      });
    } finally {
      setSearching(false);
    }
  };

  const handleCollected = async () => {
    if (!selectedHousehold) return;
    
    try {
      await createCollectionLog(selectedHousehold.id);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedHousehold(null);
        setResults([]);
        setPhoneNumber("");
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log collection",
        variant: "destructive"
      });
    }
  };

  const handleNotCollected = () => {
    setShowReject(true);
  };

  // Display households to show (search results or all households if no search)
  const displayHouseholds = results.length > 0 ? results : (phoneNumber.length === 0 ? allHouseholds : []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Search Household</h1>
        <p className="text-gray-500">Find by mobile number or select from list</p>
      </div>

      {/* Search Input */}
      <div className="px-6 pt-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm text-gray-500 mb-2 block">Enter Mobile Number</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="9437xxxxxx"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                className="pl-12 h-14 text-lg rounded-xl border-gray-200"
                maxLength={10}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={searching}
              className="h-14 px-6 rounded-xl bg-sky-500 hover:bg-sky-600"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Households List */}
        {displayHouseholds.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-500 font-medium">
              {results.length > 0 
                ? `${results.length} household${results.length > 1 ? "s" : ""} found`
                : "All Registered Households"
              }
            </p>
            {displayHouseholds.map((household) => (
              <button
                key={household.id}
                onClick={() => setSelectedHousehold(household)}
                className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left hover:border-sky-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-lg">{household.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-600">{household.phone}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-500 text-sm truncate">{household.address}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Household Action Sheet */}
      {selectedHousehold && !showSuccess && !showReject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full rounded-t-[32px] p-6 animate-slide-up">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            
            <div className="bg-sky-50 rounded-2xl p-5 mb-6">
              <p className="text-sm text-gray-500 mb-1">Household</p>
              <p className="text-xl font-bold text-gray-900 mb-3">{selectedHousehold.name}</p>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <p className="text-lg font-semibold text-gray-800 mb-3">{selectedHousehold.phone}</p>
              <p className="text-sm text-gray-500 mb-1">Address</p>
              <p className="text-gray-700">{selectedHousehold.address}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleCollected}
                className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-semibold shadow-lg shadow-emerald-200"
              >
                <Check className="w-6 h-6 mr-3" />
                COLLECTED
              </Button>
              
              <Button
                onClick={handleNotCollected}
                variant="outline"
                className="w-full h-16 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 text-lg font-semibold"
              >
                <X className="w-6 h-6 mr-3" />
                NOT COLLECTED
              </Button>

              <Button
                onClick={() => setSelectedHousehold(null)}
                variant="ghost"
                className="w-full h-12 rounded-2xl text-gray-500"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 text-center animate-scale-in">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Collection Confirmed!</h2>
            <p className="text-gray-500">Waste collected successfully</p>
          </div>
        </div>
      )}

      {/* Reject Popup */}
      {showReject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 text-center animate-scale-in max-w-sm">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Waste is Mixed</h2>
            <p className="text-gray-500 mb-6">Please segregate properly before next collection.</p>
            <Button
              onClick={() => {
                setShowReject(false);
                setSelectedHousehold(null);
              }}
              className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white text-lg font-semibold"
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverSearch;
