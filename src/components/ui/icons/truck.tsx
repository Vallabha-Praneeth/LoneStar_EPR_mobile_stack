import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function Truck({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x={1}
        y={3}
        width={15}
        height={13}
        rx={1}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 8h4l3 3v5h-7V8Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={5.5} cy={18.5} r={2.5} stroke={color} strokeWidth={2} />
      <Circle cx={18.5} cy={18.5} r={2.5} stroke={color} strokeWidth={2} />
    </Svg>
  );
}
