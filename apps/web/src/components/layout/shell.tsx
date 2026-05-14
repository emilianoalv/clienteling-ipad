import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ShellRootProps {
  children: ReactNode;
  className?: string;
}

function ShellRoot({ children, className }: ShellRootProps) {
  return (
    <div
      className={cn(
        "relative w-screen h-screen overflow-hidden bg-paper text-ink flex flex-col",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ShellContentProps {
  children: ReactNode;
  className?: string;
}

function ShellContent({ children, className }: ShellContentProps) {
  return (
    <main
      className={cn(
        "overflow-y-auto px-10 py-8 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-0",
        className,
      )}
    >
      {children}
    </main>
  );
}

interface ShellBodyProps {
  children: ReactNode;
}

function ShellBody({ children }: ShellBodyProps) {
  return (
    <div className="flex-1 grid grid-cols-[112px_minmax(0,1fr)] overflow-hidden">{children}</div>
  );
}

export const Shell = Object.assign(ShellRoot, {
  Body: ShellBody,
  Content: ShellContent,
});
