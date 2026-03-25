import * as React from 'react';
import { Text } from 'react-native';

import { cleanup, render, screen } from '@/lib/test-utils';

import { Card } from './card';

afterEach(cleanup);

describe('card component', () => {
  it('renders children', () => {
    render(
      <Card testID="card">
        <Text>Hello</Text>
      </Card>,
    );
    expect(screen.getByText('Hello')).toBeOnTheScreen();
  });

  it('forwards testID to the underlying View', () => {
    render(<Card testID="card" />);
    expect(screen.getByTestId('card')).toBeOnTheScreen();
  });

  it('merges custom className with the base card classes', () => {
    render(<Card testID="card" className="mx-4" />);
    const el = screen.getByTestId('card');
    expect(el.props.className).toContain('rounded-2xl'); // base class preserved
    expect(el.props.className).toContain('mx-4'); // custom class merged in
  });

  it('passes through ViewProps to the underlying View', () => {
    render(<Card testID="card" accessible={false} />);
    expect(screen.getByTestId('card').props.accessible).toBe(false);
  });
});
