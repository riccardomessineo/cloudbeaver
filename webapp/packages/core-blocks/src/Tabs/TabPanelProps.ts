/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TabStateReturn } from 'reakit/Tab';

export interface TabPanelProps {
  tabId: string;
  className?: string;
  children?: React.ReactNode | ((state: TabStateReturn) => React.ReactNode);
  lazy?: boolean;
}