import React from 'react';
import { ChevronDown } from 'lucide-react';
import { ThemedDatePicker } from '../DatePicker/ThemedDatePicker';
//---------------------------------------------------------------------------------------

export const InputField = ({ label, placeholder, isDark, type = "text", className = '', required = false, error = '', id, ...props }) => (
  <div className="space-y-2">
    {label ? (
      <label htmlFor={id} className="text-[11px]  font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">
        {label}{required ? <span className="text-red-500"> *</span> : null}
      </label>
    ) : null}
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      required={required}
      aria-invalid={Boolean(error)}
      aria-describedby={error && id ? `${id}-error` : undefined}
      {...props}
      className={`w-full p-4 font-arabic rounded-2xl border outline-none font-bold transition-all  focus:ring-4 focus:ring-emerald-500/10 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-[var(--color-input)] border-transparent focus:border-[var(--color-primary)]'
        } ${className}`}
    />
    {error ? <p id={id ? `${id}-error` : undefined} className="mr-2 text-xs font-bold text-rose-500">{error}</p> : null}
  </div>
);
//---------------------------------------------------------------------------------------

export const SelectField = ({ label, options, isDark, className = '', required = false, error = '', id, ...props }) => (
  <div className="space-y-2 relative">
    {label ? (
      <label htmlFor={id} className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">
        {label}{required ? <span className="text-red-500"> *</span> : null}
      </label>
    ) : null}
    <div className="relative">
      <select
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error && id ? `${id}-error` : undefined}
        {...props}
        className={`w-full p-4 rounded-2xl border outline-none font-bold appearance-none transition-all ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-[var(--color-input)] border-transparent focus:border-[var(--color-primary)]'
        } ${className}`}
      >
        {options.map((opt, i) => {
          const optionValue = typeof opt === 'object' && opt !== null ? opt.value : opt;
          const optionLabel = typeof opt === 'object' && opt !== null ? opt.label : opt;

          return (
            <option key={i} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      <ChevronDown size={18} className="absolute left-4 top-4 text-[var(--color-text-muted)] pointer-events-none" />
    </div>
    {error ? <p id={id ? `${id}-error` : undefined} className="mr-2 text-xs font-bold text-rose-500">{error}</p> : null}
  </div>
);
//---------------------------------------------------------------------------------------

export const BankSearchField = ({ label, value, onChange, options, isDark, onSelect }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Filtered banks based on typing
  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className="space-y-2 relative">
      <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Delay taake click register ho sakay
          placeholder="بینک تلاش کریں..."
          className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-[var(--color-input)] border-transparent focus:border-[var(--color-primary)]'
            }`}
        />
        <ChevronDown size={18} className="absolute left-4 top-4 text-[var(--color-text-muted)] pointer-events-none" />

        {/* Search Results Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {filtered.length > 0 ? (
              filtered.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => {
                    onSelect(opt);
                    setIsOpen(false);
                  }}
                  className="p-4 hover:bg-[var(--color-primary)] hover:text-white cursor-pointer transition-colors font-bold text-sm border-b border-[var(--color-border)] last:border-0 text-right"
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-[var(--color-text-muted)] text-sm">
                کوئی بینک نہیں ملا
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

//---------------------------------------------------------------------------------------

export const DateField = ({ label, value, onChange, name, placeholder, min, max, className = '', size = 'md', required = false }) => (
  <ThemedDatePicker
    label={label}
    value={value}
    onChange={onChange}
    name={name}
    placeholder={placeholder}
    min={min}
    max={max}
    className={className}
    size={size}
    required={required}
  />
);
//---------------------------------------------------------------------------------------

export const RadioButton = ({ label, name, defaultChecked }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <input type="radio" name={name} defaultChecked={defaultChecked} className="w-4 h-4 accent-[var(--color-primary)]" />
    <span className="text-sm font-bold text-[var(--color-text-main)] group-hover:text-[var(--color-primary)] transition-colors">{label}</span>
  </label>
);
