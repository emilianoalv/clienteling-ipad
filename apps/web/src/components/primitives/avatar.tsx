import { cn } from "@/lib/cn";

export type AvatarTone = "default" | "lancome" | "ysl";

export interface AvatarProps {
  initials: string;
  size?: number;
  tone?: AvatarTone;
  image?: string;
  className?: string;
}

const TONE: Record<AvatarTone, string> = {
  default: "bg-bone-2 text-ink border-line",
  lancome: "bg-lancome-rose text-lancome-ink border-transparent",
  ysl: "bg-ysl-ink text-ysl-gold border-transparent",
};

export function Avatar({ initials, size = 40, tone = "default", image, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-semibold tracking-[0.02em] overflow-hidden shrink-0",
        TONE[tone],
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden={image ? "true" : undefined}
    >
      {image ? (
        <img src={image} alt="" className="w-full h-full object-cover" />
      ) : (
        initials.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}
