interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (v: any) => void;
  type?: string;
  placeholder?: string;
}

export default function InputField({ label, value, onChange, type = "text", placeholder = "" }: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
        placeholder={placeholder}
        className="w-full touch-target rounded-xl border border-input bg-card px-4 py-3 text-base outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </div>
  );
}
