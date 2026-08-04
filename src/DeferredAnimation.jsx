import { useEffect, useRef, useState } from 'react';

const getReducedMotionQuery = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)');

const scheduleIdle = callback => {
  let idleId;
  let timeoutId;
  let cancelled = false;

  const run = () => {
    if (!cancelled) callback();
  };

  if (typeof window.requestIdleCallback === 'function') {
    idleId = window.requestIdleCallback(run, { timeout: 2000 });
  } else {
    timeoutId = window.setTimeout(run, 350);
  }

  return () => {
    cancelled = true;
    if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(idleId);
    }
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  };
};

const runAfterLoadAndIdle = callback => {
  let cleanupIdle = () => {};
  let loadHandler;

  const schedule = () => {
    cleanupIdle = scheduleIdle(callback);
  };

  if (document.readyState === 'complete') {
    schedule();
  } else {
    loadHandler = () => schedule();
    window.addEventListener('load', loadHandler, { once: true, passive: true });
  }

  return () => {
    cleanupIdle();
    if (loadHandler) window.removeEventListener('load', loadHandler);
  };
};

function DeferredAnimation({
  load,
  children,
  fallback = null,
  className = '',
  componentClassName,
  rootMargin = '0px',
  componentRootMargin,
  minHeight,
  // Blocks loading entirely while true. Used for the hero animations, which
  // sit behind the full-screen language gate on first load — fetching a
  // half-megabyte of WebGL for something nobody can see yet just delays the
  // part of the page the visitor is actually looking at.
  hold = false,
  ...componentProps
}) {
  const containerRef = useRef(null);
  const startedRef = useRef(false);
  const [Animation, setAnimation] = useState(null);
  const [isOnScreen, setIsOnScreen] = useState(true);

  useEffect(() => {
    if (hold) return undefined;
    const reducedMotion = getReducedMotionQuery();
    if (reducedMotion?.matches) return undefined;

    let disposed = false;
    let cancelLoad = () => {};
    let observer;

    const beginLoading = () => {
      if (startedRef.current || disposed) return;
      startedRef.current = true;
      cancelLoad = runAfterLoadAndIdle(async () => {
        if (disposed || getReducedMotionQuery()?.matches) return;
        try {
          const module = await load();
          if (!disposed && module?.default) setAnimation(() => module.default);
        } catch (error) {
          if (!disposed) console.error('Unable to load deferred animation', error);
        }
      });
    };

    if (typeof IntersectionObserver === 'undefined') {
      beginLoading();
    } else {
      observer = new IntersectionObserver(
        entries => {
          if (entries.some(entry => entry.isIntersecting)) {
            beginLoading();
            observer?.disconnect();
          }
        },
        { rootMargin, threshold: 0.01 }
      );
      if (containerRef.current) observer.observe(containerRef.current);
    }

    return () => {
      disposed = true;
      startedRef.current = false;
      observer?.disconnect();
      cancelLoad();
    };
  }, [load, rootMargin, hold]);

  // Once the heavy animation is mounted, keep tracking whether it's actually
  // on screen so its render loop can pause while scrolled away — otherwise
  // every loaded WebGL/rAF animation keeps burning CPU/GPU forever, which is
  // what causes scroll jank once a few sections have loaded in.
  useEffect(() => {
    if (!Animation || typeof IntersectionObserver === 'undefined') return undefined;
    const el = containerRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      entries => {
        setIsOnScreen(entries.some(entry => entry.isIntersecting));
      },
      { rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [Animation]);

  const style = minHeight ? { minHeight } : undefined;

  return (
    <div ref={containerRef} className={`deferred-animation ${className}`.trim()} style={style}>
      {Animation ? (
        <Animation
          {...componentProps}
          className={componentClassName}
          rootMargin={componentRootMargin}
          paused={!isOnScreen}
        >
          {children}
        </Animation>
      ) : (
        fallback
      )}
    </div>
  );
}

export default DeferredAnimation;
