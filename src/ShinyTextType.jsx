'use client';

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  createElement,
} from 'react';
import './ShinyTextType.css';

// This component renders the hero <h1>, so it sits on the critical path. It
// used to import gsap (for a cursor opacity blink) and motion (for the shine
// sweep) — together ~180 KB of JS to drive two things CSS animates natively.
// Both are now keyframes in ShinyTextType.css; the typing effect stays in JS
// because it mutates text content, which CSS can't do.

const ShinyTextType = ({
  text,
  as: Component = 'div',
  typingSpeed = 75,
  initialDelay = 0,
  pauseDuration = 1500,
  deletingSpeed = 50,
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = '_',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  variableSpeed,
  variableSpeedEnabled = false,
  variableSpeedMin = 60,
  variableSpeedMax = 120,
  speed = 2,
  color = '#b5b5b5',
  shineColor = '#ffffff',
  spread = 120,
  yoyo = false,
  pauseOnHover = false,
  direction = 'left',
  delay = 0,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}) => {
  const resolvedVariableSpeed = useMemo(
    () =>
      variableSpeedEnabled
        ? variableSpeed || { min: variableSpeedMin, max: variableSpeedMax }
        : undefined,
    [variableSpeed, variableSpeedEnabled, variableSpeedMin, variableSpeedMax]
  );
  // --- typing state ---
  const [displayedText, setDisplayedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const containerRef = useRef(null);

  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);

  // --- shiny state ---
  const [isPaused, setIsPaused] = useState(false);

  const animationDuration = speed * 1000;
  const delayDuration = delay * 1000;

  // --- typing effect ---
  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  // The typed-out heading is this page's Largest Contentful Paint element, so
  // LCP can't finish before the last character lands. On phones (and for
  // reduced-motion users) the whole string is painted at once instead — the
  // effect is a flourish, not information, and it isn't worth seconds of
  // measured load time on the devices most patients actually use.
  const instantText =
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (!instantText) return;
    const full = textArray[currentTextIndex] ?? '';
    setDisplayedText(full);
    setCurrentCharIndex(full.length);
  }, [instantText, textArray, currentTextIndex]);

  useEffect(() => {
    if (!isVisible || instantText) return;

    let timeout;
    const currentText = textArray[currentTextIndex];
    const processedText = reverseMode
      ? currentText.split('').reverse().join('')
      : currentText;

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === '') {
          setIsDeleting(false);
          if (currentTextIndex === textArray.length - 1 && !loop) {
            return;
          }

          if (onSentenceComplete) {
            onSentenceComplete(textArray[currentTextIndex], currentTextIndex);
          }

          setCurrentTextIndex((prev) => (prev + 1) % textArray.length);
          setCurrentCharIndex(0);
          timeout = setTimeout(() => {}, pauseDuration);
        } else {
          timeout = setTimeout(() => {
            setDisplayedText((prev) => prev.slice(0, -1));
          }, deletingSpeed);
        }
      } else {
        if (currentCharIndex < processedText.length) {
          const charSpeed = resolvedVariableSpeed
            ? Math.random() * (resolvedVariableSpeed.max - resolvedVariableSpeed.min) +
              resolvedVariableSpeed.min
            : typingSpeed;
          timeout = setTimeout(() => {
            setDisplayedText((prev) => prev + processedText[currentCharIndex]);
            setCurrentCharIndex((prev) => prev + 1);
          }, charSpeed);
        } else if (textArray.length >= 1) {
          if (!loop && currentTextIndex === textArray.length - 1) return;
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, pauseDuration);
        }
      }
    };

    if (currentCharIndex === 0 && !isDeleting && displayedText === '') {
      timeout = setTimeout(executeTypingAnimation, initialDelay);
    } else {
      executeTypingAnimation();
    }

    return () => clearTimeout(timeout);
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    instantText,
    reverseMode,
    resolvedVariableSpeed,
    onSentenceComplete,
  ]);

  // The shine sweep is a pure background-position animation, so it runs as a
  // CSS keyframe on the compositor instead of a JS rAF callback setting style
  // every frame. Duration/direction/yoyo map onto animation-* properties.
  const shineStyle = {
    animationDuration: `${animationDuration + delayDuration}ms`,
    animationDirection: direction === 'left' ? 'normal' : 'reverse',
    animationIterationCount: 'infinite',
    animationTimingFunction: yoyo ? 'ease-in-out' : 'linear',
    animationPlayState: isPaused ? 'paused' : 'running',
  };

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true);
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false);
  }, [pauseOnHover]);

  const gradientStyle = {
    backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  const shouldHideCursor =
    hideCursorWhileTyping &&
    (currentCharIndex < textArray[currentTextIndex].length || isDeleting);

  return createElement(
    Component,
    {
      ref: containerRef,
      className: `shiny-text-type ${className}`,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      ...props,
    },
    <span
      key="content"
      className="shiny-text-type__content"
      style={{ ...gradientStyle, ...shineStyle }}
    >
      {displayedText}
    </span>,
    showCursor && (
      <span
        key="cursor"
        style={{ animationDuration: `${cursorBlinkDuration * 2}s` }}
        className={`shiny-text-type__cursor ${cursorClassName} ${
          shouldHideCursor ? 'shiny-text-type__cursor--hidden' : ''
        }`}
      >
        {cursorCharacter}
      </span>
    )
  );
};

export default ShinyTextType;
