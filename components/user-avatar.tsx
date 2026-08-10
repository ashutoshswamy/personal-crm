import { cn } from "@/lib/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function UserAvatar({
  name,
  photoURL,
  className,
}: {
  name: string;
  photoURL?: string | null;
  className?: string;
}) {
  if (photoURL) {
    // eslint-disable-next-line @next/next/no-img-element -- small user-supplied data URL, not worth next/image's remote-pattern config
    return (
      <img
        src={photoURL}
        alt={name}
        className={cn("size-7 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex size-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground",
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
