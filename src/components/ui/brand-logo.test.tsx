/* eslint-disable testing-library/prefer-screen-queries */
import { render } from '@testing-library/react-native';
import * as React from 'react';

import { BrandLogo } from './brand-logo';

describe('brandLogo', () => {
  it('renders Rive player', () => {
    const { getByTestId } = render(<BrandLogo />);
    expect(getByTestId('brand-logo-rive')).toBeTruthy();
  });
});
