import { WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ConnectionErrorModalProps = {
  open: boolean;
  message?: string;
  onClose?: () => void;
};

export default function ConnectionErrorModal({
  open,
  message = "Sorry, internet connection error. Go back to DawnDesk dashboard.",
  onClose,
}: ConnectionErrorModalProps) {
  const navigate = useNavigate();

  if (!open) return null;

  const goToDashboard = () => {
    onClose?.();
    navigate("/dashboard");
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-neutral-950 p-6 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-200">
            <WifiOff className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-200/80">Connection error</p>
            <h2 className="mt-2 text-xl font-bold text-white">Internet connection lost</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-300">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={goToDashboard} className="dd-btn-primary">
            Go back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
