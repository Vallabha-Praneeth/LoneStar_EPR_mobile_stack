/* eslint-disable testing-library/prefer-screen-queries */
import { fireEvent, render } from '@testing-library/react-native';
import * as React from 'react';

import { RiveBackButton } from './rive-back-button';

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

describe('riveBackButton', () => {
  beforeEach(() => {
    mockBack.mockReset();
  });

  it('calls router.back when pressed', () => {
    const { getByTestId } = render(<RiveBackButton testID="back-btn" />);

    fireEvent.press(getByTestId('back-btn'));

    expect(mockBack).toHaveBeenCalled();
  });

  it('calls onPress override and does not call router.back when provided', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<RiveBackButton testID="back-btn" onPress={onPress} />);

    fireEvent.press(getByTestId('back-btn'));

    expect(onPress).toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('still navigates when optional state-machine props are provided', () => {
    const { getByTestId } = render(
      <RiveBackButton
        testID="back-btn"
        stateMachineName="BackButtonState"
        triggerInputName="tap"
      />,
    );

    fireEvent.press(getByTestId('back-btn'));

    expect(mockBack).toHaveBeenCalled();
  });
});
