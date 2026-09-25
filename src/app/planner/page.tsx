import type { Metadata } from "next";
import PlannerPage from "@/components/planner/PlannerPage";

export const metadata: Metadata = {
  title: "Trip Planner — Roamly",
  description: "Plan your seven-day Japan itinerary. Schedule activities, manage budgets, and organize your trip with Roamly.",
};

export default async function PlannerRoute({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const { destination } = await searchParams;
  return <PlannerPage destination={destination ?? "Japan"} />;
}
