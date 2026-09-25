import type { Metadata } from "next";
import SharePage from "@/components/share/SharePage";

export const metadata: Metadata = {
  title: "Shared Trip — Roamly",
  description: "View a shared Japan itinerary. See daily plans, times, locations, and travel notes from your companion.",
};

export default function ShareRoute() {
  return <SharePage />;
}
