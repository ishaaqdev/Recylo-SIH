import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Check, X, Truck, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Html5Qrcode } from "html5-qrcode";
import { getHouseholdByQRCode, createCollectionLog } from "@/lib/driverActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Household {
  id: string;
  name: string;
  phone: string;
  address: string;
}

const DriverHome = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [foundHousehold, setFoundHousehold] = useState<Household | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [driverName, setDriverName] = useState("Driver");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    checkAuth();
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {}
      }
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/driver/auth");
      return;
    }
    
    const { data: driver } = await supabase
      .from("drivers")
      .select("name")
      .eq("user_id", session.user.id)
      .maybeSingle();
    
    if (driver) {
      setDriverName(driver.name);
    }
  };

  const startScanner = async () => {
    setScanning(true);
    setCameraError(null);
    
    // Small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      // First check if cameras are available
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        throw new Error("No cameras found on this device");
      }

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        async (decodedText) => {
          try {
            await html5QrCode.stop();
          } catch (e) {}
          scannerRef.current = null;
          setScanning(false);
          handleQRScanned(decodedText);
        },
        () => {} // Ignore scan failures
      );
    } catch (err: any) {
      console.error("Scanner error:", err);
      let errorMessage = "Unable to access camera";
      
      if (err.message?.includes("NotAllowedError") || err.message?.includes("Permission")) {
        errorMessage = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (err.message?.includes("NotFoundError") || err.message?.includes("No cameras")) {
        errorMessage = "No camera found on this device.";
      } else if (err.message?.includes("NotReadableError")) {
        errorMessage = "Camera is in use by another application.";
      }
      
      setCameraError(errorMessage);
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive"
      });
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      scannerRef.current = null;
    }
    setScanning(false);
    setCameraError(null);
  };

  const handleQRScanned = async (code: string) => {
    try {
      const household = await getHouseholdByQRCode(code);
      if (household) {
        setFoundHousehold(household);
      } else {
        toast({
          title: "Household not found",
          description: "No household matches this QR code",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch household data",
        variant: "destructive"
      });
    }
  };

  const handleCollected = async () => {
    if (!foundHousehold) return;
    
    try {
      await createCollectionLog(foundHousehold.id);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFoundHousehold(null);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center">
            <Truck className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {driverName}</h1>
            <p className="text-gray-500">Recylo Collection</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pt-12">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          {!scanning && !foundHousehold && (
            <div className="w-full max-w-sm space-y-4">
              <button
                onClick={startScanner}
                className="w-full aspect-square rounded-3xl bg-sky-500 hover:bg-sky-600 text-white shadow-xl shadow-sky-200 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-4"
              >
                <Camera className="w-20 h-20" />
                <span className="text-2xl font-bold">SCAN QR CODE</span>
              </button>
              
              {cameraError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                  <p className="text-red-600 text-sm">{cameraError}</p>
                  <p className="text-gray-500 text-xs mt-2">
                    Use the Search tab to find households by phone number instead.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* QR Scanner View */}
          {scanning && (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
              <div className="flex-1 relative">
                <div id="qr-reader" className="w-full h-full" />
              </div>
              <Button
                onClick={stopScanner}
                className="absolute top-12 right-6 bg-white/20 backdrop-blur-sm rounded-xl"
              >
                <X className="w-6 h-6" />
              </Button>
              <div className="absolute bottom-24 left-0 right-0 text-center text-white">
                <p className="text-lg font-medium">Point camera at QR code</p>
                <p className="text-sm text-white/70 mt-1">Make sure QR code is well lit</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Household Found Popup */}
      {foundHousehold && !showSuccess && !showReject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full rounded-t-[32px] p-6 animate-slide-up">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            
            <div className="bg-sky-50 rounded-2xl p-5 mb-6">
              <p className="text-sm text-gray-500 mb-1">Household</p>
              <p className="text-xl font-bold text-gray-900 mb-3">{foundHousehold.name}</p>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <p className="text-lg font-semibold text-gray-800">{foundHousehold.phone}</p>
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
                setFoundHousehold(null);
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

export default DriverHome;
