"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import JourneyRoute from "@/components/story/JourneyRoute";
import ScrollReveal from "@/components/ui/ScrollReveal";
import StoryProgress from "@/components/ui/StoryProgress";
import WordReveal from "@/components/ui/WordReveal";
import {
  useChapterProgress,
  useDataSaver,
  useReducedMotion,
  useScrollProgress,
  useWebGLAvailable,
} from "@/hooks/useStoryScroll";

const StoryCanvas = dynamic(() => import("@/three/StoryCanvas"), {
  ssr: false,
  loading: () => null,
});

const CHAPTER_LABELS = [
  "A place calls",
  "Find the feeling",
  "Connect the days",
  "Make room for moments",
  "Plans become memories",
  "One plan, shared",
  "Go",
];

const DISCOVERY_CARDS = [
  { number: "01", title: "Slow mornings", text: "Temple paths, garden light, and nowhere else to be." },
  { number: "02", title: "Electric nights", text: "Tiny bars, late trains, and streets lit like cinema." },
  { number: "03", title: "Mountain air", text: "One quiet rail line between the city and the cedars." },
];

const PACKED_MOMENTS = [
  { time: "06:10", title: "Fushimi Inari", meta: "Sunrise walk · Free" },
  { time: "11:30", title: "Nishiki Market", meta: "Lunch trail · ¥2,500" },
  { time: "16:00", title: "Garden check-in", meta: "Hakone ryokan · Confirmed" },
];

function canRunStoryScene() {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const smallScreen = window.matchMedia("(max-width: 719px)").matches;
  const constrainedCpu = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 2;
  const constrainedMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2;
  return !smallScreen && !constrainedCpu && !constrainedMemory && !nav.connection?.saveData;
}

export default function StoryHome() {
  const scrollProgress = useScrollProgress();
  const { activeChapter, chapterProgress, setChapterRef } = useChapterProgress(7);
  const reducedMotion = useReducedMotion();
  const dataSaver = useDataSaver();
  const webglAvailable = useWebGLAvailable();
  const [heroVisible, setHeroVisible] = useState(false);
  const [enhancedGraphics, setEnhancedGraphics] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHeroVisible(true);
      setEnhancedGraphics(canRunStoryScene());
    }, 120);
    return () => window.clearTimeout(timer);
  }, []);

  const showCanvas = useMemo(
    () => enhancedGraphics && webglAvailable && !reducedMotion && !dataSaver,
    [enhancedGraphics, webglAvailable, reducedMotion, dataSaver],
  );

  const storyStyle = { "--story-progress": scrollProgress } as CSSProperties;
  const chapterStyle = (index: number) => ({
    "--chapter-progress": activeChapter === index ? chapterProgress : activeChapter > index ? 1 : 0,
  } as CSSProperties);
  const routeProgress = activeChapter > 2
    ? 1
    : activeChapter === 2
      ? Math.min(chapterProgress / 0.78, 1)
      : 0;

  return (
    <main
      className={`story ${showCanvas ? "story-webgl" : "story-fallback"}`}
      data-active-chapter={activeChapter + 1}
      style={storyStyle}
    >
      <header className="story-header">
        <a className="brand brand-light" href="#chapter-1" aria-label="Roamly home">
          <span className="brand-mark" aria-hidden="true">R</span><span>Roamly</span>
        </a>
        <nav aria-label="Primary navigation" className="story-nav">
          <a href="#chapter-3">The route</a>
          <Link href="/share">Companion view</Link>
          <Link className="button button-light button-compact" href="/planner?destination=Japan">Plan this trip</Link>
        </nav>
      </header>

      <StoryProgress activeChapter={activeChapter} chapterLabels={CHAPTER_LABELS} />
      <div className="story-thread" aria-hidden="true"><span /></div>
      {showCanvas ? (
        <StoryCanvas scrollProgress={scrollProgress} activeChapter={activeChapter} chapterProgress={chapterProgress} />
      ) : null}

      <section id="chapter-1" ref={setChapterRef(0)} style={chapterStyle(0)} className="story-chapter hero-chapter chapter-dark">
        <div className="chapter-media depth-background">
          <Image src="/media/01-kyoto-dawn.webp" alt="Traveller overlooking Kyoto at dawn" fill priority sizes="100vw" />
        </div>
        <div className="chapter-wash hero-wash" />
        <div className="hero-orbit" aria-hidden="true"><i /><i /><span>somewhere / soon</span></div>
        <div className="chapter-inner hero-inner depth-foreground">
          <p className="eyebrow eyebrow-light">Japan · Seven days · One shared plan</p>
          <WordReveal text="A journey begins before the booking" isVisible={heroVisible} className="hero-title" staggerMs={45} />
          <ScrollReveal delay={280}>
            <p className="hero-copy">First comes the feeling. A lantern-lit lane, a train through the mist, a table worth crossing a city for.</p>
          </ScrollReveal>
          <ScrollReveal delay={420}>
            <div className="hero-actions">
              <Link href="/planner?destination=Japan" className="button button-coral">Start planning</Link>
              <a href="#chapter-2" className="text-link text-link-light">Follow the feeling <span aria-hidden="true">↓</span></a>
            </div>
          </ScrollReveal>
          <div className="hero-index" aria-hidden="true"><span>01</span><i /></div>
          <div className="scene-whisper hero-whisper" aria-hidden="true">The feeling arrives first.</div>
          <p className="scene-caption scene-caption-right" aria-hidden="true"><span>SCENE 01</span> Follow the light through the gate</p>
        </div>
      </section>

      <section id="chapter-2" ref={setChapterRef(1)} style={chapterStyle(1)} className="story-chapter discovery-chapter chapter-dark">
        <div className="chapter-media depth-background">
          <Image src="/media/02-tokyo-night.webp" alt="Two travellers planning above Tokyo at night" fill sizes="100vw" />
        </div>
        <div className="chapter-wash discovery-wash" />
        <div className="portal-rings" aria-hidden="true"><i /><i /><i /></div>
        <div className="chapter-inner discovery-layout">
          <ScrollReveal className="chapter-heading-block">
            <p className="eyebrow eyebrow-coral">02 · Discover</p>
            <h2 className="chapter-title chapter-title-light">Find the feeling, then give it a shape.</h2>
            <p className="chapter-copy chapter-copy-light">Roamly starts with the texture of a trip—not a checklist. Choose a pace and let the practical pieces gather around it.</p>
          </ScrollReveal>
          <div className="discovery-cards" aria-label="Travel preferences">
            {DISCOVERY_CARDS.map((card, index) => (
              <ScrollReveal key={card.title} direction={index % 2 ? "right" : "left"} delay={index * 90}>
                <article className="discovery-card">
                  <span>{card.number}</span><div><h3>{card.title}</h3><p>{card.text}</p></div><span className="choice-mark" aria-hidden="true">+</span>
                </article>
              </ScrollReveal>
            ))}
          </div>
          <div className="scene-whisper discovery-whisper" aria-hidden="true">Not where. How should it feel?</div>
          <p className="scene-caption scene-caption-centre" aria-hidden="true"><span>SCENE 02</span> Cross the threshold</p>
        </div>
      </section>

      <section id="chapter-3" ref={setChapterRef(2)} style={chapterStyle(2)} className="story-chapter route-chapter">
        <div className="chapter-media train-media depth-background">
          <Image src="/media/03-mountain-train.webp" alt="Train crossing a bridge through misty Japanese mountains" fill sizes="100vw" />
        </div>
        <div className="chapter-wash route-wash" />
        <div className="train-window-frame" aria-hidden="true"><span>Tokyo</span><i /><span>Kyoto</span></div>
        <div className="chapter-inner route-layout">
          <ScrollReveal className="route-copy">
            <p className="eyebrow">03 · Connect</p><h2 className="chapter-title">A line becomes a week.</h2>
            <p className="chapter-copy">Tokyo wakes you up. Hakone slows you down. Kyoto gives every day a centre of gravity.</p>
          </ScrollReveal>
          <ScrollReveal delay={120} className="route-board-wrap">
            <div className="route-board">
              <div className="route-board-head"><span>Your route</span><span>7 days · 5 stops</span></div>
              <JourneyRoute progress={routeProgress} />
              <ol className="city-list" aria-label="Japan route stops">
                {['Tokyo', 'Hakone', 'Kyoto', 'Nara', 'Osaka'].map((city, index) => (
                  <li key={city} className={routeProgress >= [0.02, 0.28, 0.55, 0.78, 0.98][index] ? "is-arrived" : ""}><span>0{index + 1}</span>{city}</li>
                ))}
              </ol>
            </div>
          </ScrollReveal>
          <p className="scene-caption scene-caption-left" aria-hidden="true"><span>SCENE 03</span> The route writes itself</p>
        </div>
      </section>

      <section id="chapter-4" ref={setChapterRef(3)} style={chapterStyle(3)} className="story-chapter packing-chapter">
        <div className="chapter-inner packing-layout">
          <ScrollReveal className="packing-copy">
            <p className="eyebrow">04 · Make room</p><h2 className="chapter-title">Pack the days with moments, not admin.</h2>
            <p className="chapter-copy">Save the places that matter. Roamly fits them together with enough breathing room to still get lost.</p>
          </ScrollReveal>
          <div className="packing-whisper" aria-hidden="true">make room<br />for the unplanned</div>
          <div className={`model-stage ${showCanvas ? "model-stage-enhanced" : ""}`} aria-label={showCanvas ? "Animated indigo suitcase assembling piece by piece" : undefined}>
            {!showCanvas ? <Image src="/media/12-indigo-suitcase.png" alt="Indigo Japanese carry-on suitcase with a vermilion luggage tag" fill sizes="(max-width: 719px) 92vw, 44vw" /> : <span className="model-stage-label"><b>ASSEMBLY 04</b> ready for departure</span>}
          </div>
          <div className="packed-list" aria-label="Itinerary moments">
            {PACKED_MOMENTS.map((item, index) => (
              <ScrollReveal key={item.title} direction="right" delay={index * 90}>
                <article className="packed-card"><time>{item.time}</time><div><h3>{item.title}</h3><p>{item.meta}</p></div><span aria-hidden="true">↗</span></article>
              </ScrollReveal>
            ))}
          </div>
          <p className="scene-caption scene-caption-right" aria-hidden="true"><span>SCENE 04</span> Make room for what matters</p>
        </div>
      </section>

      <section id="chapter-5" ref={setChapterRef(4)} style={chapterStyle(4)} className="story-chapter memory-chapter chapter-dark">
        <div className="memory-image editorial-mask"><Image src="/media/05-street-food.webp" alt="Friends eating in a Japanese street-food alley" fill sizes="(max-width: 719px) 100vw, 66vw" /></div>
        <div className="memory-ambient" aria-hidden="true"><i /><i /><span /></div>
        <div className="film-perforations" aria-hidden="true" />
        <div className="chapter-inner memory-layout">
          <article className="memory-caption">
            <p className="eyebrow eyebrow-coral">05 · Remember</p><h2 className="chapter-title chapter-title-light">The plan disappears. The story stays.</h2>
            <dl className="memory-meta">
              <div><dt>Place</dt><dd>Dotonbori, Osaka</dd></div><div><dt>Time</dt><dd>8:30 PM</dd></div>
              <div><dt>Cost</dt><dd>¥1,200 each</dd></div><div><dt>Shared note</dt><dd>Order another round of takoyaki.</dd></div>
            </dl>
          </article>
          <p className="scene-caption scene-caption-left" aria-hidden="true"><span>SCENE 05</span> Plans turn into frames</p>
        </div>
      </section>

      <section id="chapter-6" ref={setChapterRef(5)} style={chapterStyle(5)} className="story-chapter shared-chapter">
        <div className="chapter-inner shared-layout">
          <ScrollReveal className="shared-heading">
            <p className="eyebrow">06 · Share</p><h2 className="chapter-title">One plan. Everyone in the loop.</h2>
            <p className="chapter-copy">Times, places, notes, and booking details stay clear for the people travelling with you.</p>
          </ScrollReveal>
          <ScrollReveal delay={100} className="itinerary-preview">
            <div className="preview-head"><div><span>Day 4 · Kyoto</span><h3>Lanterns & lanes</h3></div><span className="status-chip">Shared</span></div>
            <ol>
              <li><time>06:10</time><div><strong>Fushimi Inari</strong><span>Fushimi Ward · Free</span></div></li>
              <li><time>11:30</time><div><strong>Nishiki Market</strong><span>Downtown Kyoto · ¥2,500</span></div></li>
              <li><time>15:20</time><div><strong>Kiyomizu-dera</strong><span>Higashiyama · ¥400</span></div></li>
            </ol>
          </ScrollReveal>
          <ScrollReveal delay={180} direction="right" className="companion-preview">
            <span className="phone-label">Companion view</span><p>“Meet beneath the station clock at 09:15. I have the rail passes.”</p>
            <div><span>NH203-DEMO</span><small>Demo booking</small></div>
          </ScrollReveal>
          <div className="shared-actions"><Link href="/planner?destination=Japan" className="button button-primary">Open planner</Link><Link href="/share" className="button button-secondary">View shared trip</Link></div>
          <p className="scene-caption scene-caption-right" aria-hidden="true"><span>SCENE 06</span> Five days. One orbit.</p>
        </div>
      </section>

      <section id="chapter-7" ref={setChapterRef(6)} style={chapterStyle(6)} className="story-chapter finale-chapter chapter-dark">
        <div className="chapter-media finale-media depth-background"><Image src="/media/06-coastal-road.webp" alt="Car following a coastal road at sunset" fill sizes="100vw" /></div>
        <div className="chapter-wash finale-wash" />
        <div className="horizon-word" aria-hidden="true">GO</div>
        <div className="chapter-inner finale-inner depth-foreground">
          <ScrollReveal><p className="eyebrow eyebrow-light">07 · Go</p><h2 className="finale-title">The best part is leaving the plan behind.</h2>
            <p className="hero-copy">Keep the details close. Keep the horizon open.</p>
            <div className="hero-actions finale-actions"><Link href="/planner?destination=Japan" className="button button-coral">Build your Japan trip</Link><Link href="/share" className="text-link text-link-light">See the companion view <span aria-hidden="true">↗</span></Link></div>
          </ScrollReveal>
        </div>
        <footer className="story-footer"><span>Roamly</span><span>Plan less. Go further.</span></footer>
      </section>
    </main>
  );
}
