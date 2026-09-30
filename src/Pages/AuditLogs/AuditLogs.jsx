import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Download, Filter, Search, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getAuditLogFilterOptions, getAuditLogs } from '../../Constant/AuditLogsApi';
import { useNotificationBridge } from '../../Components/Notifications/useNotificationBridge';

const PAGE_SIZE = 25;
const toQuery = (filters, page) => {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), module: 'finance' });
  Object.entries(filters).forEach(([key, value]) => { if (String(value || '').trim()) params.set(key, String(value).trim()); });
  return params.toString();
};
const toOptionsQuery = (filters) => {
  const params = new URLSearchParams();
  if (filters.tenantId) params.set('tenantId', filters.tenantId);
  if (filters.branchId) params.set('branchId', filters.branchId);
  return params.toString();
};

export const AuditLogs = () => {
  const [filters, setFilters] = useState({ tenantId: '', branchId: '', userId: '', action: '', search: '' });
  const [options, setOptions] = useState({ tenants: [], branches: [], users: [], actions: [] });
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useNotificationBridge({ error, success });

  const load = async (page = 1) => {
    setLoading(true); setError('');
    try { const result = await getAuditLogs(toQuery(filters, page)); setItems(result.items || []); setMeta(result.meta || {}); }
    catch (e) { setError(e.message || 'آڈٹ لاگز لوڈ نہیں ہو سکے۔'); }
    finally { setLoading(false); }
  };

  const loadOptions = async (nextFilters = filters) => {
    setOptionsLoading(true);
    try { setOptions(await getAuditLogFilterOptions(toOptionsQuery(nextFilters))); }
    catch (e) { setError(e.message || 'فلٹر کا ڈیٹا لوڈ نہیں ہو سکا۔'); }
    finally { setOptionsLoading(false); }
  };

  useEffect(() => { load(1); loadOptions(); }, []);
  useEffect(() => { loadOptions(); }, [filters.tenantId, filters.branchId]);

  const tenantOptions = useMemo(() => options.tenants.map((item) => ({ value: String(item.id), label: item.name })), [options.tenants]);
  const branchOptions = useMemo(() => options.branches.map((item) => ({ value: String(item.id), label: item.code ? `${item.name} (${item.code})` : item.name })), [options.branches]);
  const userOptions = useMemo(() => options.users.map((item) => ({ value: String(item.id), label: item.username ? `${item.name} (${item.username})` : item.name })), [options.users]);
  const actionOptions = useMemo(() => options.actions.map((item) => ({ value: item, label: item })), [options.actions]);

  const exportExcel = async () => {
    try {
      setLoading(true);
      const first = await getAuditLogs(toQuery(filters, 1));
      const all = [...(first.items || [])];
      for (let page = 2; page <= Number(first.meta?.totalPages || 1); page += 1) {
        const result = await getAuditLogs(toQuery(filters, page));
        all.push(...(result.items || []));
      }
      const rows = [['وقت', 'ٹیننٹ آئی ڈی', 'برانچ', 'صارف', 'کردار', 'کارروائی', 'ریکارڈ کی قسم', 'ریکارڈ آئی ڈی', 'وجہ', 'پرانی تفصیلات', 'نئی تفصیلات'], ...all.map((log) => [log.timestamp, log.tenantId, log.branch?.name || log.branchId, log.actor?.name || log.userId, log.role?.name || log.roleId, log.action, log.recordType, log.recordId, log.newValues?.editReason || '', JSON.stringify(log.previousValues || {}), JSON.stringify(log.newValues || {})])];
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet['!cols'] = rows[0].map((header) => ({ wch: Math.max(String(header).length + 4, 18) }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'مالیاتی آڈٹ لاگز');
      XLSX.writeFile(workbook, 'finance-audit-logs.xlsx');
      setSuccess('فلٹر شدہ مالیاتی آڈٹ لاگز برآمد ہو گئے۔');
    } catch (e) { setError(e.message || 'برآمد نہیں ہو سکا۔'); } finally { setLoading(false); }
  };

  const changeTenant = (tenantId) => setFilters((current) => ({ ...current, tenantId, branchId: '', userId: '', action: '' }));
  const changeBranch = (branchId) => setFilters((current) => ({ ...current, branchId, userId: '', action: '' }));

  return <div dir="rtl" className="min-h-screen bg-[var(--color-bg)] p-4 font-urdu text-[var(--color-text-main)] md:p-6"><div className="mx-auto max-w-7xl space-y-5"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-black text-[var(--color-primary)]">مالیاتی آڈٹ لاگز</h1><p className="text-sm text-[var(--color-text-muted)]">آپ کی اجازت کے مطابق ٹیننٹ اور برانچ کے مالیاتی ریکارڈز</p></div><button onClick={exportExcel} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 font-black text-[var(--color-bg)] disabled:opacity-60"><Download size={18}/>Excel برآمد کریں</button></div><div className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:grid-cols-3 lg:grid-cols-6"><SearchableSelect label="ٹیننٹ" value={filters.tenantId} options={tenantOptions} loading={optionsLoading} onChange={changeTenant}/><SearchableSelect label="برانچ" value={filters.branchId} options={branchOptions} loading={optionsLoading} onChange={changeBranch}/><SearchableSelect label="صارف" value={filters.userId} options={userOptions} loading={optionsLoading} onChange={(userId) => setFilters((current) => ({ ...current, userId }))}/><SearchableSelect label="کارروائی" value={filters.action} options={actionOptions} loading={optionsLoading} onChange={(action) => setFilters((current) => ({ ...current, action }))}/><Field label="تلاش" value={filters.search} onChange={(search) => setFilters((current) => ({ ...current, search }))}/><button onClick={() => load(1)} className="flex h-11 w-full self-end items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-4 font-black text-[var(--color-primary)]"><Filter size={18}/>فلٹر لگائیں</button></div><div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"><table className="w-full min-w-[1100px] text-right text-sm"><thead className="bg-black/20 text-[var(--color-text-muted)]"><tr>{['وقت', 'صارف', 'برانچ', 'کارروائی', 'ریکارڈ', 'وجہ', 'تفصیلات'].map((h) => <th key={h} className="p-4">{h}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan="7" className="p-8 text-center">لوڈ ہو رہا ہے...</td></tr> : items.length ? items.map((log) => <tr key={log.id} className="border-t border-[var(--color-border)]"><td className="p-4">{new Date(log.timestamp).toLocaleString()}</td><td className="p-4">{log.actor?.name || 'سسٹم'}</td><td className="p-4">{log.branch?.name || '---'}</td><td className="p-4 font-bold text-[var(--color-primary)]">{log.action}</td><td className="p-4">{log.recordType} #{log.recordId || '---'}</td><td className="p-4">{log.newValues?.editReason || '---'}</td><td className="p-4"><details><summary className="cursor-pointer text-[var(--color-primary)]">دیکھیں</summary><pre className="mt-2 max-w-md whitespace-pre-wrap text-xs">{JSON.stringify({ old: log.previousValues, new: log.newValues }, null, 2)}</pre></details></td></tr>) : <tr><td colSpan="7" className="p-8 text-center">کوئی مالیاتی آڈٹ لاگ نہیں ملا۔</td></tr>}</tbody></table></div><div className="flex items-center justify-between"><span className="text-sm text-[var(--color-text-muted)]">کل: {meta.totalItems || 0}</span><div className="flex gap-2"><button disabled={loading || Number(meta.currentPage) <= 1} onClick={() => load(Number(meta.currentPage) - 1)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 disabled:opacity-40">پچھلا</button><span className="px-3 py-2">{meta.currentPage || 1} / {meta.totalPages || 1}</span><button disabled={loading || Number(meta.currentPage) >= Number(meta.totalPages || 1)} onClick={() => load(Number(meta.currentPage) + 1)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 disabled:opacity-40">اگلا</button></div></div></div></div>;
};

const Field = ({ label, value, onChange }) => <label className="space-y-1 text-xs font-bold text-[var(--color-text-muted)]"><span>{label}</span><div className="relative"><Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[var(--color-text-muted)]"/><input value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-10 text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"/></div></label>;

const SearchableSelect = ({ label, value, options, loading, onChange }) => {
  const selected = options.find((item) => item.value === String(value));
  const [term, setTerm] = useState(selected?.label || '');
  const [open, setOpen] = useState(false);
  useEffect(() => { setTerm(selected?.label || ''); }, [selected?.label, value]);
  const visibleOptions = options.filter((item) => item.label.toLowerCase().includes(term.toLowerCase()));
  const choose = (item) => { onChange(item.value); setTerm(item.label); setOpen(false); };
  return <label className="relative space-y-1 text-xs font-bold text-[var(--color-text-muted)]"><span>{label}</span><div className="relative"><Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[var(--color-text-muted)]"/><input value={term} onFocus={() => setOpen(true)} onChange={(event) => { setTerm(event.target.value); setOpen(true); if (!event.target.value) onChange(''); }} placeholder={loading ? 'لوڈ ہو رہا ہے...' : `${label} تلاش کریں`} className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-input)] px-10 text-[var(--color-text-main)] outline-none focus:border-[var(--color-primary)]"/>{value ? <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(''); setTerm(''); }} className="absolute left-2 top-2 rounded p-1 text-[var(--color-text-muted)]"><X size={15}/></button> : <ChevronDown className="pointer-events-none absolute left-3 top-3 h-4 w-4"/>}</div>{open ? <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">{visibleOptions.length ? visibleOptions.map((item) => <button type="button" key={item.value} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(item)} className="block w-full px-3 py-2 text-right text-sm hover:bg-[var(--color-input)]">{item.label}</button>) : <div className="px-3 py-3 text-sm">کوئی ریکارڈ نہیں ملا۔</div>}</div> : null}</label>;
};
