import { redirect } from "next/navigation";

// Deprecated: Map view has been consolidated into the main explore map page
export default function MarketStandsMapPage() {
  redirect("/market-stand");
}
