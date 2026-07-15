import { useEffect, useRef, useCallback } from 'react';

/**
 * useInfiniteScroll — triggers `onLoadMore` when the sentinel element enters the viewport.
 * @param {Function} onLoadMore  - callback to load the next page
 * @param {boolean}  hasMore     - stop observing when false
 * @param {boolean}  loading     - don't trigger while already loading
 */
export function useInfiniteScroll(onLoadMore, hasMore, loading) {
  const sentinelRef = useRef(null);

  const handleIntersect = useCallback((entries) => {
    if (entries[0].isIntersecting && hasMore && !loading) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleIntersect, { rootMargin: '200px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return sentinelRef;
}
