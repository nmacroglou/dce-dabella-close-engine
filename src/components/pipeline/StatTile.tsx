import { memo } from "react";

function StatTileBase({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: string; accent: string;
}) {
  return (
    <div className="card-elevated p-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <p className={`text-2xl font-display font-extrabold ${accent}`}>{value}</p>
    </div>
  );
}

export const StatTile = memo(StatTileBase);

