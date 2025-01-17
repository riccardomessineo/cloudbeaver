/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../DatabaseDataAction';
import type { IDatabaseDataResult } from '../IDatabaseDataResult';
import type { IDatabaseDataSource } from '../IDatabaseDataSource';
import { databaseDataAction } from './DatabaseDataActionDecorator';
import type { IDatabaseDataEditAction, IDatabaseDataEditActionData } from './IDatabaseDataEditAction';

@databaseDataAction()
export abstract class DatabaseEditAction<TKey, TValue, TResult extends IDatabaseDataResult>
  extends DatabaseDataAction<any, TResult>
  implements IDatabaseDataEditAction<TKey, TValue, TResult> {
  static dataFormat: ResultDataFormat | null = null;

  readonly action: IExecutor<IDatabaseDataEditActionData<TKey, TValue>>;

  constructor(source: IDatabaseDataSource<any, TResult>, result: TResult) {
    super(source, result);
    this.action = new Executor();
  }

  abstract isEdited(): boolean;
  abstract isElementEdited(key: TKey): boolean;
  abstract set(key: TKey, value: TValue): void;
  abstract get(key: TKey): TValue | undefined;
  abstract revert(key: TKey): void;
  abstract clear(): void;
}
