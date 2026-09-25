"use client";

interface StoryProgressProps {
  activeChapter: number;
  chapterLabels: string[];
}

/**
 * Fixed right-side progress dots linking to each story chapter.
 */
export default function StoryProgress({ activeChapter, chapterLabels }: StoryProgressProps) {
  return (
    <nav className="story-progress" aria-label="Story chapters">
      {chapterLabels.map((label, i) => (
        <a
          key={i}
          href={`#chapter-${i + 1}`}
          className={`story-progress-dot ${activeChapter === i ? "active" : ""}`}
          title={label}
          aria-label={`Go to ${label}`}
          aria-current={activeChapter === i ? "step" : undefined}
        />
      ))}
    </nav>
  );
}
