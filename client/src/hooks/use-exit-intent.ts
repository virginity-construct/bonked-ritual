import { useEffect, useRef } from "react";

export function useExitIntent(onExitIntent: () => void) {
  const hasTriggered = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse is leaving from the top of the page
      if (e.clientY <= 0 && !hasTriggered.current) {
        hasTriggered.current = true;
        
        // Small delay to prevent accidental triggers
        timeoutRef.current = setTimeout(() => {
          onExitIntent();
        }, 500);
      }
    };

    const handleMouseEnter = () => {
      // Cancel the timeout if user re-enters quickly
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onExitIntent]);
}
