'use client';

import React from 'react';

export interface LeafRingLoaderProps {
  /** Size in pixels or CSS units (sets CSS variable --s). Default: 80 */
  size?: number | string;
  /** Whether the leaves should take currentColor (e.g. inside buttons) */
  inheritColor?: boolean;
  /** Optional static or reactive progress value from 0 to 100 */
  progress?: number;
  /** Extra CSS classes */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
  /** Optional custom accessible label */
  ariaLabel?: string;
}

const LEAF_ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315];
const LEAF_PATH = 'M0 -5 C5 -9 5 -19 0 -25 C-5 -19 -5 -9 0 -5Z';

export const LeafRingLoader: React.FC<LeafRingLoaderProps> = ({
  size = 80,
  inheritColor = false,
  progress,
  className = '',
  style,
  ariaLabel = 'Loading',
}) => {
  const isProgress = typeof progress === 'number';
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  const combinedStyles: React.CSSProperties = {
    ['--s' as string]: sizeValue,
    ...(isProgress ? { ['--p' as string]: progress } : {}),
    ...style,
  };

  const rootClasses = [
    'leaf-ring-loader',
    inheritColor ? 'is-inherit' : '',
    isProgress ? 'is-progress' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <svg
      viewBox="-32 -32 64 64"
      role="status"
      aria-label={ariaLabel}
      className={rootClasses}
      style={combinedStyles}
    >
      <g className="leaf-petals">
        {LEAF_ROTATIONS.map((rot, idx) => (
          <g
            key={idx}
            className="leaf-petal-node"
            style={{ transform: `rotate(${rot}deg)` }}
          >
            <path
              d={LEAF_PATH}
              className="leaf-petal"
              style={{ ['--i' as string]: idx } as React.CSSProperties}
            />
          </g>
        ))}
      </g>
      <circle cx="0" cy="0" r="3.2" className="leaf-seed" />
    </svg>
  );
};

export default LeafRingLoader;
