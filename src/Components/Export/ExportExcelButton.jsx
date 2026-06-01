import React from 'react';
import { Download } from 'lucide-react';

const escapeCsvValue = (value) => {
    const normalizedValue = value === null || value === undefined ? '' : String(value);
    return `"${normalizedValue.replace(/"/g, '""')}"`;
};

const buildCsv = (rows, columns) => {
    const headers = columns.map((column) => escapeCsvValue(column.header)).join(',');
    const body = rows.map((row, index) =>
        columns
            .map((column) => {
                const value = typeof column.accessor === 'function' ? column.accessor(row, index) : row[column.accessor];
                return escapeCsvValue(value);
            })
            .join(','),
    );

    return [headers, ...body].join('\r\n');
};

const downloadCsv = ({ rows, columns, fileName }) => {
    const csvContent = `\uFEFF${buildCsv(rows, columns)}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${fileName || 'export'}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

export const ExportExcelButton = ({ rows = [], columns = [], fileName = 'export', className = '', disabled = false }) => {
    const isDisabled = disabled || !rows.length || !columns.length;

    return (
        <button
            type="button"
            onClick={() => downloadCsv({ rows, columns, fileName })}
            disabled={isDisabled}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-black text-emerald-500 transition-all hover:bg-emerald-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
            <Download size={18} />
            <span>Excel Export</span>
        </button>
    );
};
