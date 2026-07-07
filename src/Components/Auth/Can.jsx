import React from 'react';
import { usePermissions } from '../../Hooks/usePermissions';

const hasAccess = ({ permission, anyPermissions, allPermissions }, guards) => {
  if (permission && !guards.hasPermission(permission)) return false;
  if (anyPermissions?.length && !guards.hasAnyPermission(anyPermissions)) return false;
  if (allPermissions?.length && !guards.hasAllPermissions(allPermissions)) return false;
  return true;
};

const disableChild = (child) => {
  if (!React.isValidElement(child)) return child;

  return React.cloneElement(child, {
    disabled: true,
    'aria-disabled': true,
    onClick: undefined,
    className: child.props.className,
  });
};

export const Can = ({
  permission,
  anyPermissions = [],
  allPermissions = [],
  mode = 'hide',
  fallback = null,
  children,
}) => {
  const guards = usePermissions();
  const allowed = hasAccess({ permission, anyPermissions, allPermissions }, guards);

  if (allowed) return children;
  if (mode === 'disable') return React.Children.map(children, disableChild);
  return fallback;
};

export default Can;
