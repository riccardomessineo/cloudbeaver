/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { SubmittingForm, useFocus, Button } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { useDBDriver } from '../useDBDriver';
import { ConnectionAuthenticationForm } from './ConnectionAuthenticationForm';

const styles = css`
  CommonDialogWrapper {
    min-height: 400px;
    min-width: 500px;
  }
  SubmittingForm {
    overflow: auto;
    margin: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  ConnectionAuthenticationForm {
    align-content: center;
  }
  Button {
    margin-left: auto;
  }
`;

interface Payload {
  config: ConnectionConfig;
  authModelId: string | null;
  networkHandlers?: string[];
  driverId?: string;
}

export const ConnectionAuthenticationDialog = observer(function ConnectionAuthenticationDialog({
  payload,
  rejectDialog,
  resolveDialog,
}: DialogComponentProps<Payload>) {
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const { driver } = useDBDriver(payload.driverId || '');

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      title={translate('connections_connection_credentials_provisioning')}
      subTitle={translate('connections_connection_credentials_provisioning_description')}
      icon={driver?.icon}
      footer={(
        <Button mod={['unelevated']} onClick={() => resolveDialog()}>
          {translate('ui_apply')}
        </Button>
      )}
      onReject={rejectDialog}
    >
      <SubmittingForm ref={focusedRef} onSubmit={() => resolveDialog()}>
        <ConnectionAuthenticationForm
          config={payload.config}
          authModelId={payload.authModelId}
          networkHandlers={payload.networkHandlers}
          formId={payload.config.connectionId || payload.driverId}
        />
      </SubmittingForm>
    </CommonDialogWrapper>
  );
});
