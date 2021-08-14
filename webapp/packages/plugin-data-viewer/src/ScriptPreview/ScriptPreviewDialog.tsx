/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useLayoutEffect, useRef, useState } from 'react';
import styled, { css } from 'reshadow';

import { Button, useClipboard } from '@cloudbeaver/core-blocks';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';
import { SQLCodeEditorLoader } from '@cloudbeaver/plugin-sql-editor';

const styles = css`
  CommonDialogWrapper {
    min-height: 400px;
    min-width: 500px;
  }
  wrapper {
    display: flex;
    align-items: center;
    height: 100%;
    width: 100%;
    overflow: auto;
  }
  SQLCodeEditorLoader {
    height: 100%;
    width: 100%;
  }
  controls {
    display: flex;
    gap: 24px;
    width: 100%;
    & > Button:first-child {
      margin-right: auto;
    }
  }
`;

interface Payload {
  script: string;
  dialect: SqlDialectInfo | undefined;
}

export const ScriptPreviewDialog: React.FC<DialogComponentProps<Payload>> = observer(function ScriptPreviewDialog({
  rejectDialog,
  resolveDialog,
  payload,
}) {
  const translate = useTranslate();
  const copy = useClipboard();

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [editorRef, setEditorRef] = useState<CodeMirror.Editor | null>(null);

  // Dirty. We need to run Editor.refresh when we are sure that Editor is mounted and takes as much space as it needs
  useLayoutEffect(() => {
    const observable = wrapperRef.current;
    if (!editorRef || !observable) {
      return;
    }

    const refresh = () => {
      editorRef.refresh();
    };

    const observer = new ResizeObserver(refresh);

    observer.observe(observable);

    return () => observer.unobserve(observable);
  }, [editorRef]);

  return styled(styles)(
    <CommonDialogWrapper
      title={translate('data_viewer_script_preview_dialog_title')}
      icon='sql-script'
      footer={(
        <controls>
          <Button mod={['unelevated']} onClick={() => resolveDialog()}>{translate('ui_apply')}</Button>
          <Button mod={['outlined']} onClick={() => copy(payload.script, true)}>{translate('ui_copy_to_clipboard')}</Button>
          <Button mod={['unelevated']} onClick={rejectDialog}>{translate('ui_close')}</Button>
        </controls>
      )}
      onReject={rejectDialog}
    >
      <wrapper ref={wrapperRef} as='div'>
        <SQLCodeEditorLoader
          bindings={{
            autoCursor: false,
            editorDidMount: setEditorRef,
            options: {
              lineWrapping: false,
            },
          }}
          value={payload.script}
          dialect={payload.dialect}
          readonly
        />
      </wrapper>
    </CommonDialogWrapper>
  );
});
