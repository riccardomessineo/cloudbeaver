/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';

type RequireOne<T, K extends keyof T> = {
  [X in Exclude<keyof T, K>]?: T[X]
} & {
  [P in K]-?: T[P]
};

export interface ISQLScriptSegment {
  query: string;

  begin: number;
  end: number;

  from: number; // query begin line
  to: number; // query end line
  fromPosition: number;
  toPosition: number;
}

export interface ISQLScriptLine {
  index: number;
  begin: number;
  end: number;
}

const defaultDialect: RequireOne<
SqlDialectInfo,
'scriptDelimiter' | 'quoteStrings' | 'singleLineComments' | 'multiLineComments'
> = {
  scriptDelimiter: ';',
  quoteStrings: [['"', '"']],
  singleLineComments: ['--'],
  multiLineComments: [['/*', '*/']],
};

export class SQLParser {
  get scriptDelimiters(): string[] {
    return [...this.customScriptDelimiters, this.dialect?.scriptDelimiter || defaultDialect.scriptDelimiter];
  }

  get quoteStrings(): string[][] {
    return [...this.customQuotes, ...(this.dialect?.quoteStrings || defaultDialect.quoteStrings)];
  }

  get singleLineComments(): string[] {
    return this.dialect?.singleLineComments || defaultDialect.singleLineComments;
  }

  get multiLineComments(): string[][] {
    return this.dialect?.multiLineComments || defaultDialect.multiLineComments;
  }

  get scripts(): ISQLScriptSegment[] {
    this.update();
    return this._scripts;
  }

  get lineCount(): number {
    this.update();
    return this.lines.length;
  }

  private dialect: SqlDialectInfo | null;
  private _scripts: ISQLScriptSegment[];
  private script: string;
  private parsedScript: string;
  private lines: ISQLScriptLine[];
  private customScriptDelimiters: string[];
  private customQuotes: string[][];

  constructor() {
    this.dialect = null;
    this._scripts = [];
    this.script = '';
    this.parsedScript = '';
    this.lines = [];
    this.customScriptDelimiters = [];
    this.customQuotes = [["'", "'"]];
  }

  getQueryAtPos(position: number): ISQLScriptSegment | undefined {
    this.update();
    const script = this._scripts.find(script => script.begin <= position && script.end > position);

    if (script) {
      return script;
    }

    const line = this.getLineAtPos(position);

    const closestScripts = this._scripts.filter(
      script => script.begin <= position && (script.to === line || script.to === line - 1)
    );

    if (closestScripts.length > 0) {
      return closestScripts[closestScripts.length - 1];
    }

    return undefined;
  }

  getLineAtPos(position: number): number {
    return this.lines.find(line => line.begin <= position && line.end > position)?.index ?? 0;
  }

  getScriptLineAtPos(position: number): ISQLScriptLine | undefined {
    return this.lines.find(line => line.begin <= position && line.end > position);
  }

  setScript(script: string): void {
    this.script = script;
  }

  setDialect(dialect: SqlDialectInfo | null): void {
    this.dialect = dialect;
    this.parsedScript = '';
  }

  setCustomDelimiters(delimiters: string[]): void {
    this.customScriptDelimiters = delimiters;
  }

  parse(script: string): void {
    this._scripts = [];
    this.parsedScript = script;
    this.lines = [];

    let ignore = false;
    let releaseChar = '';
    let currentSegment = '';

    let position = 0;

    let begin = 0;
    for (const line of script.split('\n')) {
      const end = begin + line.length + 1;

      this.lines.push({
        index: this.lines.length,
        begin,
        end,
      });

      begin = end;
    }

    for (const char of script) {
      currentSegment += char;
      position++;

      if (ignore) {
        if (currentSegment.endsWith(releaseChar)) {
          ignore = false;
        }
        continue;
      }

      for (const scriptDelimiter of this.scriptDelimiters) {
        if (currentSegment.endsWith(scriptDelimiter) || position === script.length) {
          let query = currentSegment;

          if (position !== script.length) {
            query = query.substr(0, query.length - scriptDelimiter.length);
          }

          query = query.trim();

          if (query) {
            const begin = script.indexOf(query, position - currentSegment.length);
            const end = begin + query.length;
            const from = this.getScriptLineAtPos(begin);
            const to = this.getScriptLineAtPos(end);

            if (from && to) {
              this._scripts.push({
                query,
                begin,
                end,
                from: from.index,
                to: to.index,
                fromPosition: begin - from.begin,
                toPosition: end - to.begin,
              });
            }
          }

          currentSegment = '';
          break;
        }
      }

      for (const singleLineComment of this.singleLineComments) {
        if (currentSegment.endsWith(singleLineComment)) {
          ignore = true;
          releaseChar = '\n';
          break;
        }
      }

      if (ignore) {
        continue;
      }

      for (const quote of this.quoteStrings) {
        if (currentSegment.endsWith(getBlockChar(quote, true))) {
          ignore = true;
          releaseChar = getBlockChar(quote, false);
          break;
        }
      }

      if (ignore) {
        continue;
      }

      for (const comment of this.multiLineComments) {
        if (currentSegment.endsWith(getBlockChar(comment, true))) {
          ignore = true;
          releaseChar = getBlockChar(comment, false);
          break;
        }
      }
    }
  }

  private update() {
    if (this.parsedScript !== this.script) {
      this.parse(this.script);
    }
  }
}

function getBlockChar(chars: string[], openChar: boolean) {
  if (chars.length === 1) {
    return chars[0];
  }

  return openChar ? chars[0] : chars[1];
}
