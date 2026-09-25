"use client";

import { useEffect, useRef } from "react";

interface JourneyRouteProps {
  progress: number; // 0–1
  className?: string;
}

/**
 * SVG route that draws as the user scrolls through the story.
 * Uses stroke-dashoffset to progressively reveal the path.
 */
export default function JourneyRoute({ progress, className = "" }: JourneyRouteProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!pathRef.current) return;
    const length = pathRef.current.getTotalLength();
    pathRef.current.style.setProperty("--path-length", String(length));
    pathRef.current.style.setProperty("--path-offset", String(length * (1 - progress)));
  }, [progress]);

  return (
    <svg
      className={className}
      viewBox="0 0 720 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Journey route from start to destination"
      style={{ width: "100%", maxWidth: 720, height: "auto" }}
    >
      <defs>
        <linearGradient id="sky" x1="360" y1="40" x2="360" y2="440" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EEF2FF" />
          <stop offset="1" stopColor="#F8FAFC" />
        </linearGradient>
      </defs>
      <rect x="20" y="20" width="680" height="440" rx="32" fill="url(#sky)" />
      {/* Background path */}
      <path
        d="M84 348c86-32 112-120 204-104 89 16 95 100 182 64 70-29 75-129 166-145"
        stroke="#C7D2FE"
        strokeWidth="20"
        strokeLinecap="round"
      />
      {/* Animated foreground path */}
      <path
        ref={pathRef}
        d="M84 348c86-32 112-120 204-104 89 16 95 100 182 64 70-29 75-129 166-145"
        stroke="#4338CA"
        strokeWidth="4"
        strokeLinecap="round"
        className="route-svg-path"
      />
      {/* Stop circles */}
      <g fill="#fff" stroke="#4338CA" strokeWidth="4">
        <circle cx="84" cy="348" r="18" opacity={progress > 0 ? 1 : 0.3} />
        <circle cx="288" cy="244" r="18" opacity={progress > 0.3 ? 1 : 0.3} />
        <circle cx="470" cy="308" r="18" opacity={progress > 0.6 ? 1 : 0.3} />
      </g>
      {/* Destination pin */}
      <path
        d="M636 132c-25 0-44 18-44 42 0 34 44 76 44 76s44-42 44-76c0-24-19-42-44-42Z"
        fill="#4338CA"
        opacity={progress > 0.85 ? 1 : 0.3}
      />
      <circle cx="636" cy="174" r="14" fill="#fff" opacity={progress > 0.85 ? 1 : 0.3} />
      {/* Labels */}
      <g fill="#0F172A" fontFamily="Inter,Arial,sans-serif" fontSize="15" fontWeight="600" textAnchor="middle">
        <text x="84" y="394">Tokyo</text>
        <text x="288" y="202">Hakone</text>
        <text x="470" y="352">Kyoto</text>
        <text x="636" y="286">Osaka</text>
      </g>
    </svg>
  );
}
