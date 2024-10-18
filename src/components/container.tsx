import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("container flex flex-col p-4 md:p-[34px]", className)}>
      {children}
    </div>
  );
}
