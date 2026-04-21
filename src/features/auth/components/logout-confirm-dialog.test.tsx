/* eslint-disable testing-library/prefer-screen-queries */
import { fireEvent, render } from '@testing-library/react-native';
import * as React from 'react';
import { Modal } from 'react-native';

import { LogoutConfirmDialog } from './logout-confirm-dialog';

describe('logoutConfirmDialog', () => {
  it('renders nothing when closed', () => {
    const { queryByTestId } = render(
      <LogoutConfirmDialog visible={false} onCancel={jest.fn()} onConfirm={jest.fn()} />,
    );

    expect(queryByTestId('logout-dialog')).toBeNull();
  });

  it('calls onConfirm when confirm pressed', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <LogoutConfirmDialog visible onCancel={onCancel} onConfirm={onConfirm} />,
    );

    fireEvent.press(getByTestId('logout-dialog-confirm'));

    expect(onConfirm).toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel pressed without confirming', () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <LogoutConfirmDialog visible onCancel={onCancel} onConfirm={onConfirm} />,
    );

    fireEvent.press(getByTestId('logout-dialog-cancel'));

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onCancel when Android back triggers onRequestClose', () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    const { UNSAFE_getByType } = render(
      <LogoutConfirmDialog visible onCancel={onCancel} onConfirm={onConfirm} />,
    );

    const modal = UNSAFE_getByType(Modal);
    modal.props.onRequestClose();

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
