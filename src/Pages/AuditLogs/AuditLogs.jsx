import React, { useEffect, useState } from 'react';
import { Download, Filter, Search } from 'lucide-react';
import { getAuditLogs } from '../../Constant/AuditLogsApi';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';

const PAGE_SIZE = 25;
const toQuery = (filters, page) => {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), module: 'finance' });
  Object.entries(filters).forEach(([key, value]) => { if (String(value || '').trim()) params.set(key, String(value).trim()); });
  return params.toString();
};
const csv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

export const AuditLogs = () => {
  const [filters, setFilters] = useState({ tenantId: '', branchId: '', userId: '', action: '', search: '' });
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useNotificationBridge({ error, success });
  const load = async (page = 1) => {
    setLoading(true); setError('');
    try { const result = await getAuditLogs(toQuery(filters, page)); setItems(result.items || []); setMeta(result.meta || {}); }
    catch (e) { setError(e.message || 'Audit logs load nahin ho sake.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(1); }, []);
  const exportCsv = async () => {
    try {
      setLoading(true); const first = await getAuditLogs(toQuery(filters, 1)); const all = [...(first.items || [])];
      for (let page = 2; page <= Number(first.meta?.totalPages || 1); page += 1) { const result = await getAuditLogs(toQuery(filters, page)); all.push(...(result.items || [])); }
      const rows = [['Time', 'Tenant ID', 'Branch', 'User', 'Role', 'Action', 'Record Type', 'Record ID', 'Reason', 'Old Values', 'New Values'], ...all.map((log) => [log.timestamp, log.tenantId, log.branch?.name || log.branchId, log.actor?.name || log.userId, log.role?.name || log.roleId, log.action, log.recordType, log.recordId, log.newValues?.editReason || '', JSON.stringify(log.previousValues || {}), JSON.stringify(log.newValues || {})])];
      const blob = new Blob([rows.map((row) => row.map(csv).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'finance-audit-logs.csv'; link.click(); URL.revokeObjectURL(url); setSuccess('Filtered finance audit logs export ho gaye.');
    } catch (e) { setError(e.message || 'Export nahin ho saka.'); } finally { setLoading(false); }
  };
  return <div dir="rtl" className="min-h-screen bg-[var(--color-bg)] p-4 font-urdu text-[var(--color-text-main)] md:p-6"><div className="mx-auto max-w-7xl space-y-5"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-black text-[var(--color-primary)]">مالیاتی آڈٹ لاگز</h1><p className="text-sm text-[var(--color-text-muted)]">آپ کی اجازت کے مطابق tenant اور branch کے مالیاتی records</p></div><button onClick={exportCsv} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 font-black text-[var(--color-bg)] disabled:opacity-60"><Download size={18}/>Export CSV</button></div><div className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:grid-cols-3 lg:grid-cols-6"><Field label="Tenant ID" value={filters.tenantId} onChange={(v) => setFilters({ ...filters, tenantId: v })}/><Field label="Branch ID" value={filters.branchId} onChange={(v) => setFilters({ ...filters, branchId: v })}/><Field label="User ID" value={filters.userId} onChange={(v) => setFilters({ ...filters, userId: v })}/><Field label="Action" value={filters.action} onChange={(v) => setFilters({ ...filters, action: v })}/><Field label="Search" value={filters.search} onChange={(v) => setFilters({ ...filters, search: v })}/><button onClick={() => load(1)} className="flex items-end justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 py-3 font-black text-[var(--color-primary)]"><Filter size={18}/>Filter</button></div><div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"><table className="w-full min-w-[1100px] text-right text-sm"><thead className="bg-black/20 text-[var(--color-text-muted)]"><tr>{['وقت','User','Branch','Action','Record','Reason','تفصیل'].map((h) => <th key={h} className="p-4">{h}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan="7" className="p-8 text-center">Loading...</td></tr> : items.length ? items.map((log) => <tr key={log.id} className="border-t border-[var(--color-border)]"><td className="p-4">{new Date(log.timestamp).toLocaleString()}</td><td className="p-4">{log.actor?.name || 'System'}</td><td className="p-4">{log.branch?.name || '---'}</td><td className="p-4 font-bold text-[var(--color-primary)]">{log.action}</td><td className="p-4">{log.recordType} #{log.recordId || '---'}</td><td className="p-4">{log.newValues?.editReason || '---'}</td><td className="p-4"><details><summary className="cursor-pointer text-[var(--color-primary)]">دیکھیں</summary><pre className="mt-2 max-w-md whitespace-pre-wrap text-xs">{JSON.stringify({ old: log.previousValues, new: log.newValues }, null, 2)}</pre></details></td></tr>) : <tr><td colSpan="7" className="p-8 text-center">Koi finance audit log nahin mila.</td></tr>}</tbody></table></div><div className="flex items-center justify-between"><span className="text-sm text-[var(--color-text-muted)]">Total: {meta.totalItems || 0}</span><div className="flex gap-2"><button disabled={loading || Number(meta.currentPage) <= 1} onClick={() => load(Number(meta.currentPage) - 1)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 disabled:opacity-40">Pichla</button><span className="px-3 py-2">{meta.currentPage || 1} / {meta.totalPages || 1}</span><button disabled={loading || Number(meta.currentPage) >= Number(meta.totalPages || 1)} onClick={() => load(Number(meta.currentPage) + 1)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 disabled:opacity-40">Agla</button></div></div></div></div>;
};
const Field = ({ label, value, onChange }) => <label className="space-y-1 text-xs font-bold text-[var(--color-text-muted)]"><span>{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-3 text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"/></label>;
