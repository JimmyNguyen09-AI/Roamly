"use client";

import { useCallback, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { itineraryData, tripSummary, type Activity, type DayPlan, type SavedPlace } from "@/data/itinerary";
import { formatYen } from "@/lib/format";

const CATEGORY_LABELS: Record<Activity["category"], string> = {
  activity: "Activity",
  food: "Food & drink",
  transport: "Transport",
  accommodation: "Stay",
};

const BUDGET_COLORS: Record<keyof DayPlan["budget"], string> = {
  accommodation: "#047857",
  transport: "#64748b",
  food: "#b45309",
  activities: "#4338ca",
};

type PlannerPageProps = { destination: string };

export default function PlannerPage({ destination }: PlannerPageProps) {
  const [days, setDays] = useState<DayPlan[]>(() => structuredClone(itineraryData));
  const [selectedDay, setSelectedDay] = useState(0);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceLocation, setNewPlaceLocation] = useState("");
  const [newPlaceCategory, setNewPlaceCategory] = useState<Activity["category"]>("activity");
  const [formError, setFormError] = useState("");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const currentDay = days[selectedDay];
  const totalBudget = Object.values(currentDay.budget).reduce((total, value) => total + value, 0);

  const updateSelectedDay = useCallback((updater: (day: DayPlan) => void) => {
    setDays((previous) => {
      const next = structuredClone(previous);
      updater(next[selectedDay]);
      return next;
    });
  }, [selectedDay]);

  function selectDay(index: number) {
    setSelectedDay(index);
    setShowAddPlace(false);
    setFormError("");
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = event.key === "ArrowRight" ? (index + 1) % days.length : (index - 1 + days.length) % days.length;
    selectDay(next);
    tabRefs.current[next]?.focus();
  }

  function moveActivity(index: number, direction: "earlier" | "later") {
    updateSelectedDay((day) => {
      const target = direction === "earlier" ? index - 1 : index + 1;
      if (target < 0 || target >= day.activities.length) return;
      [day.activities[index], day.activities[target]] = [day.activities[target], day.activities[index]];
    });
  }

  function schedulePlace(placeId: string) {
    updateSelectedDay((day) => {
      const placeIndex = day.savedPlaces.findIndex((place) => place.id === placeId);
      if (placeIndex < 0) return;
      const [place] = day.savedPlaces.splice(placeIndex, 1);
      day.activities.push({ id: place.id, name: place.name, time: "TBD", location: place.location, category: place.category, cost: place.estimatedCost });
    });
  }

  function addSavedPlace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newPlaceName.trim()) {
      setFormError("Enter a place name to save it.");
      return;
    }
    updateSelectedDay((day) => {
      day.savedPlaces.push({
        id: `saved-${Date.now()}`,
        name: newPlaceName.trim(),
        location: newPlaceLocation.trim() || destination,
        category: newPlaceCategory,
        estimatedCost: 0,
      });
    });
    setNewPlaceName("");
    setNewPlaceLocation("");
    setFormError("");
    setShowAddPlace(false);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand-group">
            <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">R</span><span>Roamly</span></Link>
            <span className="app-trip-name">{tripSummary.name}</span>
          </div>
          <Link href="/share" className="button button-secondary button-compact">Share trip</Link>
        </div>
      </header>

      <main className="app-main">
        <p className="app-kicker">Your {destination} itinerary</p>
        <h1 className="app-title">Seven days, ready to shape.</h1>
        <p className="app-subtitle">{tripSummary.dates} · {tripSummary.travellers} travellers · All amounts in Japanese yen</p>

        <div className="day-tabs" role="tablist" aria-label="Trip days">
          {days.map((day, index) => (
            <button
              key={day.day}
              ref={(element) => { tabRefs.current[index] = element; }}
              className="day-tab"
              role="tab"
              aria-selected={selectedDay === index}
              aria-controls={`day-panel-${index}`}
              id={`day-tab-${index}`}
              tabIndex={selectedDay === index ? 0 : -1}
              onClick={() => selectDay(index)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              <span>Day {day.day}</span><strong>{day.location.split(" /")[0]}</strong>
            </button>
          ))}
        </div>

        <section id={`day-panel-${selectedDay}`} role="tabpanel" aria-labelledby={`day-tab-${selectedDay}`}>
          <div className="section-bar">
            <div><h2>{currentDay.title}</h2><p>{currentDay.date} · {currentDay.location}</p></div>
            <strong>{formatYen(totalBudget)} estimated</strong>
          </div>

          <div className="app-grid">
            <section aria-labelledby="scheduled-heading">
              <h3 id="scheduled-heading" className="section-label">Scheduled · {currentDay.activities.length}</h3>
              {currentDay.activities.length ? (
                <div className="schedule-list">
                  {currentDay.activities.map((activity, index) => (
                    <article className="activity-card" key={activity.id}>
                      <time className="activity-time">{activity.time}</time>
                      <div className="activity-main">
                        <h3>{activity.name}</h3>
                        <p className="activity-meta"><span>{activity.location}</span><span>{CATEGORY_LABELS[activity.category]}{activity.cost ? ` · ${formatYen(activity.cost)}` : " · Free"}</span></p>
                        {activity.note ? <p className="activity-note">Note: {activity.note}</p> : null}
                        {activity.bookingRef ? <span className="booking-ref"><strong>Demo booking</strong><code>{activity.bookingRef}</code></span> : null}
                      </div>
                      <div className="move-controls" aria-label={`Reorder ${activity.name}`}>
                        <button className="icon-button" type="button" onClick={() => moveActivity(index, "earlier")} disabled={index === 0} aria-label={`Move ${activity.name} earlier`}>↑</button>
                        <button className="icon-button" type="button" onClick={() => moveActivity(index, "later")} disabled={index === currentDay.activities.length - 1} aria-label={`Move ${activity.name} later`}>↓</button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="surface empty-state"><strong>Nothing scheduled yet</strong><p>Choose a saved place, then use Schedule to add it here.</p></div>
              )}
            </section>

            <aside className="planner-aside" aria-label="Saved places and budget">
              <section>
                <div className="section-bar"><div><h3>Saved places</h3><p>{currentDay.savedPlaces.length} unscheduled</p></div></div>
                {currentDay.savedPlaces.length ? (
                  <div className="saved-list">
                    {currentDay.savedPlaces.map((place: SavedPlace) => (
                      <article className="saved-card" key={place.id}>
                        <div><h4>{place.name}</h4><p>{place.location} · {CATEGORY_LABELS[place.category]}{place.estimatedCost ? ` · about ${formatYen(place.estimatedCost)}` : ""}</p></div>
                        <button type="button" className="button button-primary small-button" onClick={() => schedulePlace(place.id)}>Schedule</button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="surface empty-state"><strong>No saved places</strong><p>Add an idea below or switch to another day.</p></div>
                )}

                {showAddPlace ? (
                  <form className="surface add-place" onSubmit={addSavedPlace} noValidate>
                    <div className="form-grid">
                      <div><label className="field-label" htmlFor="place-name">Place name</label><input className="field" id="place-name" value={newPlaceName} onChange={(event) => { setNewPlaceName(event.target.value); setFormError(""); }} aria-invalid={Boolean(formError)} aria-describedby={formError ? "place-error" : undefined} autoFocus /></div>
                      <div><label className="field-label" htmlFor="place-location">Location</label><input className="field" id="place-location" value={newPlaceLocation} onChange={(event) => setNewPlaceLocation(event.target.value)} placeholder="e.g. Harajuku, Tokyo" /></div>
                      <div><label className="field-label" htmlFor="place-category">Category</label><select className="field" id="place-category" value={newPlaceCategory} onChange={(event) => setNewPlaceCategory(event.target.value as Activity["category"])}>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                      {formError ? <p className="sf-error" id="place-error" role="alert">{formError}</p> : null}
                      <div className="form-actions"><button className="button button-primary small-button" type="submit">Save place</button><button className="button button-secondary small-button" type="button" onClick={() => { setShowAddPlace(false); setFormError(""); }}>Cancel</button></div>
                    </div>
                  </form>
                ) : <button type="button" className="button button-secondary" style={{ width: "100%", marginTop: 12 }} onClick={() => setShowAddPlace(true)}>+ Add a place</button>}
              </section>

              <section className="surface budget-card" aria-labelledby="budget-heading">
                <h3 id="budget-heading" className="section-label">Day budget</h3>
                {(Object.entries(currentDay.budget) as [keyof DayPlan["budget"], number][]).map(([category, amount]) => (
                  <div className="budget-row" key={category}>
                    <div className="budget-label"><span>{category}</span><strong>{formatYen(amount)}</strong></div>
                    <div className="budget-track"><div className="budget-fill" style={{ width: `${totalBudget ? (amount / totalBudget) * 100 : 0}%`, background: BUDGET_COLORS[category] }} /></div>
                  </div>
                ))}
                <div className="budget-total"><span>Total</span><span>{formatYen(totalBudget)}</span></div>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
