import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export const MultipleEntryRows = ({
    rows,
    renderFields,
    onAdd,
    onRemove,
    addLabel = 'نئی قطار شامل کریں',
    removeLabel = 'قطار حذف کریں',
    helperText = '',
    disabled = false,
    RemoveIcon = Trash2,
    rowClassName = 'grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-start',
    actionsClassName = 'flex items-center justify-end gap-2 pt-0 md:pt-8',
    addButtonClassName = 'grid h-12 w-12 place-items-center rounded-xl bg-[#00d094] text-white transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60',
    removeButtonClassName = 'grid h-12 w-12 place-items-center rounded-xl bg-rose-500/10 text-rose-500 transition-all hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60',
    canRemoveRow,
    getRowError,
}) => (
    <>
        {rows.map((row, index) => {
            const rowError = getRowError ? getRowError(row, index) : row.error;
            const canRemove = canRemoveRow ? canRemoveRow(row, index, rows) : rows.length > 1;

            return (
                <div key={row.id} className={rowClassName}>
                    {renderFields(row, index, rowError)}

                    <div className={actionsClassName}>
                        <button
                            type="button"
                            onClick={onAdd}
                            disabled={disabled}
                            className={addButtonClassName}
                            aria-label={addLabel}
                            title={addLabel}
                        >
                            <Plus size={18} />
                        </button>
                        {canRemove ? (
                            <button
                                type="button"
                                onClick={() => onRemove(row.id)}
                                disabled={disabled}
                                className={removeButtonClassName}
                                aria-label={removeLabel}
                                title={removeLabel}
                            >
                                <RemoveIcon size={18} />
                            </button>
                        ) : null}
                    </div>

                    {rowError ? (
                        <p className="mr-2 text-sm font-bold text-rose-500 md:col-span-2">{rowError}</p>
                    ) : index === 0 && helperText ? (
                        <p className="mr-2 text-xs font-bold text-[var(--color-text-muted)] md:col-span-2">{helperText}</p>
                    ) : null}
                </div>
            );
        })}
    </>
);
