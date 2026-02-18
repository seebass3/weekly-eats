import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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
    <Link href={`/recipes/${id}`}>
      <Card className="transition-colors hover:bg-accent/50 active:bg-accent">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">
                {dayOfWeek ? DAY_NAMES[dayOfWeek] : ""}
              </p>
              <h3 className="mt-0.5 font-semibold leading-tight">{name}</h3>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {cuisine}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {totalTime} min
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
