"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes SSR/client mount guard
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex size-7 items-center justify-center rounded-2xl bg-input/50 text-muted-foreground">
        <Monitor className="size-4" />
      </div>
    );
  }

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];
  const Icon = current.icon;

  return (
    <Select value={theme} onValueChange={(v) => v && setTheme(v)}>
      <SelectTrigger size="sm" aria-label="Theme" className="w-auto px-2">
        <Icon className="size-4" />
        <SelectValue className="hidden" />
      </SelectTrigger>
      <SelectContent align="end">
        {OPTIONS.map(({ value, label, icon: OptionIcon }) => (
          <SelectItem key={value} value={value}>
            <OptionIcon className="size-4" />
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
