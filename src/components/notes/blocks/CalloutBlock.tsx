import type { ReactNode } from "react";
import {
  Info,
  Lightbulb,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";

type CalloutType = "note" | "tip" | "important" | "warning" | "caution";

interface CalloutBlockProps {
  type: CalloutType;
  title?: string;
  children: ReactNode;
}

const calloutConfig: Record<
  CalloutType,
  {
    icon: React.ElementType;
    borderColor: string;
    bgColor: string;
    iconColor: string;
    titleColor: string;
    defaultTitle: string;
  }
> = {
  note: {
    icon: Info,
    borderColor: "border-l-blue-400",
    bgColor: "bg-blue-400/5",
    iconColor: "text-blue-400",
    titleColor: "text-blue-400",
    defaultTitle: "Note",
  },
  tip: {
    icon: Lightbulb,
    borderColor: "border-l-green-400",
    bgColor: "bg-green-400/5",
    iconColor: "text-green-400",
    titleColor: "text-green-400",
    defaultTitle: "Tip",
  },
  important: {
    icon: AlertCircle,
    borderColor: "border-l-purple-400",
    bgColor: "bg-purple-400/5",
    iconColor: "text-purple-400",
    titleColor: "text-purple-400",
    defaultTitle: "Important",
  },
  warning: {
    icon: AlertTriangle,
    borderColor: "border-l-yellow-400",
    bgColor: "bg-yellow-400/5",
    iconColor: "text-yellow-400",
    titleColor: "text-yellow-400",
    defaultTitle: "Warning",
  },
  caution: {
    icon: ShieldAlert,
    borderColor: "border-l-red-400",
    bgColor: "bg-red-400/5",
    iconColor: "text-red-400",
    titleColor: "text-red-400",
    defaultTitle: "Caution",
  },
};

export default function CalloutBlock({ type, title, children }: CalloutBlockProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;

  return (
    <div
      className={`my-3 rounded-xl border-l-4 ${config.borderColor} ${config.bgColor} px-4 py-3`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 shrink-0 ${config.iconColor}`} />
        <span className={`text-sm font-bold ${config.titleColor}`}>
          {displayTitle}
        </span>
      </div>
      <div className="mt-2 text-sm leading-relaxed text-white/70">
        {children}
      </div>
    </div>
  );
}
