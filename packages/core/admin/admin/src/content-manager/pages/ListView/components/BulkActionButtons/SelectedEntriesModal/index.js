import React from 'react';

import {
  Box,
  Button,
  Typography,
  ModalLayout,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tbody,
  Tr,
  Td,
} from '@strapi/design-system';
import { useTableContext, Table } from '@strapi/helper-plugin';
import { Check } from '@strapi/icons';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

import InjectionZoneList from '../../../../../components/InjectionZoneList';
import { getTrad } from '../../../../../utils';
import { listViewDomain } from '../../../selectors';
import { Body } from '../../Body';
import ConfirmBulkActionDialog, { confirmDialogsPropTypes } from '../BulkActionDialog';

/* -------------------------------------------------------------------------------------------------
 * ConfirmDialogPublishAll
 * -----------------------------------------------------------------------------------------------*/

const ConfirmDialogPublishAll = ({ isOpen, onToggleDialog, isConfirmButtonLoading, onConfirm }) => {
  const { formatMessage } = useIntl();

  return (
    <ConfirmBulkActionDialog
      isOpen={isOpen}
      onToggleDialog={onToggleDialog}
      dialogBody={
        <>
          <Typography id="confirm-description" textAlign="center">
            {formatMessage({
              id: getTrad('popUpWarning.bodyMessage.contentType.publish.all'),
              defaultMessage: 'Are you sure you want to publish these entries?',
            })}
          </Typography>
          <InjectionZoneList area="contentManager.listView.publishModalAdditionalInfos" />
        </>
      }
      endAction={
        <Button
          onClick={onConfirm}
          variant="secondary"
          startIcon={<Check />}
          loading={isConfirmButtonLoading}
        >
          {formatMessage({
            id: 'app.utils.publish',
            defaultMessage: 'Publish',
          })}
        </Button>
      }
    />
  );
};

ConfirmDialogPublishAll.propTypes = confirmDialogsPropTypes;

/* -------------------------------------------------------------------------------------------------
 * SelectedEntriesTableContent
 * -----------------------------------------------------------------------------------------------*/

const SelectedEntriesTableContent = ({ isPublishing, rowsToDisplay }) => {
  const { selectedEntries } = useTableContext();

  // Get main field from list view layout
  const listViewStore = useSelector(listViewDomain());
  const { mainField } = listViewStore.contentType.settings;
  const shouldDisplayMainField = mainField != null && mainField !== 'id';

  return (
    <Table.Content>
      <Table.Head>
        <Table.HeaderCheckboxCell />
        <Table.HeaderCell fieldSchemaType="number" label="id" name="id" />
        {shouldDisplayMainField && (
          <Table.HeaderCell fieldSchemaType="string" label="name" name="name" />
        )}
      </Table.Head>
      <Tbody>
        {rowsToDisplay.map((entry, index) => {
          return (
            <Tr key={entry.id}>
              <Body.CheckboxDataCell rowId={entry.id} index={index} />
              <Td>
                <Typography>{entry.id}</Typography>
              </Td>
              {shouldDisplayMainField && (
                <Td>
                  <Typography>{entry[mainField]}</Typography>
                </Td>
              )}
              {isPublishing && selectedEntries.includes(entry.id) && <Td>Loading...</Td>}
            </Tr>
          );
        })}
      </Tbody>
    </Table.Content>
  );
};

SelectedEntriesTableContent.defaultProps = {
  isPublishing: false,
  rowsToDisplay: [],
};

SelectedEntriesTableContent.propTypes = {
  isPublishing: PropTypes.bool,
  rowsToDisplay: PropTypes.arrayOf(PropTypes.object),
};

/* -------------------------------------------------------------------------------------------------
 * BoldChunk
 * -----------------------------------------------------------------------------------------------*/

const BoldChunk = (chunks) => <Typography fontWeight="bold">{chunks}</Typography>;

/* -------------------------------------------------------------------------------------------------
 * SelectedEntriesModalContent
 * -----------------------------------------------------------------------------------------------*/

const SelectedEntriesModalContent = ({ onToggle, onConfirmPublishAll }) => {
  const { formatMessage } = useIntl();
  const { selectedEntries, rows } = useTableContext();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isConfirmButtonLoading, setIsConfirmButtonLoading] = React.useState(false);
  const [rowsToDisplay, setRowsToDisplay] = React.useState(rows);

  const toggleDialog = () => setIsDialogOpen((prev) => !prev);

  const removeRowsIncrementally = () => {
    let entryIndex = 0;
    const intervalId = setInterval(() => {
      const entryToRemove = selectedEntries[entryIndex];

      setRowsToDisplay((prev) => prev.filter((row) => row.id !== entryToRemove));

      if (entryIndex === selectedEntries.length - 1) {
        clearInterval(intervalId);
        setIsConfirmButtonLoading(false);
      }

      entryIndex++;
    }, 1500);
  };

  const handleConfirmBulkPublish = async () => {
    try {
      setIsConfirmButtonLoading(true);
      await onConfirmPublishAll(selectedEntries);
      removeRowsIncrementally();
      toggleDialog();
    } catch (error) {
      setIsConfirmButtonLoading(false);
      toggleDialog();
    }
  };

  return (
    <ModalLayout onClose={onToggle} labelledBy="title">
      <ModalHeader>
        <Typography fontWeight="bold" textColor="neutral800" as="h2" id="title">
          {formatMessage({
            id: getTrad('containers.ListPage.selectedEntriesModal.title'),
            defaultMessage: 'Publish entries',
          })}
        </Typography>
      </ModalHeader>
      <ModalBody>
        <Typography>
          {formatMessage(
            {
              id: getTrad('containers.ListPage.selectedEntriesModal.selectedCount'),
              defaultMessage:
                '<b>{count}</b> {count, plural, =0 {entries} one {entry} other {entries}} selected',
            },
            {
              count: selectedEntries.length,
              b: BoldChunk,
            }
          )}
        </Typography>
        <Box marginTop={5}>
          <SelectedEntriesTableContent
            isPublishing={isConfirmButtonLoading}
            rowsToDisplay={rowsToDisplay}
          />
        </Box>
      </ModalBody>
      <ModalFooter
        startActions={
          <Button onClick={onToggle} variant="tertiary">
            {formatMessage({
              id: 'app.components.Button.cancel',
              defaultMessage: 'Cancel',
            })}
          </Button>
        }
        endActions={
          <Button
            onClick={() => toggleDialog()}
            loading={isConfirmButtonLoading}
            disabled={selectedEntries.length === 0}
          >
            {formatMessage({ id: 'app.utils.publish', defaultMessage: 'Publish' })}
          </Button>
        }
      />
      <ConfirmDialogPublishAll
        isOpen={isDialogOpen}
        onToggleDialog={toggleDialog}
        isConfirmButtonLoading={isConfirmButtonLoading}
        onConfirm={handleConfirmBulkPublish}
      />
    </ModalLayout>
  );
};

SelectedEntriesModalContent.propTypes = {
  onToggle: PropTypes.func.isRequired,
  onConfirmPublishAll: PropTypes.func.isRequired,
};

/* -------------------------------------------------------------------------------------------------
 * SelectedEntriesModal
 * -----------------------------------------------------------------------------------------------*/

const SelectedEntriesModal = ({ onToggle, onConfirmPublishAll }) => {
  const { rows, selectedEntries } = useTableContext();

  const entries = rows.filter((row) => {
    return selectedEntries.includes(row.id);
  });

  return (
    <Table.Root rows={entries} defaultSelectedEntries={selectedEntries} colCount={4}>
      <SelectedEntriesModalContent onToggle={onToggle} onConfirmPublishAll={onConfirmPublishAll} />
    </Table.Root>
  );
};

SelectedEntriesModal.propTypes = {
  onToggle: PropTypes.func.isRequired,
  onConfirmPublishAll: PropTypes.func.isRequired,
};

export default SelectedEntriesModal;
