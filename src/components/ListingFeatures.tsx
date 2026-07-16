import type { LucideIcon } from "lucide-react";
import {
  Bath,
  BedDouble,
  Building2,
  Car,
  Home,
  LandPlot,
  Tag,
} from "lucide-react";

export type ListingFeature = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
};

function iconForLabel(label: string): LucideIcon {
  const key = label.trim().toLowerCase();
  if (key === "price" || key.includes("auction")) return Tag;
  if (key === "type") return Home;
  if (key.startsWith("bed")) return BedDouble;
  if (key.startsWith("bath")) return Bath;
  if (key.startsWith("park") || key.includes("garage")) return Car;
  if (key.startsWith("building") || key === "floor") return Building2;
  if (key.startsWith("land") || key === "section") return LandPlot;
  return Tag;
}

export function ListingFeatures({ features }: { features: ListingFeature[] }) {
  if (features.length === 0) return null;

  return (
    <dl data-reveal-stagger className="mt-5 space-y-1 text-sm">
      {features.map((feature) => {
        const Icon = feature.icon ?? iconForLabel(feature.label);
        return (
          <div
            key={`${feature.label}-${feature.value}`}
            className="flex items-center justify-between gap-3 border-b border-line py-2.5"
          >
            <dt className="flex min-w-0 items-center gap-2.5 text-ink-soft">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-ink">
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </span>
              <span>{feature.label}</span>
            </dt>
            <dd className="shrink-0 font-medium text-ink">{feature.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}
