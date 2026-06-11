import { useEffect, useState } from "react";
import { Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUpdateDeal } from "@/hooks/useDeals";
import type { Deal } from "@/types/deal";

interface Props {
  deal: Pick<Deal, "id" | "homeowner_email" | "homeowner_phone">;
  size?: "sm" | "md";
}

export default function DealContactEditor({ deal, size = "md" }: Props) {
  const update = useUpdateDeal();
  const [email, setEmail] = useState(deal.homeowner_email ?? "");
  const [phone, setPhone] = useState(deal.homeowner_phone ?? "");
  const compact = size === "sm";

  useEffect(() => { setEmail(deal.homeowner_email ?? ""); }, [deal.homeowner_email]);
  useEffect(() => { setPhone(deal.homeowner_phone ?? ""); }, [deal.homeowner_phone]);

  const commitEmail = () => {
    const v = email.trim() || null;
    if (v === (deal.homeowner_email ?? null)) return;
    update.mutate({ id: deal.id, updates: { homeowner_email: v } });
  };
  const commitPhone = () => {
    const v = phone.trim() || null;
    if (v === (deal.homeowner_phone ?? null)) return;
    update.mutate({ id: deal.id, updates: { homeowner_phone: v } });
  };

  const h = compact ? "h-7 text-[11px]" : "h-8 text-xs";

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1.5`}>
      <div className="relative">
        <Mail className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={commitEmail}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          placeholder="email@home.com"
          className={`${h} pl-7`}
        />
      </div>
      <div className="relative">
        <Phone className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={commitPhone}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          placeholder="(555) 555-5555"
          className={`${h} pl-7`}
        />
      </div>
    </div>
  );
}
