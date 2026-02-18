import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronRight } from "lucide-react";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT = ["", "MON", "TUE", "WED", "THU", "FRI"];

interface MealCardProps {
  id: string;
  name: string;
  cuisine: string;
  dayOfWeek: number | null;
  cookTimeMinutes: number;
  prepTimeMinutes: number | null;
  description: string | null;
}

export function MealCard({
  id,
  name,
  cuisine,
  dayOfWeek,
  cookTimeMinutes,
  prepTimeMinutes,
  description,
}: MealCardProps) {
  const totalTime = cookTimeMinutes + (prepTimeMinutes ?? 0);

  return (
    <Link href={`/recipes/${id}`} className="group block">
      <div className="flex gap-3 rounded-xl border bg-card p-3.5 transition-all hover:bg-accent/40 hover:shadow-sm active:scale-[0.98]">
        {dayOfWeek && (
          <div className="flex w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 py-2">
            <span className="text-[10px] font-bold tracking-wider text-primary">
              {DAY_SHORT[dayOfWeek]}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {dayOfWeek && (
                <p className="text-xs text-muted-foreground">
                  {DAY_NAMES[dayOfWeek]}
                </p>
              )}
              <h3 className="font-semibold leading-snug">{name}</h3>
            </div>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </div>
          {description && (
            <p className="mt-0.5 text-sm leading-snug text-muted-foreground line-clamp-1">
              {description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="text-[11px] font-normal">
              {cuisine}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {totalTime} min
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
