"use client";

import { useEffect, useState } from "react";

export function useCoursePanelState(defaultDesktopOpen = true) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setIsOpen(defaultDesktopOpen);
    }
  }, [defaultDesktopOpen]);

  const toggle = () => setIsOpen((prev) => !prev);

  return { isOpen, setIsOpen, toggle };
}

