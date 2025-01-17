/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IDatabaseDataFormatAction } from '../IDatabaseDataFormatAction';
import type { IResultSetElementKey } from './IResultSetElementKey';
import { isResultSetContentValue } from './isResultSetContentValue';
import { ResultSetDataAction } from './ResultSetDataAction';

export type IResultSetValue =
  string | number | boolean | Record<string, string | number | Record<string, any> | null> | null;

@databaseDataAction()
export class ResultSetFormatAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataFormatAction<IResultSetElementKey, IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;

  private data: ResultSetDataAction;

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, result: IDatabaseResultSet) {
    super(source, result);
    this.data = this.getAction(ResultSetDataAction);
  }

  getHeaders(): string[] {
    return this.data.columns.map(column => column.name!).filter(Boolean);
  }

  getLongestCells(offset = 0, count?: number): string[] {
    const rows = this.data.rows.slice(offset, count);
    let cells: string[] = [];

    for (const row of rows) {
      if (cells.length === 0) {
        cells = row.map(v => this.toDisplayString(v));
        continue;
      }

      for (let i = 0; i < row.length; i++) {
        const value = this.toDisplayString(row[i]);

        if (value.length > cells[i].length) {
          cells[i] = value;
        }
      }
    }

    return cells;
  }

  isReadOnly(key: IResultSetElementKey): boolean {
    let columnReadonly = false;
    let cellReadonly = false;

    if (key.column !== undefined) {
      columnReadonly = this.data.getColumn(key.column)?.readOnly || false;
    }

    const value = this.data.getCellValue(key);

    if (isResultSetContentValue(value)) {
      cellReadonly = (
        value.binary !== undefined
        || value.contentLength !== value.text?.length
      );
    } else if (value !== null && typeof value === 'object') {
      cellReadonly = true;
    }

    return columnReadonly || cellReadonly;
  }

  isNull(value: IResultSetValue): boolean {
    return this.get(value) === null;
  }

  get(value: IResultSetValue): IResultSetValue {
    if (value !== null && typeof value === 'object') {
      if ('text' in value) {
        return value.text;
      } else if ('value' in value) {
        return value.value;
      }
      return value;
    }

    return value;
  }

  getText(value: IResultSetValue): string | null {
    value = this.get(value);

    if (value !== null && typeof value === 'object') {
      return JSON.stringify(value);
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return value;
  }

  toDisplayString(value: IResultSetValue): string {
    value = this.getText(value);

    if (typeof value === 'string' && value.length > 1000) {
      return value.split('').map(v => (v.charCodeAt(0) < 32 ? ' ' : v)).join('');
    }

    if (value === null) {
      return '[null]';
    }

    return String(value);
  }
}
