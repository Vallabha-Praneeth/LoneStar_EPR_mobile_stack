import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Circle, Rect } from 'react-native-svg';

export function StopCircle({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle
        cx={12}
        cy={12}
        r={10}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x={9}
        y={9}
        width={6}
        height={6}
        rx={1}
        fill={color}
      />
    </Svg>
  );
}
