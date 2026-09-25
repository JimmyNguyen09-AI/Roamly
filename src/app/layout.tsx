import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roamly — The Journey Takes Shape",
  description:
    "Plan your perfect Japan trip with Roamly. Scroll through an immersive travel story, build a seven-day itinerary, and share it with companions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
