/* eslint-disable testing-library/prefer-screen-queries */
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { RevenueCoin } from './revenue-coin';

jest.mock('@/lib/hooks/use-reduced-motion', () => ({
  useReducedMotion: jest.fn(() => false),
}));

describe('revenueCoin', () => {
  it('renders formatted value text', () => {
    const { getByText } = render(<RevenueCoin formattedValue="$1,234" />);
    expect(getByText('$1,234')).toBeTruthy();
  });

  it('renders Rive coin player testID', () => {
    const { getByTestId } = render(<RevenueCoin formattedValue="$0" />);
    expect(getByTestId('revenue-coin-rive')).toBeTruthy();
  });

  it('uses fallback accessibility label when prop is absent', () => {
    const { getByLabelText } = render(<RevenueCoin formattedValue="$456" />);
    expect(getByLabelText('Revenue $456')).toBeTruthy();
  });

  it('uses custom accessibilityLabel when provided', () => {
    const { getByLabelText } = render(
      <RevenueCoin formattedValue="$456" accessibilityLabel="Total revenue stat" />,
    );
    expect(getByLabelText('Total revenue stat')).toBeTruthy();
  });

  it('propagates size to the rive container', () => {
    const { getByTestId } = render(<RevenueCoin formattedValue="$99" size={64} />);
    expect(getByTestId('revenue-coin-rive')).toHaveStyle({ width: 64, height: 64 });
  });
});
