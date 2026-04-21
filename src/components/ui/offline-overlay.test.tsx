/* eslint-disable testing-library/prefer-screen-queries */
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { OfflineOverlay } from './offline-overlay';

const mockUseIsOnline = jest.fn();

jest.mock('@/lib/hooks/use-is-online', () => ({
  useIsOnline: () => mockUseIsOnline(),
}));

jest.mock('@/lib/hooks/use-reduced-motion', () => ({
  useReducedMotion: () => false,
}));

describe('offlineOverlay', () => {
  afterEach(() => {
    mockUseIsOnline.mockReset();
  });

  it('renders nothing when online', () => {
    mockUseIsOnline.mockReturnValue({ isOnline: true, wasOnline: true });

    const { queryByTestId } = render(<OfflineOverlay />);

    expect(queryByTestId('offline-overlay')).toBeNull();
  });

  it('renders overlay when offline', () => {
    mockUseIsOnline.mockReturnValue({ isOnline: false, wasOnline: true });

    const { getByTestId, getByText } = render(<OfflineOverlay />);

    expect(getByTestId('offline-overlay')).toBeTruthy();
    expect(getByText('You are offline')).toBeTruthy();
    expect(getByText('We will reconnect automatically.')).toBeTruthy();
  });
});
