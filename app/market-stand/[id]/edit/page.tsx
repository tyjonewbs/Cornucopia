import { redirect } from "next/navigation";

// This is a catch-all page to handle incorrect edit URLs
export default function EditCatchAllPage() {
  return redirect("/");
}
