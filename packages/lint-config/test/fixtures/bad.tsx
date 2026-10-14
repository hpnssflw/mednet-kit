import { Button } from "antd"; // @bad
import "antd/dist/reset.css"; // @bad
import MuiButton from "@mui/material/Button"; // @bad
import { createTheme } from "@mui/material"; // @bad
import type { Theme } from "@mui/material/styles"; // @bad
import { MantineProvider } from "@mantine/core"; // @bad
import { ChakraProvider } from "@chakra-ui/react"; // @bad
import "bootstrap/dist/css/bootstrap.min.css"; // @bad
import "bootstrap"; // @bad
import { Modal } from "react-bootstrap"; // @bad
import RBModal from "react-bootstrap/Modal"; // @bad
import * as RadixDialogPrimitive from "@radix-ui/react-dialog"; // @bad
import { Dialog as RadixDialog } from "radix-ui"; // @bad
import { Dialog as BaseDialog } from "@base-ui/react/dialog"; // @bad
import { Button as BaseButton } from "@base-ui/react"; // @bad
import { useRender } from "@base-ui/react/use-render"; // @bad
import { FaHome } from "react-icons/fa"; // @bad
import { HomeIcon } from "@heroicons/react/24/solid"; // @bad
import { IconHome } from "@tabler/icons-react"; // @bad
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // @bad
import { House } from "@phosphor-icons/react"; // @bad
import { HugeiconsIcon } from "@hugeicons/react"; // @bad
export { Slot } from "@radix-ui/react-slot"; // @bad
import type { CSSProperties } from "react";

declare function cn(...inputs: unknown[]): string;
declare function clsx(...inputs: unknown[]): string;
declare function cx(...inputs: unknown[]): string;
declare function cva(base: string, config?: unknown): () => string;

export const used = [Button, MuiButton, createTheme, MantineProvider, ChakraProvider, Modal, RBModal];
export const used2 = [RadixDialogPrimitive, RadixDialog, BaseDialog, BaseButton, useRender];
export const used3 = [FaHome, HomeIcon, IconHome, FontAwesomeIcon, House, HugeiconsIcon];
export type UsedTheme = Theme;

export const active = Math.random() > 0.5;
export const hex = "abc";
export const hue = 20;

// className: строка
export const c1 = <div className="bg-[#fff] p-4" />; // @bad
export const c2 = <div className="text-[rgb(1_2_3)]" />; // @bad
export const c3 = <div className="border-[oklch(0.6_0.1_20)]" />; // @bad
export const c4 = <svg className="fill-[#b55c57]" />; // @bad
export const c5 = <div className="[color:#333]" />; // @bad
export const c6 = <div className="bg-[#ffffff80]/50" />; // @bad
export const c7 = <div className="bg-[#fffa]" />; // @bad
export const c8 = <div className="text-[hsl(0_0%_0%)]" />; // @bad
export const c9 = <div className="bg-[rgba(0,0,0,.5)]" />; // @bad
export const c10 = <div className="bg-[hsla(0,0%,0%,.5)]" />; // @bad
export const c11 = <div className="bg-[hwb(0_0%_0%)]" />; // @bad
export const c12 = <div className="bg-[lab(50%_40_59)]" />; // @bad
export const c13 = <div className="bg-[lch(50%_70_40)]" />; // @bad
export const c14 = <div className="bg-[oklab(0.6_0.1_0.1)]" />; // @bad
export const c15 = <div className="bg-[color(display-p3_1_0_0)]" />; // @bad
export const c16 = <div className="shadow-[0_0_0_1px_#fff]" />; // @bad
export const c17 = <div className="bg-[linear-gradient(#fff_0%,transparent_100%)]" />; // @bad
export const c18 = <div className="[--brand:#b55c57]" />; // @bad
export const c19 = <div className="BG-[#FFF]" />; // @bad
export const c20 = <div className="text-[color:oklch(0.5_0.1_20)]" />; // @bad
// className: выражение, тернарник, шаблонная строка
export const e1 = <div className={"bg-[#fff]"} />; // @bad
export const e2 = <div className={active ? "text-[#000]" : "text-foreground"} />; // @bad
export const e3 = <div className={`p-2 bg-[#fafafa] ${active ? "ring-2" : ""}`} />; // @bad
export const e4 = <div className={`${hex} text-[rgb(0_0_0)]`} />; // @bad
export const e5 = <div className={cn("p-2", "bg-[#fff]")} />; // @bad
export const e6 = <div className={cn("p-2", active && `ring-[oklch(0.7_0.1_20)]`)} />; // @bad
// другие пропсы классов
export const p1 = <div classNames={{ root: "bg-[#fff]" }} />; // @bad
export const p2 = <div contentClassName="text-[#000]" />; // @bad
// style
export const s1 = <div style={{ color: "#fff" }} />; // @bad
export const s2 = <div style={{ backgroundColor: "rgb(0 0 0)" }} />; // @bad
export const s3 = <div style={{ borderColor: `oklch(0.5 0.1 ${hue})` }} />; // @bad
export const s4 = <div style={{ "--brand": "#b55c57" } as CSSProperties} />; // @bad
export const s5 = <div style={{ background: "linear-gradient(#fff, transparent)" }} />; // @bad
export const s6 = <div style={{ boxShadow: "0 0 0 1px hsla(0, 0%, 0%, .1)" }} />; // @bad
export const s7 = <div style={{ color: "rgba(0,0,0,.5)" }} />; // @bad
export const s8 = <div style={{ color: active ? "#000" : "var(--foreground)" }} />; // @bad
export const s9 = <div style={{ color: "color(srgb 1 0 0)" }} />; // @bad
export const s10 = <div style={{ outlineColor: "hwb(0 0% 0%)" }} />; // @bad
// cn / clsx / cx / cva / twMerge
export const k1 = cn("p-4", "bg-[#fff]"); // @bad
export const k2 = cn("p-4", active && "text-[#000]"); // @bad
export const k3 = cn({ "bg-[oklch(0.9_0.02_20)]": active }); // @bad
export const k4 = clsx(["p-2", ["border-[#ccc]"]]); // @bad
export const k5 = cx(`bg-[${hex}] text-[#111]`); // @bad
export const k6 = cva("inline-flex bg-[#fff]"); // @bad
export const k7 = cva("inline-flex", {
  variants: {
    tone: {
      brand: "bg-[#b55c57] text-white", // @bad
      soft: "bg-[color:rgb(181_92_87/0.1)]", // @bad
      plain: "bg-background",
    },
  },
  compoundVariants: [{ tone: "brand", className: "ring-[#000]" }], // @bad
});
declare function twMerge(...inputs: string[]): string;
export const k8 = twMerge("p-2", "text-[lch(50%_70_40)]"); // @bad
