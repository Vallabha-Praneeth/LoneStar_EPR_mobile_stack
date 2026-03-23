import * as React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { Badge } from './badge';

afterEach(cleanup);

describe('badge component', () => {
  it('renders the label text', () => {
    render(<Badge label="Active" />);
    expect(screen.getByText('Active')).toBeOnTheScreen();
  });

  it('forwards testID to the root View', () => {
    render(<Badge label="Active" testID="badge" />);
    expect(screen.getByTestId('badge')).toBeOnTheScreen();
  });

  it('applies default variant container class', () => {
    render(<Badge label="Active" testID="badge" />);
    expect(screen.getByTestId('badge').props.className).toContain('bg-neutral-100');
  });

  it('applies success variant container class', () => {
    render(<Badge label="Active" variant="success" testID="badge" />);
    expect(screen.getByTestId('badge').props.className).toContain('bg-success-100');
  });

  it('merges custom className onto the root container', () => {
    render(<Badge label="Active" testID="badge" className="mt-2" />);
    const el = screen.getByTestId('badge');
    expect(el.props.className).toContain('rounded-full'); // base preserved
    expect(el.props.className).toContain('mt-2'); // override merged
  });

  it('merges labelClassName onto the Text node', () => {
    render(<Badge label="Active" testID="badge" labelClassName="uppercase" />);
    const label = screen.getByText('Active');
    expect(label.props.className).toContain('text-xs'); // base preserved
    expect(label.props.className).toContain('uppercase'); // override merged
  });
});
