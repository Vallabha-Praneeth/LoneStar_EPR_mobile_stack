import * as React from 'react';
import { View } from 'react-native';

import { cleanup, render, screen } from '@/lib/test-utils';

import { IconButton } from './icon-button';

// useUniwind requires a Uniwind provider that is not present in the test
// wrapper. Mock it here so all tests run in isolation with a stable theme.
jest.mock('uniwind', () => {
  const stub = () => ({ theme: 'light' });
  return { useUniwind: stub };
});

afterEach(cleanup);

/**
 * Minimal icon stub. Surfaces the injected `color` via `accessibilityHint`
 * so tests can assert on color injection without using non-standard View props.
 */
function MockIcon({ color, testID }: { color?: string; testID?: string }) {
  return <View testID={testID} accessibilityHint={color} />;
}

describe('iconButton component', () => {
  it('renders the icon when not loading', () => {
    render(
      <IconButton
        testID="icon-button"
        icon={color => <MockIcon testID="mock-icon" color={color} />}
        accessibilityLabel="Open menu"
      />,
    );
    expect(screen.getByTestId('mock-icon')).toBeOnTheScreen();
  });

  it('passes accessibilityLabel to the underlying button element', () => {
    render(
      <IconButton
        testID="icon-button"
        icon={color => <MockIcon testID="mock-icon" color={color} />}
        accessibilityLabel="Open menu"
      />,
    );
    expect(screen.getByTestId('icon-button').props.accessibilityLabel).toBe(
      'Open menu',
    );
  });

  it('shows the loading spinner and hides the icon when loading', () => {
    render(
      <IconButton
        testID="icon-button"
        icon={color => <MockIcon testID="mock-icon" color={color} />}
        accessibilityLabel="Open menu"
        loading
      />,
    );
    expect(
      screen.getByTestId('icon-button-activity-indicator'),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId('mock-icon')).toBeNull();
  });

  it('is disabled when the disabled prop is true', () => {
    render(
      <IconButton
        testID="icon-button"
        icon={color => <MockIcon testID="mock-icon" color={color} />}
        accessibilityLabel="Open menu"
        disabled
      />,
    );
    expect(screen.getByTestId('icon-button')).toBeDisabled();
  });

  it('injects the correct icon color for the default variant in light mode', () => {
    render(
      <IconButton
        testID="icon-button"
        icon={color => <MockIcon testID="mock-icon" color={color} />}
        accessibilityLabel="Open menu"
        variant="default"
      />,
    );
    // VARIANT_ICON_COLORS.default.light = '#ffffff' (text-white)
    expect(screen.getByTestId('mock-icon').props.accessibilityHint).toBe(
      '#ffffff',
    );
  });
});
