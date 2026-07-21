import React, { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { getBranches } from '../Constant/AcademicSetupApi';
import {
  ADMIN_SESSION_UPDATED_EVENT,
  canUseTenantBranchContext,
  getAdminSession,
  getSelectedBranchContext,
  setSelectedBranchContext,
} from '../Constant/AdminAuth';

const isMainBranch = (branch) => {
  const name = String(branch?.name || '').trim().toLowerCase();
  const code = String(branch?.code || '').trim().toLowerCase();
  return name === 'main branch' || name === 'main campus' || code === 'main' || code === 'mc-01';
};

export const BranchContextSelector = () => {
  const [session, setSession] = useState(() => getAdminSession());
  const hasFixedBranch = Boolean(session?.admin?.branchId || session?.user?.branchId);
  const accountScope = String(session?.admin?.accountScope || session?.admin?.userType || session?.user?.accountScope || session?.user?.userType || '').toLowerCase();
  const canUseBranchFilter = canUseTenantBranchContext(session) && !hasFixedBranch && !accountScope.startsWith('branch');
  const selectedContext = getSelectedBranchContext(session);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(selectedContext.branchId || '');
  const [loading, setLoading] = useState(canUseBranchFilter);

  useEffect(() => {
    const syncSession = () => setSession(getAdminSession());
    window.addEventListener(ADMIN_SESSION_UPDATED_EVENT, syncSession);
    return () => window.removeEventListener(ADMIN_SESSION_UPDATED_EVENT, syncSession);
  }, []);

  useEffect(() => {
    if (!canUseBranchFilter) return undefined;

    let isMounted = true;
    getBranches('page=1&limit=100&status=active')
      .then((result) => {
        if (!isMounted) return;

        const items = Array.isArray(result?.items) ? result.items : [];
        setBranches(items);

        const currentBranchId = getSelectedBranchContext(getAdminSession()).branchId;
        const selectedStillActive = currentBranchId && items.some((branch) => Number(branch.id) === Number(currentBranchId));

        if (currentBranchId && !selectedStillActive) {
          setSelectedBranchContext(null, getAdminSession());
          setSelectedBranchId('');
          return;
        }

        setSelectedBranchId(currentBranchId || '');
      })
      .catch(() => {
        setBranches([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [canUseBranchFilter]);

  const sortedBranches = useMemo(() => {
    const mainBranch = branches.find(isMainBranch);
    const others = branches.filter((branch) => Number(branch.id) !== Number(mainBranch?.id));
    return mainBranch ? [mainBranch, ...others] : others;
  }, [branches]);

  if (!canUseBranchFilter) return null;

  const handleChange = (event) => {
    const nextValue = event.target.value;
    const normalizedValue = nextValue ? Number(nextValue) : null;

    if ((selectedBranchId || '') === (nextValue || '')) return;

    setSelectedBranchId(nextValue);
    setSelectedBranchContext(normalizedValue, getAdminSession());
    window.location.reload();
  };

  return (
    <div className="mb-5 flex justify-end">
      <div className="relative w-full max-w-xs">
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-themeMuted">
          <Building2 size={18} />
        </div>
        <select
          id="tenant-branch-context"
          value={selectedBranchId}
          onChange={handleChange}
          disabled={loading}
          aria-busy={loading}
          className="w-full appearance-none rounded-2xl border border-themeBorder bg-themeSurface py-3 pl-11 pr-12 text-right text-sm font-bold text-themeText outline-none transition-colors focus:border-themePrimary disabled:cursor-not-allowed disabled:opacity-70"
          aria-label="برانچ فلٹر"
        >
          <option value="">{loading ? 'برانچز لوڈ ہو رہی ہیں...' : 'مین ٹیننٹ'}</option>
          {sortedBranches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {isMainBranch(branch) ? `مرکزی برانچ - ${branch.name}` : branch.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-themeMuted">
          <ChevronDown size={18} />
        </div>
      </div>
    </div>
  );
};
