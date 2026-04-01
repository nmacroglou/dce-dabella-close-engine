interface InputFieldProps {
  label: string;
  description?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: "text" | "number";
  placeholder?: string;
}

export default function InputField({ label, description, value, onChange, type = "text", placeholder }: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
        {label}
      </label>
      {description && (
        <p className="text-[11px] text-muted-foreground leading-relaxed -mt-0.5">{description}</p>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
        placeholder={placeholder}
        className="w-full touch-target rounded-xl border border-input bg-card px-4 py-3.5 text-base outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </div>
  );
}
