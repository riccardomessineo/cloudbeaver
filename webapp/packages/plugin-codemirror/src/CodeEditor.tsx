/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';
import styled, { use } from 'reshadow';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/htmlembedded/htmlembedded';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/meta';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/hint/show-hint.css';

import { useStyles } from '@cloudbeaver/core-theming';

import type { ICodeEditorProps } from './ICodeEditorProps';
import { SqlEditorStyles } from './theme';

export const CodeEditor = observer<ICodeEditorProps>(function CodeEditor(props) {
  const { readonly, className, editorDidMount } = props;

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [editorRef, setEditorRef] = useState<CodeMirror.Editor | null>(null);

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

  const handleMount = useCallback((editor: CodeMirror.Editor, value: string, cb: () => void) => {
    setEditorRef(editor);

    if (editorDidMount) {
      editorDidMount(editor, value, cb);
    }
  }, [editorDidMount]);

  return styled(useStyles(SqlEditorStyles))(
    <code-editor ref={wrapperRef} {...use({ readonly })} className={className}>
      <CodeMirror {...props} editorDidMount={handleMount} />
    </code-editor>
  );
});
