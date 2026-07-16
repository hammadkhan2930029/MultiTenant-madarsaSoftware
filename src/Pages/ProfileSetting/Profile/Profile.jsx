import React, { useEffect, useRef, useState } from 'react';
import {
    Mail, Phone, MapPin,
    Edit3, Save, X, Camera, Map, CheckCircle2, ChevronDown, Search, Check, ClipboardList, Users2, ReceiptText
} from 'lucide-react';
import { AppImages } from '../../../Constant/AppImages';
import { fetchMadrassaProfile, getAdminRole, getApiAssetUrl, isSuperAdmin as isSuperAdminSession, updateMadrassaProfile } from '../../../Constant/AdminAuth';
import { getCities } from '../../../Constant/CityApi';
import { useNotifier } from '../../../Components/Notifications/useNotifier';

export const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCitiesLoading, setIsCitiesLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [cities, setCities] = useState([]);
    const [logoPreview, setLogoPreview] = useState(AppImages.logo);
    const [validationErrors, setValidationErrors] = useState({});
    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);
    const notify = useNotifier();
    const sessionRole = getAdminRole();
    const sessionRoleName = typeof sessionRole === 'string' ? sessionRole : sessionRole?.roleName || sessionRole?.role_name;
    const canEditMadrassaProfile = isSuperAdminSession() || sessionRoleName === 'admin';
    const buildLogoPreviewUrl = (profile) => (profile?.logoUrl ? getApiAssetUrl(profile.logoUrl, profile.updatedAt || Date.now()) : AppImages.logo);

    const [madrassaData, setMadrassaData] = useState({
        name: 'جامعہ انوار القرآن',
        email: 'info@anwarulquran.com',
        phone1: '0300-1234567',
        phone2: '0321-7654321',
        address: 'گلشن اقبال، بلاک 13-C، کراچی',
        branch: 'مین کیمپس',
        city: 'کراچی',
        familyNoSeq: 'FAM-2026-001',
        regNo: 'REG-QA-9921',
        feeVoucherNoSeq: 'FEE-0001'
    });

    const [tempData, setTempData] = useState({ ...madrassaData, logoUrl: '' });

    useEffect(() => {
        let isMounted = true;

        const loadProfile = async () => {
            try {
                setIsLoading(true);
                const profile = await fetchMadrassaProfile();
                if (!profile || !isMounted) return;

                const nextData = {
                    name: profile.name || '',
                    email: profile.email || '',
                    phone1: profile.phone1 || '',
                    phone2: profile.phone2 || '',
                    address: profile.address || '',
                    branch: profile.branch || 'مین کیمپس',
                    city: profile.city || '',
                    familyNoSeq: profile.familyNoSeq || '',
                    regNo: profile.regNo || '',
                    feeVoucherNoSeq: profile.feeVoucherNoSeq || 'FEE-0001',
                    logoUrl: profile.logoUrl || '',
                    updatedAt: profile.updatedAt || '',
                };

                setMadrassaData(nextData);
                setTempData(nextData);

                if (isMounted) {
                    setLogoPreview(buildLogoPreviewUrl(profile));
                }
            } catch (loadError) {
                if (isMounted) {
                    const message = loadError?.message || 'پروفائل لوڈ نہیں ہو سکی۔';
                    notify.error(message, 'لوڈنگ میں مسئلہ پیش آیا');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [notify]);

    useEffect(() => {
        let isMounted = true;

        const loadCities = async () => {
            try {
                setIsCitiesLoading(true);
                const result = await getCities();
                if (!isMounted) return;

                setCities((result.items || []).filter((city) => city.status === 'active'));
            } catch (error) {
                if (isMounted) {
                    notify.error(error?.message || 'شہروں کی فہرست لوڈ نہیں ہو سکی۔', 'لوڈنگ میں مسئلہ پیش آیا');
                    setCities([]);
                }
            } finally {
                if (isMounted) {
                    setIsCitiesLoading(false);
                }
            }
        };

        loadCities();

        return () => {
            isMounted = false;
        };
    }, [notify]);

    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsCityDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => () => {
        if (logoPreview?.startsWith('blob:')) {
            URL.revokeObjectURL(logoPreview);
        }
    }, [logoPreview]);

    const handleLogoPick = () => {
        if (!canEditMadrassaProfile) return;
        fileInputRef.current?.click();
    };

    const handleLogoChange = (event) => {
        if (!canEditMadrassaProfile) return;
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            notify.error('صرف تصویر والی فائل منتخب کریں۔', 'غلط فائل');
            event.target.value = '';
            return;
        }

        if (logoPreview?.startsWith('blob:')) {
            URL.revokeObjectURL(logoPreview);
        }

        const previewUrl = URL.createObjectURL(file);
        setTempData((prev) => ({ ...prev, logoFile: file }));
        setLogoPreview(previewUrl);
        notify.success(file.name, 'تصویر منتخب ہو گئی');
    };

    const clearFieldError = (field) => {
        setValidationErrors((current) => {
            if (!current[field]) return current;
            const nextErrors = { ...current };
            delete nextErrors[field];
            return nextErrors;
        });
    };

    const updateTempField = (field, value) => {
        clearFieldError(field);
        setTempData((current) => ({ ...current, [field]: value }));
    };

    const resetEditingState = () => {
        if (logoPreview?.startsWith('blob:')) {
            URL.revokeObjectURL(logoPreview);
        }

        setTempData({ ...madrassaData });
        setLogoPreview(buildLogoPreviewUrl(madrassaData));
        setValidationErrors({});
        setIsEditing(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!canEditMadrassaProfile) {
            notify.error('آپ کو مدرسہ پروفائل میں ترمیم کی اجازت نہیں ہے۔', 'اجازت نہیں');
            return;
        }

        const nextValidationErrors = {};
        if (!tempData.name?.trim()) nextValidationErrors.name = 'ادارے کا نام درج کرنا ضروری ہے۔';
        if (!tempData.email?.trim()) nextValidationErrors.email = 'ای میل درج کرنا ضروری ہے۔';
        if (!tempData.phone1?.trim()) nextValidationErrors.phone1 = 'فون نمبر درج کرنا ضروری ہے۔';
        if (!tempData.address?.trim()) nextValidationErrors.address = 'مکمل پتہ درج کرنا ضروری ہے۔';

        if (Object.keys(nextValidationErrors).length) {
            setValidationErrors(nextValidationErrors);
            notify.error('فون نمبر، مکمل پتہ اور ای میل درج کرنا ضروری ہیں۔', 'نامکمل معلومات');
            return;
        }

        try {
            setIsSaving(true);

            const formData = new FormData();
            formData.append('name', tempData.name?.trim() || '');
            formData.append('email', tempData.email?.trim() || '');
            formData.append('phone1', tempData.phone1?.trim() || '');
            formData.append('phone2', tempData.phone2?.trim() || '');
            formData.append('address', tempData.address?.trim() || '');
            formData.append('branch', 'مین کیمپس');
            formData.append('city', tempData.city || '');
            formData.append('familyNoSeq', tempData.familyNoSeq || '');
            formData.append('regNo', tempData.regNo || '');
            formData.append('feeVoucherNoSeq', tempData.feeVoucherNoSeq || '');
            formData.append('logoUrl', tempData.logoUrl || '');
            formData.append('status', tempData.status || 'active');

            if (tempData.logoFile) {
                formData.append('logo', tempData.logoFile);
            }

            const savedProfile = await updateMadrassaProfile(formData);
            const nextData = {
                name: savedProfile.name || '',
                email: savedProfile.email || '',
                phone1: savedProfile.phone1 || '',
                phone2: savedProfile.phone2 || '',
                address: savedProfile.address || '',
                branch: savedProfile.branch || 'مین کیمپس',
                city: savedProfile.city || '',
                familyNoSeq: savedProfile.familyNoSeq || '',
                regNo: savedProfile.regNo || '',
                feeVoucherNoSeq: savedProfile.feeVoucherNoSeq || 'FEE-0001',
                logoUrl: savedProfile.logoUrl || '',
                updatedAt: savedProfile.updatedAt || '',
            };

            setMadrassaData(nextData);
            setTempData(nextData);
            setValidationErrors({});
            setIsEditing(false);

            setLogoPreview(buildLogoPreviewUrl(savedProfile));
            notify.success('تمام تبدیلیاں محفوظ ہو گئی ہیں۔', 'پروفائل اپڈیٹ ہو گئی');
        } catch (saveError) {
            const message = saveError?.message || 'پروفائل محفوظ نہیں ہو سکی۔';
            notify.error(message, 'محفوظ کرنے میں مسئلہ پیش آیا');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCities = cities.filter((city) => city.name?.includes(citySearch));

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-10 px-4" dir="rtl">
            <div className="relative bg-gradient-to-br from-[#004d61] to-[#002a33] rounded-[3rem] p-8 text-white shadow-2xl overflow-hidden border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d094]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="shrink-0 text-center">
                        <div className="relative group mx-auto w-fit">
                            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2.5rem] border-4 border-white/20 bg-white p-1 shadow-2xl transition-all duration-500 group-hover:scale-105">
                                <img
                                    src={logoPreview || AppImages.logo}
                                    alt="Logo"
                                    onError={(event) => {
                                        event.currentTarget.src = AppImages.logo;
                                    }}
                                    className="block h-full w-full rounded-[2.25rem] object-cover"
                                />
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="hidden"
                            />
                            {isEditing && canEditMadrassaProfile && (
                                <button
                                    type="button"
                                    onClick={handleLogoPick}
                                    className="absolute -bottom-2 -right-2 bg-[#00d094] p-3 rounded-2xl shadow-lg hover:scale-110 transition-all text-white border-4 border-[#002a33] hover:rotate-12"
                                    aria-label="لوگو منتخب کریں"
                                >
                                    <Camera size={20} />
                                </button>
                            )}
                        </div>
                        {isEditing && canEditMadrassaProfile && (
                            <p className="mt-4 max-w-48 text-xs font-bold leading-5 text-white/70">
                                بہترین سائز: 512 × 512 پکسل، مربع PNG یا JPG، زیادہ سے زیادہ 5 MB
                            </p>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 w-full text-center md:text-right">
                        {isEditing ? (
                            <div className="space-y-2 w-full">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#00d094] mr-2">ادارے کا نام<span className="text-red-500"> *</span></label>
                                <textarea
                                    required
                                    value={tempData.name}
                                    onChange={(e) => updateTempField('name', e.target.value)}
                                    rows={2}
                                    dir="rtl"
                                    className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-xl font-black w-full min-w-0 outline-none focus:bg-white/20 focus:border-[#00d094] text-white transition-all shadow-inner resize-none text-right leading-relaxed overflow-y-hidden"
                                />
                                {validationErrors.name ? <p className="mr-2 text-xs font-bold text-rose-200">{validationErrors.name}</p> : null}
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl md:text-5xl font-black mb-2 drop-shadow-md break-words">{madrassaData.name}</h1>
                                <p className="text-emerald-400 font-bold flex items-center justify-center md:justify-start gap-2 pt-2">
                                    <CheckCircle2 size={18} className="animate-pulse" /> تصدیق شدہ تعلیمی ادارہ
                                </p>
                            </>
                        )}
                    </div>

                    {canEditMadrassaProfile ? (
                    <div className="flex gap-3 mt-4 md:mt-0 shrink-0 self-center md:self-start">
                        {isEditing && (
                            <button onClick={resetEditingState} className="p-4 bg-rose-500/20 text-rose-200 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/30 flex items-center gap-2">
                                <X size={20} />
                                <span className="text-sm font-black">منسوخ</span>
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (isEditing) {
                                    handleSave();
                                } else {
                                    setValidationErrors({});
                                    setIsEditing(true);
                                }
                            }}
                            disabled={isSaving || isLoading}
                            className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all active:scale-95 shadow-xl ${
                                isEditing ? 'bg-[#00d094] text-white hover:bg-[#00b07d]' : 'bg-[#00d094] text-white hover:bg-[#00b07d] shadow-[#00d094]/30'
                            } ${(isSaving || isLoading) ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isEditing ? <><Save size={20} /> {isSaving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}</> : <><Edit3 size={20} /> ایڈٹ کریں</>}
                        </button>
                    </div>
                    ) : null}
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-5 text-right text-sm font-bold text-[var(--color-text-muted)]">
                    پروفائل لوڈ ہو رہی ہے...
                </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-[3rem] shadow-sm space-y-6 md:col-span-2">
                    <h3 className="text-lg font-black text-[var(--color-text)] border-r-4 border-[#00d094] pr-4">انتظامی معلومات</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <InfoField
                            label="رجسٹریشن نمبر"
                            icon={<ClipboardList size={16} />}
                            value={madrassaData.regNo}
                            isEditing={isEditing}
                            tempValue={tempData.regNo}
                            onChange={(v) => setTempData({ ...tempData, regNo: v })}
                        />
                        <InfoField
                            label="فیملی نمبر سیکوینس"
                            icon={<Users2 size={16} />}
                            value={madrassaData.familyNoSeq}
                            isEditing={isEditing}
                            tempValue={tempData.familyNoSeq}
                            onChange={(v) => setTempData({ ...tempData, familyNoSeq: v })}
                        />
                        <InfoField
                            label="فیس واؤچر نمبر سیکوینس"
                            icon={<ReceiptText size={16} />}
                            value={madrassaData.feeVoucherNoSeq}
                            isEditing={isEditing}
                            tempValue={tempData.feeVoucherNoSeq}
                            onChange={(v) => setTempData({ ...tempData, feeVoucherNoSeq: v })}
                        />
                    </div>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-[3rem] shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-[var(--color-text)] border-r-4 border-[#00d094] pr-4">رابطے کی تفصیلات</h3>
                    <InfoField label="ای میل" required error={validationErrors.email} icon={<Mail size={16} />} value={madrassaData.email} isEditing={isEditing} tempValue={tempData.email} onChange={(v) => updateTempField('email', v)} />
                    <div className="grid grid-cols-2 gap-6">
                        <InfoField label="فون 1" required error={validationErrors.phone1} icon={<Phone size={16} />} value={madrassaData.phone1} isEditing={isEditing} tempValue={tempData.phone1} onChange={(v) => updateTempField('phone1', v)} />
                        <InfoField label="فون 2" icon={<Phone size={16} />} value={madrassaData.phone2} isEditing={isEditing} tempValue={tempData.phone2} onChange={(v) => updateTempField('phone2', v)} />
                    </div>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-[3rem] shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-[var(--color-text)] border-r-4 border-[#00d094] pr-4">مقام</h3>
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-3" ref={dropdownRef}>
                            <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest flex items-center gap-2">
                                <Map size={14} className="text-[#00d094]" /> شہر
                            </label>
                            {isEditing ? (
                                <div className="relative">
                                    <div
                                        onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                                        className="flex items-center justify-between p-4 bg-[var(--color-bg)] border border-[#00d094]/30 rounded-2xl cursor-pointer hover:border-[#00d094] transition-all"
                                    >
                                        <span className="font-bold text-[var(--color-text)]">{tempData.city || 'شہر منتخب کریں'}</span>
                                        <ChevronDown size={18} className="text-[#00d094]" />
                                    </div>

                                    {isCityDropdownOpen && (
                                        <div className="absolute z-[100] w-full mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl rounded-2xl max-h-60 overflow-hidden animate-in zoom-in-95 duration-200">
                                            <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/50">
                                                <Search size={16} className="text-[var(--color-text-muted)]" />
                                                <input
                                                    placeholder="تلاش کریں..."
                                                    value={citySearch}
                                                    className="w-full bg-transparent text-sm outline-none text-[var(--color-text)] font-bold"
                                                    onChange={(e) => setCitySearch(e.target.value)}
                                                />
                                            </div>
                                            <div className="overflow-y-auto max-h-48 p-2 custom-scrollbar">
                                                {isCitiesLoading ? (
                                                    <div className="p-4 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                                        شہر لوڈ ہو رہے ہیں...
                                                    </div>
                                                ) : filteredCities.length > 0 ? (
                                                    filteredCities.map((city) => (
                                                        <div
                                                            key={city.id}
                                                            onClick={() => {
                                                                updateTempField('city', city.name);
                                                                setIsCityDropdownOpen(false);
                                                                setCitySearch('');
                                                            }}
                                                            className={`p-3 rounded-xl cursor-pointer font-bold text-sm flex justify-between items-center transition-all mb-1 ${
                                                                tempData.city === city.name ? 'bg-[#00d094]/20 text-[#00d094]' : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                                                            }`}
                                                        >
                                                            {city.name}
                                                            {tempData.city === city.name && <Check size={16} />}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-sm font-bold text-[var(--color-text-muted)]">
                                                        کوئی شہر نہیں ملا
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-[var(--color-bg)] border border-transparent rounded-2xl font-bold text-[var(--color-text)] flex items-center gap-3">
                                    <MapPin size={18} className="text-[var(--color-text-muted)]" /> {madrassaData.city}
                                </div>
                            )}
                        </div>
                    </div>
                    <InfoField label="مکمل پتہ" required error={validationErrors.address} icon={<MapPin size={16} />} value={madrassaData.address} isEditing={isEditing} tempValue={tempData.address} onChange={(v) => updateTempField('address', v)} />
                </div>
            </div>
        </div>
    );
};

const InfoField = ({ label, value, isEditing, tempValue, onChange, icon, required = false, error = '' }) => (
    <div className="space-y-3">
        <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest flex items-center gap-2">
            {icon && <span className="text-[#00d094]">{icon}</span>} {label}{required ? <span className="text-red-500"> *</span> : null}
        </label>
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            isEditing
                ? `bg-[var(--color-bg)] ${error ? 'border-rose-400' : 'border-[#00d094]/50'} shadow-[inner_0_2px_4px_rgba(0,0,0,0.05)]`
                : 'bg-[var(--color-bg)] border-transparent'
        }`}>
            {isEditing ? (
                <input
                    required={required}
                    value={tempValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-transparent w-full min-w-0 outline-none font-bold text-[var(--color-text)] focus:text-[#00d094] transition-colors"
                />
            ) : (
                <span className="font-bold text-[var(--color-text)] break-words">{value}</span>
            )}
        </div>
        {error ? <p className="mr-2 text-xs font-bold text-rose-500">{error}</p> : null}
    </div>
);
