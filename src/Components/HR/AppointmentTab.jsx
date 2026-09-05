
import React from 'react';
import { Search, Save, Trash2, X, ArrowRight, ChevronDown } from 'lucide-react';
import { InputField, SelectField, DateField } from './FormElements';
import { EMPLOYMENT_TYPE_OPTIONS } from '../../Constant/EmploymentTypes';

export const AppoinmentTab = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

           
            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">

                    <DateField label="تاریخ تقرری" />
                    <DateField label="تاریخ شمولیت" />

                    <SelectField
                        label="عہدہ"
                        options={["استاد", "ناظم", "قاری", "محرر", "خادم","دیگر"]}
                    />

                    <SelectField
                        label="گریڈ"
                        options={["Grade A", "Grade B", "Grade C", "Special"]}
                    />

                    <div className="sm:col-span-2">
                        <SelectField
                            label="ملازمت کی نوعیت"
                            options={EMPLOYMENT_TYPE_OPTIONS}
                        />
                    </div>

                    <InputField label="تعیناتی مقام" placeholder="برانچ یا دفتر ka naam" />
                    <SelectField label="رپورٹنگ آفیسر" options={["ناظم اعلٰی", "ہیڈ آف ڈیپارٹمنٹ", "پرنسپل"]} />

                </div>
            </div>

            {/* Left Column: Extra Details */}
            {/* 'lg' se pehle ye section niche auto-stack ho jayega */}
            <div className="space-y-6 bg-[var(--color-input)] p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-[var(--color-border)] h-fit shadow-inner">
                <h3 className="text-sm font-black text-[var(--color-primary)] uppercase tracking-widest border-r-4 border-[var(--color-primary)] pr-3 mb-4 font-urdu">اضافی تفصیلات</h3>

                {/* md par bhi isse single column rakha hai taake sm jaisa feel aaye */}
                <div className="grid grid-cols-1 gap-4">
                    <InputField label="پروڈکشن آئی ڈی" placeholder="انگوٹھے کا نشان آئی ڈی" isDark />

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">ملازمت کی حیثیت</label>
                        <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-500">برسرِروزگار</span>
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-[var(--color-border)] space-y-4">
                    <InputField label="نوٹس" placeholder="کوئی خاص ہدایت یا بات" isDark />
                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-3">
                        <div className="text-amber-500 mt-1 shrink-0 text-sm">⚠️</div>
                        <p className="text-[10px] font-bold text-amber-700 leading-relaxed font-urdu">
                            تقرری کی تفصیلات تبدیل کرنے سے ملازم کی پرانی ہسٹری محفوظ رہے گی۔
                        </p>
                    </div>
                </div>
            </div>

        </div>
    )
}
