import { FileText, Shield, Folder, CircleCheck, ShieldAlert, Clock, Lock, CheckCircle2 } from "lucide-react";

const icons = {
  file: FileText,
  shield: Shield,
  folder: Folder,
  check: CircleCheck,
  checkCircle: CheckCircle2,
  alert: ShieldAlert,
  clock: Clock,
  lock: Lock,
};

export default function StatCard({ title, value, meta, tone, icon }) {
  const Icon = icons[icon] || Shield;

  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={20} />
      </div>

      <div className="stat-content">
        <span>{title}</span>
        <strong>{value}</strong>
        {meta && <small>{meta}</small>}
      </div>
    </div>
  );
}