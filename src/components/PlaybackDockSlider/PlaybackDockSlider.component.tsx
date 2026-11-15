"use client";

import { Slider } from "@base-ui/react/slider";
import classNames from "classnames";
import styles from "./PlaybackDockSlider.module.css";

export interface PlaybackDockSliderProps {
  ariaLabel: string;
  className?: string | undefined;
  disabled?: boolean | undefined;
  max: number;
  min?: number | undefined;
  onValueChange: (value: number) => void;
  onValueCommitted: (value: number) => void;
  orientation?: "horizontal" | "vertical" | undefined;
  step?: number | undefined;
  testId?: string | undefined;
  value: number;
}

export const PlaybackDockSlider = ({
  ariaLabel,
  className,
  disabled = false,
  max,
  min = 0,
  onValueChange,
  onValueCommitted,
  orientation = "horizontal",
  step = 1,
  testId = "fmdPlaybackDockSlider",
  value,
}: PlaybackDockSliderProps) => (
  <Slider.Root
    aria-label={ariaLabel}
    className={classNames(styles.root, className, {
      [styles.rootVertical]: orientation === "vertical",
    })}
    data-testid={testId}
    disabled={disabled}
    max={max}
    min={min}
    onValueChange={onValueChange}
    onValueCommitted={onValueCommitted}
    orientation={orientation}
    step={step}
    thumbAlignment="edge"
    value={value}
  >
    <Slider.Control className={styles.control}>
      <Slider.Track className={styles.track}>
        <Slider.Indicator className={styles.indicator} />
      </Slider.Track>
      <Slider.Thumb className={styles.thumb} />
    </Slider.Control>
  </Slider.Root>
);
