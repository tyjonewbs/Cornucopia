import { redirect } from "next/navigation";

// Deprecated: Grid view has been consolidated into the main explore map page
export default function MarketStandsGridPage() {
  redirect("/market-stand");
}
