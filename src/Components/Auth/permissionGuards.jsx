import React from 'react';
import { RequirePermission } from './RequirePermission';

export const withPermission = (element, permission) => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
);
