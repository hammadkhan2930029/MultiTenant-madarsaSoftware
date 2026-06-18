import React from 'react';
import { hasAllPermissions, hasAnyPermission, hasPermission } from '../../Constant/AdminAuth';

const UnauthorizedMessage = () => (
  <div className="min-h-[60vh] flex items-center justify-center px-4" dir="rtl">
    <div
      className="w-full max-w-2xl rounded-2xl border p-8 text-center shadow-[0_20px_45px_-25px_rgba(15,23,42,0.35)]"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-main)',
      }}
      role="alert"
    >
      <div
        className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border"
        style={{
          backgroundColor: 'var(--color-bg)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-primary)',
        }}
      >
        <span className="text-2xl font-black leading-none">!</span>
      </div>
      <p className="text-xl font-black leading-loose">
        آپ کو اس صفحے تک رسائی کی اجازت نہیں ہے
      </p>
    </div>
  </div>
);

export const RequirePermission = ({ permission, anyPermissions, allPermissions, children }) => {
  const allowed =
    (permission ? hasPermission(permission) : true) &&
    (anyPermissions ? hasAnyPermission(anyPermissions) : true) &&
    (allPermissions ? hasAllPermissions(allPermissions) : true);

  if (!allowed) {
    return <UnauthorizedMessage />;
  }

  return children;
};

export const withPermission = (element, permission) => (
  <RequirePermission permission={permission}>{element}</RequirePermission>
);
