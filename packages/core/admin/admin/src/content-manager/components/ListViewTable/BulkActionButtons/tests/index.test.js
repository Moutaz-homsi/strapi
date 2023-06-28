import React from 'react';

import { lightTheme, ThemeProvider } from '@strapi/design-system';
import { Table, useTableContext } from '@strapi/helper-plugin';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { IntlProvider } from 'react-intl';
import { Router } from 'react-router-dom';

import BulkActionButtons from '../index';

jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  useTracking: () => ({
    trackUsage: jest.fn(),
  }),
  useTableContext: jest.fn(() => ({
    selectedEntries: [1, 2],
    setSelectedEntries: jest.fn(),
  })),
}));

jest.mock('react-redux', () => ({
  useSelector() {
    return {
      data: [
        { id: 1, publishedAt: null },
        { id: 2, publishedAt: '2023-01-01T10:10:10.408Z' },
      ],
      contentType: {
        settings: {
          mainField: 'name',
        },
      },
    };
  },
}));

jest.mock('../../../../../shared/hooks', () => ({
  ...jest.requireActual('../../../../../shared/hooks'),
  useInjectionZone: () => [],
}));

jest.mock('../SelectedEntriesModal', () => () => <div>SelectedEntriesModal</div>);

const user = userEvent.setup();
const history = createMemoryHistory();

const setup = (props) =>
  render(
    <ThemeProvider theme={lightTheme}>
      <IntlProvider locale="en" messages={{}} defaultLocale="en">
        <Router history={history}>
          <Table.Root>
            <BulkActionButtons {...props} />
          </Table.Root>
        </Router>
      </IntlProvider>
    </ThemeProvider>
  );

describe('BulkActionsBar', () => {
  it('should render publish buttons if showPublish is true', () => {
    setup({ showPublish: true });

    expect(screen.getByRole('button', { name: /\bPublish\b/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\bUnpublish\b/ })).toBeInTheDocument();
  });

  it('should not render publish buttons if showPublish is false', () => {
    setup({ showPublish: false });

    expect(screen.queryByRole('button', { name: /\bPublish\b/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\bUnpublish\b/ })).not.toBeInTheDocument();
  });

  it('should render delete button if showDelete is true', () => {
    setup({ showDelete: true });

    expect(screen.getByRole('button', { name: /\bDelete\b/ })).toBeInTheDocument();
  });

  it('should not render delete button if showDelete is false', () => {
    setup({ showDelete: false });

    expect(screen.queryByRole('button', { name: /\bDelete\b/ })).not.toBeInTheDocument();
  });

  it('should show delete modal if delete button is clicked', async () => {
    setup({ showDelete: true });

    await user.click(screen.getByRole('button', { name: /\bDelete\b/ }));

    expect(screen.getByText('Confirmation')).toBeInTheDocument();
  });

  it('should call confirm delete all if confirmation button is clicked', async () => {
    const mockConfirmDeleteAll = jest.fn();

    setup({
      showDelete: true,
      onConfirmDeleteAll: mockConfirmDeleteAll,
    });

    await user.click(screen.getByRole('button', { name: /\bDelete\b/ }));

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /confirm/i }));

    expect(mockConfirmDeleteAll).toHaveBeenCalledWith([1, 2]);
  });

  it('should not show publish button if selected entries are all published', () => {
    useTableContext.mockReturnValueOnce({ selectedEntries: [2] });
    setup({ showPublish: true });

    expect(screen.queryByRole('button', { name: /\bPublish\b/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\bUnpublish\b/ })).toBeInTheDocument();
  });

  it('should not show unpublish button if selected entries are all unpublished', () => {
    useTableContext.mockReturnValueOnce({ selectedEntries: [1] });
    setup({ showPublish: true });

    expect(screen.queryByRole('button', { name: /\bPublish\b/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\bUnpublish\b/ })).not.toBeInTheDocument();
  });

  it('should show publish modal if publish button is clicked', async () => {
    const onConfirmPublishAll = jest.fn();
    setup({ showPublish: true, onConfirmPublishAll });

    await user.click(screen.getByRole('button', { name: /\bpublish\b/i }));

    // Only test that a mock component is rendered. The modal is tested in its own file.
    expect(screen.getByText('SelectedEntriesModal')).toBeInTheDocument();
  });

  it('should show unpublish modal if unpublish button is clicked', async () => {
    const onConfirmUnpublishAll = jest.fn();
    setup({ showPublish: true, onConfirmUnpublishAll });

    await user.click(screen.getByRole('button', { name: /\bunpublish\b/i }));

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /\bunpublish\b/i })
    );

    expect(onConfirmUnpublishAll).toHaveBeenCalledWith([1, 2]);
  });
});
