import { useEffect, useState, type RefObject } from 'react';

export function ScrollHint({
  targetRef,
}: {
  targetRef: RefObject<HTMLElement | null>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: '0px 0px -18% 0px', threshold: 0.08 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [targetRef]);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="scroll-hint"
      onClick={() =>
        targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    >
      <span>Continuar</span>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path
          d="M3 6.2 8 11l5-4.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
