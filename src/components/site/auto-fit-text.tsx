"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";

type AutoFitTextProps = ComponentPropsWithoutRef<"span"> & {
  as?: "span" | "h1" | "h2" | "h3";
  maxSize?: number;
  minSize?: number;
};

export function AutoFitText({
  as = "span",
  maxSize = 176,
  minSize = 36,
  className,
  children,
  ...props
}: AutoFitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [fontSize, setFontSize] = useState(maxSize);
  const Tag = as;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const fit = () => {
      const parent = element.parentElement;
      if (!parent) return;
      const availableWidth = parent.clientWidth;
      if (!availableWidth) return;

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;
      const styles = window.getComputedStyle(element);
      context.font = `${styles.fontWeight} ${fontSize}px ${styles.fontFamily}`;
      const measuredWidth = context.measureText(String(children ?? "")).width;
      if (!measuredWidth) return;

      setFontSize((current) => {
        const next = Math.min(maxSize, current * (availableWidth / measuredWidth));
        return Math.max(minSize, Math.floor(next));
      });
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element.parentElement ?? element);
    return () => observer.disconnect();
  }, [maxSize, minSize, children, fontSize]);

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{ fontSize, whiteSpace: "nowrap" }}
      {...props}
    >
      {children}
    </Tag>
  );
}
