import { onBeforeUnmount, onMounted, type Ref } from "vue";

/** Public-layout-only entrance motion; content never depends on animation to be visible. */
export function usePublicMotion(root: Ref<HTMLElement | null>) {
  let cleanup = () => {};
  onMounted(() => {
    const element = root.value;
    if (!element || !("IntersectionObserver" in window)) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (reduced.matches) continue;
          entry.target.animate?.(
            [
              { opacity: 0, transform: "translateY(16px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 550, easing: "cubic-bezier(.22,1,.36,1)" },
          );
        }
      },
      { threshold: 0.08 },
    );
    const scan = () => {
      element
        .querySelectorAll("main h1, main h2, main figure, main article")
        .forEach((target) => {
          if (seen.has(target)) return;
          seen.add(target);
          observer.observe(target);
        });
    };
    const changes = new MutationObserver(scan);
    changes.observe(element, { childList: true, subtree: true });
    const stopMotion = () => {
      if (reduced.matches)
        element
          .getAnimations({ subtree: true })
          .forEach((animation) => animation.cancel());
    };
    reduced.addEventListener("change", stopMotion);
    scan();
    cleanup = () => {
      observer.disconnect();
      changes.disconnect();
      reduced.removeEventListener("change", stopMotion);
      element
        .getAnimations({ subtree: true })
        .forEach((animation) => animation.cancel());
    };
  });
  onBeforeUnmount(() => cleanup());
}
