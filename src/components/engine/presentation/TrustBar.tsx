import { memo } from "react";
import { Shield, Award, Star, Home } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useT } from "@/contexts/LanguageContext";

export default memo(function TrustBar() {
  const t = useT();
  const TRUST_ITEMS: { icon: LucideIcon; label: string }[] = [
    { icon: Shield, label: t("Lifetime Warranty Protection", "Protección de Garantía de Por Vida") },
    { icon: Award, label: t("GAF Master Elite Certified", "Certificado GAF Master Elite") },
    { icon: Star, label: t("Top-Rated Installation Crews", "Equipos de Instalación Mejor Calificados") },
    { icon: Home, label: t("Locally Owned & Operated", "De Propiedad y Operación Local") },
  ];
  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TRUST_ITEMS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl bg-card border border-border px-5 py-4 hover:shadow-sm transition-shadow"
          >
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

