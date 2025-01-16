import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { MarketStand } from "@prisma/client";

interface MarketStandSelectProps {
  stands: MarketStand[];
  selectedId: string;
  onSelect: (standId: string) => void;
}

export function MarketStandSelect({ stands, selectedId, onSelect }: MarketStandSelectProps) {
  return (
    <div className="w-full space-y-2">
      <label className="text-sm font-medium">Select Market Stand</label>
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select a market stand" />
        </SelectTrigger>
        <SelectContent>
          {stands.map((stand) => (
            <SelectItem key={stand.id} value={stand.id}>
              {stand.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
