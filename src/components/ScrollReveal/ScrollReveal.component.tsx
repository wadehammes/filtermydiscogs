"use client";

import classNames from "classnames";
import {
  type CSSProperties,
  createContext,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useScrollRevealInView } from "src/hooks/useScrollRevealInView.hook";
import scrollRevealStyles from "src/styles/modules/scroll-reveal.module.css";
import {
  buildLocaleTickerSegments,
  formatLocaleCount,
  type TickerSegment,
  tickerStartValue,
} from "src/utils/tickerNumber.helpers";

const DIGIT_CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ScrollRevealActiveContext = createContext<boolean | undefined>(undefined);

interface ScrollRevealProps
  extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  animateOnView?: boolean;
  deferUntilRevealed?: boolean;
  placeholderClassName?: string;
  style?: CSSProperties;
  "data-testid"?: string;
  ref?: Ref<HTMLElement>;
}

export function ScrollReveal({
  children,
  className,
  as: Component = "div",
  animateOnView = true,
  deferUntilRevealed = false,
  placeholderClassName,
  style,
  "aria-busy": ariaBusy,
  "data-testid": dataTestId,
  ref: externalRef,
  ...rest
}: ScrollRevealProps) {
  const { ref: inViewRef, inView } = useScrollRevealInView({
    skip: !animateOnView,
  });
  const revealed = !animateOnView || inView;
  const showPlaceholder = deferUntilRevealed && animateOnView && !revealed;

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      inViewRef(node);

      if (typeof externalRef === "function") {
        externalRef(node);
        return;
      }

      if (externalRef) {
        externalRef.current = node;
      }
    },
    [externalRef, inViewRef],
  );

  return (
    <ScrollRevealActiveContext.Provider value={revealed}>
      <Component
        ref={setRef}
        className={classNames(
          scrollRevealStyles.root,
          revealed && scrollRevealStyles.revealed,
          className,
        )}
        style={style}
        aria-busy={showPlaceholder ? true : ariaBusy}
        data-testid={dataTestId}
        {...rest}
      >
        {showPlaceholder ? (
          <div
            aria-hidden="true"
            className={classNames(
              scrollRevealStyles.placeholder,
              placeholderClassName,
            )}
          />
        ) : (
          children
        )}
      </Component>
    </ScrollRevealActiveContext.Provider>
  );
}

interface ScrollRevealItemProps
  extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: ReactNode;
  index?: number;
  className?: string;
  as?: ElementType;
  style?: CSSProperties;
}

export function ScrollRevealItem({
  children,
  index = 0,
  className,
  as: Component = "div",
  style,
  ...rest
}: ScrollRevealItemProps) {
  return (
    <Component
      className={classNames(scrollRevealStyles.item, className)}
      style={
        {
          ...style,
          "--reveal-index": index,
        } as CSSProperties
      }
      {...rest}
    >
      {children}
    </Component>
  );
}

interface ScrollRevealOnceProps
  extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  style?: CSSProperties;
}

export function ScrollRevealOnce({
  children,
  className,
  as: Component = "div",
  style,
  ...rest
}: ScrollRevealOnceProps) {
  const { ref, inView } = useScrollRevealInView();

  return (
    <Component
      ref={ref}
      className={classNames(
        scrollRevealStyles.once,
        inView && scrollRevealStyles.onceRevealed,
        className,
      )}
      style={style}
      {...rest}
    >
      {children}
    </Component>
  );
}

interface ScrollRevealBarProps {
  className?: string;
  width: string;
  delayMs?: number;
  style?: CSSProperties;
}

export function ScrollRevealBar({
  className,
  width,
  delayMs = 0,
  style,
}: ScrollRevealBarProps) {
  return (
    <div
      aria-hidden="true"
      className={classNames(scrollRevealStyles.barFill, className)}
      style={
        {
          ...style,
          "--bar-width": width,
          "--bar-delay": `${delayMs}ms`,
        } as CSSProperties
      }
    />
  );
}

interface TickerNumberProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  value: number;
  from?: number;
  active?: boolean;
  format?: (value: number) => string;
  durationMs?: number;
  digitStaggerMs?: number;
}

export function TickerNumber({
  value,
  from,
  active,
  className,
  format = formatLocaleCount,
  durationMs = 2400,
  digitStaggerMs = 50,
  ...rest
}: TickerNumberProps) {
  const parentActive = useContext(ScrollRevealActiveContext);
  const isActive = active ?? parentActive ?? true;
  const startValue = from ?? tickerStartValue(value);
  const [isAnimating, setIsAnimating] = useState(false);

  const segments = useMemo(
    () => buildLocaleTickerSegments(value, startValue),
    [startValue, value],
  );

  useEffect(() => {
    if (!isActive) {
      setIsAnimating(false);
      return;
    }

    if (prefersReducedMotion()) {
      setIsAnimating(true);
      return;
    }

    const raf = requestAnimationFrame(() => {
      setIsAnimating(true);
    });

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [isActive, startValue, value]);

  return (
    <span aria-label={format(value)} className={className} role="img" {...rest}>
      <span
        aria-hidden="true"
        className={scrollRevealStyles.ticker}
        style={
          {
            "--ticker-duration": `${durationMs}ms`,
            "--ticker-stagger": `${digitStaggerMs}ms`,
          } as CSSProperties
        }
      >
        {segments.map((segment, index) =>
          renderTickerSegment(segment, index, isActive && isAnimating),
        )}
      </span>
    </span>
  );
}

function renderTickerSegment(
  segment: TickerSegment,
  index: number,
  isAnimating: boolean,
) {
  if (segment.kind === "static") {
    return (
      <span
        className={scrollRevealStyles.tickerStatic}
        key={`static-${index}-${segment.char}`}
      >
        {segment.char}
      </span>
    );
  }

  const digitOffset = isAnimating ? segment.digitValue : segment.startDigit;

  return (
    <span
      className={scrollRevealStyles.digitSlot}
      key={`digit-${segment.digitIndex}`}
    >
      <span
        className={scrollRevealStyles.digitStrip}
        style={{
          transform: `translateY(calc(${digitOffset} * -1em))`,
          transitionDelay: isAnimating
            ? `calc(${segment.digitIndex} * var(--ticker-stagger, 50ms))`
            : "0ms",
        }}
      >
        {DIGIT_CELLS.map((digit) => (
          <span className={scrollRevealStyles.digitCell} key={digit}>
            {digit}
          </span>
        ))}
      </span>
    </span>
  );
}
