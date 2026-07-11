import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];
const MONTHS = [
  'جنوری',
  'فروری',
  'مارچ',
  'اپریل',
  'مئی',
  'جون',
  'جولائی',
  'اگست',
  'ستمبر',
  'اکتوبر',
  'نومبر',
  'دسمبر',
];

const formatDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value) => {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const isSameDate = (first, second) =>
  first &&
  second &&
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const isDateBlocked = (date, min, max) => {
  const value = formatDateValue(date);
  if (min && value < min) return true;
  if (max && value > max) return true;
  return false;
};

export const ThemedDatePicker = ({
  value = '',
  onChange,
  label,
  name,
  placeholder = 'تاریخ منتخب کریں',
  min,
  max,
  className = '',
  size = 'md',
  required = false,
}) => {
  const wrapperRef = useRef(null);
  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());
  const [panelStyle, setPanelStyle] = useState({ right: 0 });
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let year = currentYear + 10; year >= currentYear - 100; year -= 1) {
      years.push(year);
    }
    return years;
  }, [currentYear]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
  const startOffset = monthStart.getDay();

  const calendarDays = [];

  for (let i = 0; i < startOffset; i += 1) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    calendarDays.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
  }

  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  const emitChange = (nextValue) => {
    if (onChange) {
      onChange(nextValue);
    }
  };

  const handleSelectDate = (date) => {
    if (isDateBlocked(date, min, max)) return;
    emitChange(formatDateValue(date));
    setIsOpen(false);
  };

  const handleMonthChange = (event) => {
    const nextMonth = Number(event.target.value);
    setViewDate(new Date(viewDate.getFullYear(), nextMonth, 1));
  };

  const handleYearChange = (event) => {
    const nextYear = Number(event.target.value);
    setViewDate(new Date(nextYear, viewDate.getMonth(), 1));
  };

  const openCalendar = () => {
    const wrapper = wrapperRef.current;
    const viewportWidth = window.innerWidth;
    const desiredWidth = Math.min(size === 'sm' ? 280 : 320, viewportWidth - 24);

    if (wrapper) {
      const rect = wrapper.getBoundingClientRect();
      const overflowLeft = rect.right - desiredWidth < 12;
      const overflowRight = rect.left + desiredWidth > viewportWidth - 12;

      if (overflowLeft && overflowRight) {
        setPanelStyle({
          left: '50%',
          right: 'auto',
          transform: 'translateX(-50%)',
          width: `${desiredWidth}px`,
        });
      } else if (overflowLeft) {
        setPanelStyle({
          left: 0,
          right: 'auto',
          transform: 'none',
          width: `${desiredWidth}px`,
        });
      } else {
        setPanelStyle({
          right: 0,
          left: 'auto',
          transform: 'none',
          width: `${desiredWidth}px`,
        });
      }
    }

    setViewDate(selectedDate || new Date());
    setIsOpen(true);
  };

  const displayValue = selectedDate
    ? `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]}، ${selectedDate.getFullYear()}`
    : placeholder;
  const buttonDisplayValue = size === 'sm' && selectedDate
    ? `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`
    : displayValue;

  const buttonSizeClass = size === 'sm' ? 'px-3 py-3 rounded-xl text-xs min-h-[56px]' : 'p-4 rounded-2xl';
  const buttonIconSize = size === 'sm' ? 16 : 18;
  const isCompact = size === 'sm';
  const panelClass = isCompact
    ? 'themed-date-picker-panel themed-date-picker-panel-sm absolute top-full z-[80] mt-2 max-w-[calc(100vw-24px)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-3'
    : 'themed-date-picker-panel absolute top-full z-[80] mt-2 max-w-[calc(100vw-24px)] rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl p-4';
  const navButtonClass = isCompact
    ? 'w-8 h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-main)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center'
    : 'w-10 h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-main)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center';
  const selectClass = isCompact
    ? 'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-2 text-xs font-bold text-[var(--color-text-main)] outline-none'
    : 'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5 text-sm font-bold text-[var(--color-text-main)] outline-none';
  const dayCellClass = isCompact ? 'h-8 rounded-lg text-xs' : 'h-10 rounded-xl text-sm';
  const emptyDayClass = isCompact ? 'h-8' : 'h-10';
  const panelGapClass = isCompact ? 'gap-1.5' : 'gap-2';
  const footerButtonClass = isCompact ? 'flex-1 py-2 rounded-lg font-bold text-xs' : 'flex-1 py-2.5 rounded-xl font-bold text-sm';

  return (
    <div ref={wrapperRef} className={`themed-date-picker space-y-2 relative ${className}`}>
      <style>{`
        .themed-date-picker-panel,
        .themed-date-picker-panel * {
          box-sizing: border-box;
        }

        .themed-date-picker-panel {
          color: var(--color-text-main);
          direction: rtl;
          font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif !important;
          line-height: 1.35 !important;
        }

        .themed-date-picker-panel-sm {
          min-width: 336px;
        }

        .themed-date-picker-panel p,
        .themed-date-picker-panel span,
        .themed-date-picker-panel button,
        .themed-date-picker-panel select {
          font-size: 13px !important;
          line-height: 1.35 !important;
        }

        .themed-date-picker-panel > div:first-child p:first-child {
          font-size: 18px !important;
          line-height: 1.45 !important;
        }

        .themed-date-picker-panel > div:first-child p:last-child {
          font-size: 13px !important;
          line-height: 1.35 !important;
        }

        .themed-date-picker-panel select {
          min-height: 44px;
          padding-block: 6px !important;
        }

        .themed-date-picker-panel .grid.grid-cols-7 span {
          display: flex;
          min-height: 28px;
          align-items: center;
          justify-content: center;
          font-size: 12px !important;
          white-space: nowrap;
        }

        .themed-date-picker-panel .grid.grid-cols-7 button {
          min-height: 42px;
          height: 42px;
          border-radius: 12px;
          font-size: 14px !important;
          line-height: 1 !important;
        }

        .themed-date-picker-panel-sm .grid.grid-cols-7 button {
          min-height: 38px;
          height: 38px;
        }

        .themed-date-picker-panel .grid.grid-cols-7 div {
          min-height: 38px;
        }

        .themed-date-picker-panel > div:last-child button {
          min-height: 46px;
          font-size: 15px !important;
        }
      `}</style>
      {label ? (
        <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">
          {label}{required ? <span className="text-red-500"> *</span> : null}
        </label>
      ) : null}

      <button
        type="button"
        name={name}
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }
          openCalendar();
        }}
        className={`w-full min-w-0 border bg-[var(--color-input)] border-transparent outline-none font-bold transition-all focus:border-[var(--color-primary)] focus:ring-4 focus:ring-emerald-500/10 flex items-center justify-between gap-2 text-right ${buttonSizeClass}`}
      >
        <CalendarDays size={buttonIconSize} className="text-[var(--color-primary)] shrink-0" />
        <span className={`min-w-0 flex-1 truncate whitespace-nowrap leading-[2] ${selectedDate ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-muted)]'}`}>
          {buttonDisplayValue}
        </span>
      </button>

      {isOpen ? (
        <div
          style={panelStyle}
          className={panelClass}
        >
          <div className={`flex items-center justify-between ${isCompact ? 'mb-3' : 'mb-4'}`}>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className={navButtonClass}
            >
              <ChevronRight size={isCompact ? 16 : 18} />
            </button>

            <div className="text-center">
              <p className={`${isCompact ? 'text-xs' : 'text-sm'} font-black text-[var(--color-text-main)]`}>{MONTHS[viewDate.getMonth()]}</p>
              <p className="text-[11px] font-bold text-[var(--color-text-muted)]">{viewDate.getFullYear()}</p>
            </div>

            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className={navButtonClass}
            >
              <ChevronLeft size={isCompact ? 16 : 18} />
            </button>
          </div>

          <div className={`${isCompact ? 'mb-3' : 'mb-4'} grid grid-cols-2 gap-2`}>
            <select
              value={viewDate.getMonth()}
              onChange={handleMonthChange}
              className={selectClass}
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>

            <select
              value={viewDate.getFullYear()}
              onChange={handleYearChange}
              className={selectClass}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div dir="rtl" className={`grid grid-cols-7 ${panelGapClass} text-center ${isCompact ? 'mb-2' : 'mb-3'}`}>
            {DAYS.map((day) => (
              <span key={day} className="text-[10px] font-black text-[var(--color-text-muted)] leading-tight">
                {day}
              </span>
            ))}
          </div>

          <div dir="rtl" className={`grid grid-cols-7 ${panelGapClass}`}>
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className={emptyDayClass} />;
              }

              const isSelected = isSameDate(date, selectedDate);
              const isToday = isSameDate(date, new Date());
              const isBlocked = isDateBlocked(date, min, max);

              return (
                <button
                  key={formatDateValue(date)}
                  type="button"
                  onClick={() => handleSelectDate(date)}
                  disabled={isBlocked}
                  className={`${dayCellClass} font-bold transition-all border ${isSelected
                    ? 'bg-[var(--color-primary)] text-[#0b1120] border-[var(--color-primary)]'
                    : isToday
                      ? 'border-[var(--color-primary)]/40 text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-transparent text-[var(--color-text-main)] hover:bg-[var(--color-bg)]'
                    } ${isBlocked ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className={`flex gap-2 ${isCompact ? 'mt-3' : 'mt-4'}`}>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setViewDate(today);
                handleSelectDate(today);
              }}
              className={`${footerButtonClass} bg-[var(--color-primary)] text-[#0b1120]`}
            >
              آج
            </button>
            <button
              type="button"
              onClick={() => {
                emitChange('');
                setIsOpen(false);
              }}
              className={`${footerButtonClass} border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-main)]`}
            >
              صاف کریں
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
