import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface InfiniteScrollProps {
  dataLength: number;
  next: () => void;
  hasMore: boolean;
  loader?: ReactNode;
  endMessage?: ReactNode;
  scrollThreshold?: number;
  scrollableTarget?: string;
  className?: string;
  children: ReactNode;
}

function InfiniteScroll({
  dataLength,
  next,
  hasMore,
  loader = null,
  endMessage = null,
  scrollThreshold = 0.8,
  scrollableTarget,
  className = "",
  children,
}: InfiniteScrollProps) {
  const [isLoading, setIsLoading] = useState(false);
  const lastDataLengthRef = useRef(dataLength);
  const requestInProgressRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback(() => {
    // Multiple checks to prevent duplicate calls
    if (!hasMore || isLoading || requestInProgressRef.current) return;

    const scrollableElement = scrollableTarget
      ? document.getElementById(scrollableTarget)
      : window;

    if (!scrollableElement) return;

    let scrollTop: number;
    let scrollHeight: number;
    let clientHeight: number;

    if (scrollableElement === window) {
      scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      scrollHeight =
        document.documentElement.scrollHeight || document.body.scrollHeight;
      clientHeight = window.innerHeight;
    } else {
      const element = scrollableElement as HTMLElement;
      scrollTop = element.scrollTop;
      scrollHeight = element.scrollHeight;
      clientHeight = element.clientHeight;
    }

    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    if (scrollPercentage >= scrollThreshold) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Debounce the API call
      timeoutRef.current = setTimeout(() => {
        if (!requestInProgressRef.current && hasMore) {
          requestInProgressRef.current = true;
          setIsLoading(true);
          next();
        }
      }, 100); // 100ms debounce
    }
  }, [hasMore, scrollThreshold, scrollableTarget, next, isLoading]);

  // Reset loading state when data changes
  useEffect(() => {
    if (dataLength !== lastDataLengthRef.current) {
      setIsLoading(false);
      requestInProgressRef.current = false;
      lastDataLengthRef.current = dataLength;

      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [dataLength]);

  useEffect(() => {
    const scrollableElement = scrollableTarget
      ? document.getElementById(scrollableTarget)
      : window;

    if (!scrollableElement) return;

    // Throttle scroll events
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    scrollableElement.addEventListener("scroll", throttledScroll, {
      passive: true,
    });

    return () => {
      scrollableElement.removeEventListener("scroll", throttledScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleScroll, scrollableTarget]);

  return (
    <div className={className}>
      {children}
      {isLoading && hasMore && loader}
      {!hasMore && endMessage}
    </div>
  );
}

export default InfiniteScroll;
