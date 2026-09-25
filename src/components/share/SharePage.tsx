"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { itineraryData, tripSummary, type DayPlan } from "@/data/itinerary";
import { formatYen } from "@/lib/format";

const CATEGORY_LABELS = {
  activity: "Activity",
  food: "Food & drink",
  transport: "Transport",
  accommodation: "Stay",
};

export default function SharePage() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [showDownloadNotice, setShowDownloadNotice] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const currentDay = itineraryData[selectedDay];
  const total = Object.values(currentDay.budget).reduce((sum, amount) => sum + amount, 0);

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = event.key === "ArrowRight" ? (index + 1) % itineraryData.length : (index - 1 + itineraryData.length) % itineraryData.length;
    setSelectedDay(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="share-shell">
      <header className="share-hero">
        <div className="share-hero-inner">
          <div className="share-topline">
            <Link className="brand brand-light" href="/"><span className="brand-mark" aria-hidden="true">R</span><span>Roamly</span></Link>
            <span className="share-badge">Read-only trip</span>
          </div>
          <h1>{tripSummary.name}</h1>
          <p>{tripSummary.dates} · {tripSummary.travellers} travellers · Shared by Mina</p>
        </div>
      </header>

      <main className="share-main">
        <div className="day-tabs" role="tablist" aria-label="Trip days">
          {itineraryData.map((day, index) => (
            <button
              key={day.day}
              ref={(element) => { tabRefs.current[index] = element; }}
              className="day-tab"
              role="tab"
              aria-selected={selectedDay === index}
              aria-controls={`shared-day-${index}`}
              id={`shared-tab-${index}`}
              tabIndex={selectedDay === index ? 0 : -1}
              onClick={() => setSelectedDay(index)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              <span>Day {day.day}</span><strong>{day.location.split(" /")[0]}</strong>
            </button>
          ))}
        </div>

        <section id={`shared-day-${selectedDay}`} role="tabpanel" aria-labelledby={`shared-tab-${selectedDay}`}>
          <div className="surface share-day-head">
            <div><h2>{currentDay.title}</h2><p>{currentDay.location}</p></div><time className="share-date">{currentDay.date}</time>
          </div>

          <ol className="timeline" aria-label={`Day ${currentDay.day} plan`}>
            {currentDay.activities.map((activity) => (
              <li className="timeline-item" key={activity.id}>
                <time className="timeline-time">{activity.time}</time><span className="timeline-dot" aria-hidden="true" />
                <div className="timeline-content">
                  <h3>{activity.name}</h3>
                  <p>{activity.location} · {CATEGORY_LABELS[activity.category]}{activity.cost ? ` · ${formatYen(activity.cost)}` : " · Free"}</p>
                  {activity.note ? <p className="note-box"><strong>Important note:</strong> {activity.note}</p> : null}
                  {activity.bookingRef ? <span className="booking-ref"><strong>Demo booking reference</strong><code>{activity.bookingRef}</code></span> : null}
                </div>
              </li>
            ))}
          </ol>

          <div className="share-actions">
            <button className="button button-primary" type="button" onClick={() => setShowDownloadNotice((visible) => !visible)} aria-expanded={showDownloadNotice} aria-controls="download-notice">Mock download for offline</button>
            {showDownloadNotice ? <div id="download-notice" className="demo-notice" role="status"><strong>Demo action only</strong>A real Roamly trip would be saved as a PDF or synced for offline use. No file has been downloaded.</div> : null}
            <Link href="/planner?destination=Japan" className="button button-secondary">Open editable planner</Link>
          </div>

          <section className="surface share-budget" aria-labelledby="share-budget-heading">
            <h2 id="share-budget-heading">Day {currentDay.day} budget</h2>
            <div className="share-budget-grid">
              {(Object.entries(currentDay.budget) as [keyof DayPlan["budget"], number][]).map(([category, amount]) => <div key={category}><span>{category}</span><strong>{formatYen(amount)}</strong></div>)}
            </div>
            <div className="budget-total"><span>Total</span><span>{formatYen(total)}</span></div>
          </section>
        </section>

        <footer className="share-footer"><p>All booking references and download actions on this page are clearly labelled demonstrations.</p></footer>
      </main>
    </div>
  );
}
