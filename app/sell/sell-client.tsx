"use client";

import { MarketStand } from "@prisma/client";
import { useState } from "react";
import { MarketStandSelect } from "../../components/MarketStandSelect";
import { SellForm } from "../../components/form/Sellform";

export function SellPageClient({ marketStands }: { marketStands: MarketStand[] }) {
  const [selectedStandId, setSelectedStandId] = useState(marketStands[0]?.id);
  const selectedStand = marketStands.find(stand => stand.id === selectedStandId);

  return (
    <>
      <MarketStandSelect 
        stands={marketStands}
        selectedId={selectedStandId}
        onSelect={setSelectedStandId}
      />
      {selectedStand && <SellForm marketStand={selectedStand} />}
    </>
  );
}
