import { Button } from "@mednet/ui/button";
import { Dialog, DialogContent } from "@mednet/ui/dialog";
import { House } from "lucide-react";
import type { CSSProperties } from "react";

declare function cn(...inputs: unknown[]): string;
declare function clsx(...inputs: unknown[]): string;
declare function cva(base: string, config?: unknown): () => string;

export const used = [Button, Dialog, DialogContent, House];
export const active = Math.random() > 0.5;

// не цвета и не те места
export const n1 = <a href="#section">К разделу</a>;
export const n2 = <a href="#fff">Якорь, похожий на hex</a>;
export const n3 = <h2 id="section">Раздел</h2>;
export const n4 = <button aria-label="№1 #2">Кнопка</button>;
export const n5 = "Задача #123, цвет #fff в тексте";
export const n6 = <p title="rgb(0 0 0)">rgb(0 0 0) и #fff в тексте узла</p>;
export const n7 = (
  <svg viewBox="0 0 1 1" aria-hidden="true">
    <path fill="#d6867f" d="M0 0h1v1z" />
  </svg>
);
// классы без литеральных цветов
export const g1 = <div className="grid-cols-[1fr_2fr]" />;
export const g2 = <div className="bg-[var(--brand)]" />;
export const g3 = <div className="bg-primary/30 text-muted-foreground border-border" />;
export const g4 = <div className="w-[calc(100%-2rem)]" />;
export const g5 = <div className="bg-[color:var(--brand)] [--gap:1rem]" />;
export const g6 = <div className="data-[state=open]:bg-accent [&_svg]:size-4 bg-linear-to-r from-primary to-primary/0" />;
export const g7 = <div className={`p-2 ${active ? "bg-accent" : ""}`} />;
export const g8 = <div className={cn("p-4", active && "bg-primary text-primary-foreground")} />;
export const g9 = <div className="bg-[url(/hero.svg)] shadow-[0_0_0_1px_var(--border)]" />;
export const g10 = <div className="text-destructive bg-field hover:bg-primary-hover" />;
export const g11 = <div className="bg-[color-mix(in_oklab,var(--primary)_30%,transparent)]" />;
// style без литеральных цветов
export const st1 = <div style={{ width: "calc(100% - 1rem)" }} />;
export const st2 = <div style={{ color: "var(--primary)" }} />;
export const st3 = <div style={{ background: "color-mix(in oklab, var(--primary) 30%, transparent)" }} />;
export const st4 = <div style={{ gridTemplateColumns: "repeat(2, 1fr)", transform: "rotate(45deg)" }} />;
export const st5 = <div style={{ "--gap": "1rem", color: "currentColor" } as CSSProperties} />;
export const st6 = <div style={{ filter: "drop-shadow(0 0 2px var(--border))" }} />;
// cn / clsx / cva
export const k1 = cn("p-4", { "bg-primary": active }, ["text-sm", ["font-medium"]]);
export const k2 = clsx("rounded-lg", active && "ring-2 ring-ring");
export const k3 = cva("inline-flex items-center", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary-hover",
      outline: "border border-input bg-field",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});
