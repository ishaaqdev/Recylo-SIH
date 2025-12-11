import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, Check, X, Truck, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Html5Qrcode } from "html5-qrcode";
import { 
  getHouseholdByQRCode, 
  createCollectionLog, 
  parseTaskQRCode, 
  getTaskDetails, 
  getHouseholdById, 
  confirmTaskCompletion,
  TaskVerificationData
} from "@/lib/driverActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Household {
  id: string;
  name: string;
  phone: string;
  address: string;
}

interface TaskVerification {
  taskData: TaskVerificationData;
  task: {
    id: string;
    title: string;
    description: string;
    points_reward: number;
    level_reward: number;
  };
  household: {
    id: string;
    name: string;
    phone: string;
  };
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
  
  // Task verification states
  const [taskVerification, setTaskVerification] = useState<TaskVerification | null>(null);
  const [showTaskSuccess, setShowTaskSuccess] = useState(false);
  const [confirmingTask, setConfirmingTask] = useState(false);

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
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
          disableFlip: false
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
      // Check if it's a task verification QR
      const taskData = parseTaskQRCode(code);
      
      if (taskData) {
        // It's a task verification QR
        const [task, household] = await Promise.all([
          getTaskDetails(taskData.taskId),
          getHouseholdById(taskData.householdId)
        ]);
        
        if (task && household) {
          setTaskVerification({
            taskData,
            task,
            household
          });
        } else {
          toast({
            title: "Invalid QR Code",
            description: "Task or household not found",
            variant: "destructive"
          });
        }
      } else {
        // It's a household collection QR
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
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process QR code",
        variant: "destructive"
      });
    }
  };

  const handleConfirmTask = async () => {
    if (!taskVerification) return;
    
    setConfirmingTask(true);
    try {
      await confirmTaskCompletion(
        taskVerification.task.id,
        taskVerification.household.id,
        taskVerification.task.points_reward,
        taskVerification.task.level_reward
      );
      
      setTaskVerification(null);
      setShowTaskSuccess(true);
      setTimeout(() => {
        setShowTaskSuccess(false);
      }, 2500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm task completion",
        variant: "destructive"
      });
    } finally {
      setConfirmingTask(false);
    }
  };

  const handleCollected = async (segregationStatus: "pass" | "mixed" = "pass") => {
    if (!foundHousehold) return;
    
    try {
      await createCollectionLog(foundHousehold.id, undefined, segregationStatus);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFoundHousehold(null);
      }, 2000);
      
      if (segregationStatus === "pass") {
        toast({
          title: "Points Awarded",
          description: "Household earned 10 points for proper segregation!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log collection",
        variant: "destructive"
      });
    }
  };

  const handleNotCollected = async () => {
    if (!foundHousehold) return;
    
    try {
      await createCollectionLog(foundHousehold.id, undefined, "mixed");
      setShowReject(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log collection",
        variant: "destructive"
      });
    }
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
                <QrCode className="w-20 h-20" />
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

          {/* QR Scanner View - Mobile optimized */}
          {scanning && (
            <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
              <Button
                onClick={stopScanner}
                className="absolute top-6 right-6 bg-white/20 backdrop-blur-sm rounded-xl z-10"
              >
                <X className="w-6 h-6" />
              </Button>
              <div className="w-[85vw] max-w-[320px] aspect-square relative">
                <div id="qr-reader" className="w-full h-full rounded-2xl overflow-hidden" />
                <div className="absolute inset-0 border-4 border-white/30 rounded-2xl pointer-events-none" />
              </div>
              <div className="mt-8 text-center text-white">
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
                onClick={() => handleCollected("pass")}
                className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-lg font-semibold shadow-lg shadow-emerald-200"
              >
                <Check className="w-6 h-6 mr-3" />
                COLLECTED (Proper)
              </Button>
              
              <Button
                onClick={() => handleCollected("mixed")}
                variant="outline"
                className="w-full h-16 rounded-2xl border-2 border-amber-200 text-amber-600 hover:bg-amber-50 text-lg font-semibold"
              >
                <Check className="w-6 h-6 mr-3" />
                COLLECTED (Mixed)
              </Button>
              
              <Button
                onClick={handleNotCollected}
                variant="outline"
                className="w-full h-14 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 text-base font-semibold"
              >
                <X className="w-5 h-5 mr-2" />
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

      {/* Task Verification Popup */}
      {taskVerification && !showTaskSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white w-full rounded-t-[32px] p-6 animate-slide-up">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Task Verification</p>
                <p className="font-bold text-gray-900">{taskVerification.task.title}</p>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-2xl p-5 mb-6">
              <p className="text-sm text-gray-500 mb-1">Household</p>
              <p className="text-lg font-bold text-gray-900 mb-3">{taskVerification.household.name}</p>
              <p className="text-sm text-gray-500 mb-1">Reward</p>
              <p className="text-lg font-semibold text-purple-600">
                +{taskVerification.task.points_reward} points
                {taskVerification.task.level_reward > 0 && ` • +${taskVerification.task.level_reward} level`}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleConfirmTask}
                disabled={confirmingTask}
                className="w-full h-16 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white text-lg font-semibold shadow-lg shadow-purple-200"
              >
                {confirmingTask ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Confirming...
                  </span>
                ) : (
                  <>
                    <Check className="w-6 h-6 mr-3" />
                    CONFIRM TASK COMPLETED
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => setTaskVerification(null)}
                variant="outline"
                className="w-full h-16 rounded-2xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-lg font-semibold"
              >
                <X className="w-6 h-6 mr-3" />
                CANCEL
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Task Success Popup */}
      {showTaskSuccess && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 text-center animate-scale-in">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Task Verified!</h2>
            <p className="text-gray-500">Reward sent to household</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverHome;
