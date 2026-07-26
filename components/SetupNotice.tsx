import { Settings } from "lucide-react";

export default function SetupNotice({ message }: { message: string }) {
  return (
    <div className="card flex items-start gap-4 border-amber-500/30">
      <div className="rounded-lg bg-amber-500/15 p-2 text-amber-400">
        <Settings size={20} />
      </div>
      <div>
        <p className="font-medium text-white">Setup needed</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">{message}</p>
        <p className="mt-2 text-sm text-slate-500">
          See the <span className="font-mono text-slate-400">README.md</span> for the step-by-step
          Google Sheets and Instantly setup.
        </p>
      </div>
    </div>
  );
}
