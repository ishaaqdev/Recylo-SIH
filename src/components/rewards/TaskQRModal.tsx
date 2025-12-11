import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import { Check } from "lucide-react";

interface TaskQRModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskId: string;
  taskTitle: string;
  householdId: string;
}

const TaskQRModal = ({ open, onClose, onConfirm, taskId, taskTitle, householdId }: TaskQRModalProps) => {
  // Generate unique QR code data for task verification
  const qrData = JSON.stringify({
    type: "task_verification",
    taskId,
    householdId,
    timestamp: Date.now(),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Task Verification QR</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center py-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
            <QRCode value={qrData} size={180} />
          </div>
          <h3 className="font-semibold text-foreground mb-1">{taskTitle}</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Show this QR code to the truck driver to verify task completion
          </p>
          <div className="w-full space-y-2">
            <Button onClick={onConfirm} className="w-full rounded-xl">
              <Check className="w-4 h-4 mr-2" />
              Driver Confirmed
            </Button>
            <Button onClick={onClose} variant="outline" className="w-full rounded-xl">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskQRModal;
