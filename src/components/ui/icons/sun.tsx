import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

export function Sun({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={12} y1={1} x2={12} y2={3} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={12} y1={21} x2={12} y2={23} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={4.22} y1={4.22} x2={5.64} y2={5.64} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={18.36} y1={18.36} x2={19.78} y2={19.78} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={1} y1={12} x2={3} y2={12} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={21} y1={12} x2={23} y2={12} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={4.22} y1={19.78} x2={5.64} y2={18.36} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={18.36} y1={5.64} x2={19.78} y2={4.22} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
