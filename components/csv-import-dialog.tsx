"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  applyCsvMapping,
  guessCsvMapping,
  type CsvGrid,
  type CsvMapping,
  type Lead,
} from "@/lib/leads";

const NONE = "__none__";

function ColumnSelect({
  label,
  headers,
  value,
  onChange,
  optional,
}: {
  label: string;
  headers: string[];
  value: number;
  onChange: (idx: number) => void;
  optional?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-sm">
        {label}
        {!optional && <span className="text-destructive"> *</span>}
      </span>
      <Select
        value={value >= 0 ? String(value) : NONE}
        onValueChange={(v) => onChange(v === NONE ? -1 : Number(v))}
      >
        <SelectTrigger size="sm" className="w-full sm:w-48">
          <SelectValue placeholder="Select column" />
        </SelectTrigger>
        <SelectContent>
          {optional && <SelectItem value={NONE}>None</SelectItem>}
          {headers.map((h, i) => (
            <SelectItem key={i} value={String(i)}>
              {h || `Column ${i + 1}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CsvImportDialog({
  grid,
  onCancel,
  onImport,
}: {
  grid: CsvGrid | null;
  onCancel: () => void;
  onImport: (leads: Pick<Lead, "name" | "email" | "phone" | "company">[]) => void;
}) {
  const [mapping, setMapping] = useState<CsvMapping>({ name: -1, phone: -1, email: -1, company: -1 });
  const [mappedGrid, setMappedGrid] = useState<CsvGrid | null>(null);

  // Reset the mapping guess whenever a new file is selected (React's render-time state-adjustment pattern).
  if (grid !== mappedGrid) {
    setMappedGrid(grid);
    if (grid) setMapping(guessCsvMapping(grid.headers));
  }

  if (!grid) return null;

  const ready = mapping.name >= 0 && mapping.phone >= 0;
  const matched = ready ? applyCsvMapping(grid, mapping).length : 0;
  const skipped = grid.rows.length - matched;

  return (
    <Dialog open={!!grid} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Map columns</DialogTitle>
          <DialogDescription>
            Choose which column holds each field. Unmapped columns are ignored.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <ColumnSelect
            label="Name"
            headers={grid.headers}
            value={mapping.name}
            onChange={(idx) => setMapping({ ...mapping, name: idx })}
          />
          <ColumnSelect
            label="Phone"
            headers={grid.headers}
            value={mapping.phone}
            onChange={(idx) => setMapping({ ...mapping, phone: idx })}
          />
          <ColumnSelect
            label="Email"
            headers={grid.headers}
            value={mapping.email}
            onChange={(idx) => setMapping({ ...mapping, email: idx })}
            optional
          />
          <ColumnSelect
            label="Company"
            headers={grid.headers}
            value={mapping.company}
            onChange={(idx) => setMapping({ ...mapping, company: idx })}
            optional
          />
          {ready && (
            <p className="text-xs text-muted-foreground">
              {matched} lead{matched === 1 ? "" : "s"} will be imported
              {skipped > 0 ? `, ${skipped} skipped (missing name or phone)` : ""}.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!ready} onClick={() => onImport(applyCsvMapping(grid, mapping))}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
