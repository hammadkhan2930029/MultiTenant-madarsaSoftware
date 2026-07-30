import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileText } from 'lucide-react';

export const ExportPdfButton = ({ rows = [], columns = [], fileName = 'export', title = 'Export', className = '' }) => {
    const handleExport = async () => {
        const exportContainer = document.createElement('div');
        exportContainer.dir = 'rtl';
        exportContainer.style.cssText = 'position:fixed;left:-10000px;top:0;width:1400px;padding:32px;background:#fff;color:#111;font-family:Arial,sans-serif;';

        const heading = document.createElement('h1');
        heading.textContent = title;
        heading.style.cssText = 'margin:0 0 24px;text-align:center;font-size:24px;';
        exportContainer.appendChild(heading);

        const table = document.createElement('table');
        table.style.cssText = 'width:100%;border-collapse:collapse;font-size:14px;';
        const headerRow = table.insertRow();
        columns.forEach((column) => {
            const cell = document.createElement('th');
            cell.textContent = column.header;
            cell.style.cssText = 'border:1px solid #bbb;padding:10px;background:#eee;text-align:right;';
            headerRow.appendChild(cell);
        });

        rows.forEach((row, rowIndex) => {
            const tableRow = table.insertRow();
            columns.forEach((column) => {
                const value = typeof column.accessor === 'function' ? column.accessor(row, rowIndex) : row[column.accessor];
                const cell = tableRow.insertCell();
                cell.textContent = value ?? '';
                cell.style.cssText = 'border:1px solid #ccc;padding:9px;text-align:right;';
            });
        });
        exportContainer.appendChild(table);
        document.body.appendChild(exportContainer);

        const canvas = await html2canvas(exportContainer, { scale: 1.5, backgroundColor: '#ffffff' });
        exportContainer.remove();

        const pdf = new jsPDF({ orientation: 'landscape' });
        const image = canvas.toDataURL('image/png');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imageWidth = pageWidth - 16;
        const imageHeight = (canvas.height * imageWidth) / canvas.width;

        let remainingHeight = imageHeight;
        let offset = 8;
        pdf.addImage(image, 'PNG', 8, offset, imageWidth, imageHeight);
        remainingHeight -= pageHeight - 16;

        while (remainingHeight > 0) {
            offset -= pageHeight - 16;
            pdf.addPage();
            pdf.addImage(image, 'PNG', 8, offset, imageWidth, imageHeight);
            remainingHeight -= pageHeight - 16;
        }

        pdf.save(`${fileName}.pdf`);
    };

    return (
        <button
            type="button"
            onClick={handleExport}
            disabled={!rows.length || !columns.length}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-3 text-sm font-black text-rose-500 transition-all hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
            <FileText size={18} />
            <span>PDF Export</span>
        </button>
    );
};
