"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TutorAvatar, TutorAvatarEmotion } from "@/components/brand/TutorAvatar";

const sectionMap: Array<{
  id: string;
  emotion: TutorAvatarEmotion;
  desktopTop: number;
  label: string;
}> = [
  { id: "hero", emotion: "encouraging", desktopTop: 18, label: "Welcoming" },
  { id: "features", emotion: "explaining", desktopTop: 35, label: "Explaining" },
  { id: "how-it-works", emotion: "thinking", desktopTop: 52, label: "Thinking" },
  { id: "cta", emotion: "happy", desktopTop: 68, label: "Cheering" },
  { id: "footer", emotion: "happy", desktopTop: 74, label: "Cheering" },
];

function nearestSectionId() {
  const viewportCenter = window.innerHeight * 0.45;
  let nearest = sectionMap[0];
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (const section of sectionMap) {
    const el = document.getElementById(section.id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const distance = Math.abs(center - viewportCenter);
    if (distance < smallestDistance) {
      smallestDistance = distance;
      nearest = section;
    }
  }

  return nearest;
}

export function LandingAvatarRail() {
  const [activeSection, setActiveSection] = useState(sectionMap[0]);

  useEffect(() => {
    const update = () => {
      setActiveSection(nearestSectionId());
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const desktopTop = useMemo(() => `${activeSection.desktopTop}%`, [activeSection.desktopTop]);

  return (
    <>
      <motion.aside
        className="pointer-events-none fixed right-6 z-40 hidden xl:block"
        animate={{ top: desktopTop }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
      >
        <div className="landing-surface w-28 rounded-2xl p-2 text-center shadow-[0_18px_30px_rgba(0,0,0,0.16)]">
          <TutorAvatar
            variant="full"
            emotion={activeSection.emotion}
            size={88}
            className="mx-auto"
          />
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a6a09]">
            {activeSection.label}
          </p>
        </div>
      </motion.aside>

      <div className="pointer-events-none fixed bottom-4 right-4 z-40 xl:hidden">
        <div className="landing-surface rounded-full p-1.5 shadow-[0_12px_20px_rgba(0,0,0,0.18)]">
          <TutorAvatar
            variant="full"
            emotion={activeSection.emotion}
            size={54}
            className="rounded-full"
          />
        </div>
      </div>
    </>
  );
}

