import { useState, useEffect, useRef } from "react";
import { QrCode, Check, X, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHouseholdByQRCode, createCollectionLog } from "@/lib/driverActions";
import { toast } from "@/hooks/use-toast";

interface Household {
  id: string;
  name: string;
  phone: string;
  address: string;
}

const DriverHome = () => {
  const [scanning, setScanning] = useState(false);
  const [foundHousehold, setFoundHousehold] = useState<Household | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (scanning) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [scanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        // Start scanning for QR
        scanForQR();
      }
    } catch (err) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to scan QR codes",
        variant: "destructive"
      });
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const scanForQR = () => {
    if (!scanning) return;
    
    const checkQR = setInterval(async () => {
      if (canvasRef.current && videoRef.current && videoRef.current.readyState === 4) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          // For demo, we'll use manual input since browser QR scanning needs additional library
        }
      }
    }, 500);

    return () => clearInterval(checkQR);
  };

  const handleManualQRInput = async () => {
    // For demo, prompt for QR code
    const code = prompt("Enter QR Code (e.g., RECYLO-...):");
    if (!code) return;
    
    try {
      const household = await getHouseholdByQRCode(code);
      if (household) {
        setFoundHousehold(household);
        setScanning(false);
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
            <h1 className="text-2xl font-bold text-gray-900">Welcome, Driver 👋</h1>
            <p className="text-gray-500">Recylo Collection</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pt-12">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          {!scanning && !foundHousehold && (
            <Button
              onClick={() => {
                setScanning(true);
                handleManualQRInput();
              }}
              className="w-full max-w-sm h-32 rounded-3xl bg-sky-500 hover:bg-sky-600 text-white shadow-xl shadow-sky-200 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex flex-col items-center gap-3">
                <QrCode className="w-12 h-12" />
                <span className="text-xl font-semibold">SCAN QR CODE</span>
              </div>
            </Button>
          )}

          {/* Camera View */}
          {scanning && (
            <div className="fixed inset-0 bg-black z-50">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-white rounded-3xl" />
              </div>
              <Button
                onClick={() => setScanning(false)}
                className="absolute top-12 right-6 bg-white/20 backdrop-blur-sm"
              >
                <X className="w-6 h-6" />
              </Button>
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