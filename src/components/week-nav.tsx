"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekNavProps {
  weekOf: string;
}

function formatWeekLabel(weekOf: string): string {
  const date = new Date(weekOf + "T00:00:00");
  const friday = new Date(date);
  friday.setDate(date.getDate() + 4);

  const monthFormat = new Intl.DateTimeFormat("en-US", { month: "short" });
  const dayFormat = new Intl.DateTimeFormat("en-US", { day: "numeric" });

  const startMonth = monthFormat.format(date);
  const endMonth = monthFormat.format(friday);
  const startDay = dayFormat.format(date);
  const endDay = dayFormat.format(friday);

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

function shiftWeek(weekOf: string, days: number): string {
  const date = new Date(weekOf + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function WeekNav({ weekOf }: WeekNavProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/meals?week=${shiftWeek(weekOf, -7)}`)}
        aria-label="Previous week"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <span className="text-sm font-medium">{formatWeekLabel(weekOf)}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/meals?week=${shiftWeek(weekOf, 7)}`)}
        aria-label="Next week"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
