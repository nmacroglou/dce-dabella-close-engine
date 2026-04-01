import { useEffect, useRef } from "react";
import type { EngineState, ComputedValues } from "@/hooks/useCloseEngine";
import dabellaLogo from "@/assets/dabella-logo.png";
import OptionCard from "./OptionCard";
import TrustBar from "./TrustBar";
import ScopeOfWork from "./ScopeOfWork";
import WelcomeClose from "./WelcomeClose";

interface Props {
  state: EngineState;
  computed: ComputedValues;
  options: { key: "A" | "B" | "C"; name: string; price: number; monthly: number }[];
  onReady: (refs: HTMLDivElement[]) => void;
}

export default function PdfAllSections({ state, computed, options, onReady }: Props) {
  const sec1 = useRef<HTMLDivElement>(null);
  const sec2 = useRef<HTMLDivElement>(null);
  const sec3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sec1.current && sec2.current && sec3.current) {
      onReady([sec1.current, sec2.current, sec3.current]);
    }
  }, []);

  const names = state.homeowner2
    ? `${state.homeowner1} & ${state.homeowner2}`
    : state.homeowner1;

  return (
    <div style={{ fontFamily: "Plus Jakarta Sans, Inter, sans-serif", color: "#1a1a2e" }}>
      {/* Section 1: Options */}
      <div ref={sec1} style={{ padding: "48px 40px", background: "#fff" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={dabellaLogo} alt="DaBella" style={{ height: 40, margin: "0 auto 16px" }} />
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            Your {state.product} Options
          </h1>
          <p style={{ fontSize: 14, color: "#666", maxWidth: 480, margin: "0 auto" }}>
            {names}, here's a side-by-side look at three tailored options for your home.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          {options.map((opt) => (
            <OptionCard
              key={opt.key}
              optionKey={opt.key}
              name={opt.name}
              price={opt.price}
              monthly={opt.monthly}
              roiPercent={state.roiPercent}
              computed={computed}
            />
          ))}
        </div>
        <div style={{ marginTop: 32 }}>
          <TrustBar />
        </div>
      </div>

      {/* Section 2: Scope of Work */}
      <div ref={sec2} style={{ padding: "48px 40px", background: "#fff" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src={dabellaLogo} alt="DaBella" style={{ height: 40, margin: "0 auto 16px" }} />
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>What to Expect</h1>
        </div>
        <ScopeOfWork />
      </div>

      {/* Section 3: Welcome */}
      <div ref={sec3} style={{ padding: "48px 40px", background: "#fff" }}>
        <WelcomeClose homeowner1={state.homeowner1} homeowner2={state.homeowner2} />
      </div>
    </div>
  );
}
