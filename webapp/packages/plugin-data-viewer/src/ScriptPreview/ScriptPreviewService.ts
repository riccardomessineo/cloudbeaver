/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, SqlDialectInfo } from '@cloudbeaver/core-sdk';
import { SqlDialectInfoService } from '@cloudbeaver/plugin-sql-editor';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseDataResult } from '../DatabaseDataModel/IDatabaseDataResult';
import { ScriptPreviewDialog } from './ScriptPreviewDialog';

@injectable()
export class ScriptPreviewService {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly commonDialogService: CommonDialogService,
    private readonly sqlDialectInfoService: SqlDialectInfoService,
    private readonly notificationService: NotificationService,
  ) { }

  async open(model: IDatabaseDataModel<any, IDatabaseDataResult>, resultIndex: number): Promise<void> {
    const connectionId = model.source.executionContext?.context?.connectionId;

    let script: string | undefined;
    let dialect: SqlDialectInfo | undefined;

    try {
      const response = await model.source.runTask(() => this.tryGetScript(model, resultIndex));
      script = response.result;
    } catch (exception) {
      this.notificationService.logException(exception, 'data_viewer_script_preview_error_title');
      return;
    }

    if (connectionId) {
      try {
        dialect = await model.source.runTask(() => this.sqlDialectInfoService.loadSqlDialectInfo(connectionId));
      } catch (exception) {
        this.notificationService.logException(exception, undefined, undefined, true);
      }
    }

    if (dialect === undefined) {
      console.warn(`Can't get dialect for connection: '${connectionId}'. Default dialect will be used`);
    }

    const result = await this.commonDialogService.open(ScriptPreviewDialog, {
      script,
      dialect,
    });

    if (result === DialogueStateResult.Resolved) {
      model.source.saveData();
    }
  }

  private async tryGetScript(model: IDatabaseDataModel<any, IDatabaseDataResult>, resultIndex: number) {
    const executionContext = model.source.executionContext;

    if (!executionContext) {
      throw new Error('Execution context is not provided');
    }

    const result = model.source.getResult(resultIndex);

    if (!result) {
      throw new Error(`There is no result for provided result index: '${resultIndex}'`);
    }

    const changes = model.source.editor?.getChanges(true);
    const resultChanges = changes?.find(update => update.resultId === result.id);

    if (!resultChanges) {
      throw new Error(`There are no changes for provided result id: '${result.id}'`);
    }

    return this.graphQLService.sdk.updateResultsDataBatchScript({
      connectionId: executionContext.context!.connectionId,
      contextId: executionContext.context!.id,
      resultsId: resultChanges.resultId,
      updatedRows: Array.from(resultChanges.diff.values()).map(diff => ({
        data: diff.source,
        updateValues: diff.update.reduce((obj, value, index) => {
          if (value !== diff.source[index]) {
            obj[index] = value;
          }
          return obj;
        }, {}),
      })),
    });
  }
}
