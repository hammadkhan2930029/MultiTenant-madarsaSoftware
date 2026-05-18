import React, { useEffect, useRef, useState } from 'react';
import {
    Building2, Mail, Phone, MapPin,
    Edit3, Save, X, Camera, Map, CheckCircle2, ChevronDown, Search, Check, ClipboardList, Users2
} from 'lucide-react';
import { AppImages } from '../../../Constant/AppImages';
import { fetchMadrassaProfile, resolveApiAssetUrl, updateMadrassaProfile } from '../../../Constant/AdminAuth';
import { useNotifier } from '../../../Components/Notifications/useNotifier';

export const Profile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState(AppImages.logo);
    const dropdownRef = useRef(null);
    const fileInputRef = useRef(null);
    const notify = useNotifier();

    const allCities = ['کراچی', 'لاہور', 'اسلام آباد', 'راولپنڈی', 'فیصل آباد', 'ملتان', 'پشاور', 'کوئٹہ'];

    const [madrassaData, setMadrassaData] = useState({
        name: 'جامعہ انوار القرآن',
        email: 'info@anwarulquran.com',
        phone1: '0300-1234567',
        phone2: '0321-7654321',
        address: 'گلشن اقبال، بلاک 13-C، کراچی',
        branch: 'مین کیمپس',
        city: 'کراچی',
        familyNoSeq: 'FAM-2026-001',
        regNo: 'REG-QA-9921'
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
                    branch: profile.branch || '',
                    city: profile.city || '',
                    familyNoSeq: profile.familyNoSeq || '',
                    regNo: profile.regNo || '',
                    logoUrl: profile.logoUrl || '',
                };

                setMadrassaData(nextData);
                setTempData(nextData);

                if (profile.logoUrl) {
                    const resolvedLogoUrl = await resolveApiAssetUrl(profile.logoUrl);
                    if (isMounted) {
                        setLogoPreview(resolvedLogoUrl || AppImages.logo);
                    }
                } else if (isMounted) {
                    setLogoPreview(AppImages.logo);
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
        fileInputRef.current?.click();
    };

    const handleLogoChange = (event) => {
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

    const resetEditingState = () => {
        if (logoPreview?.startsWith('blob:')) {
            URL.revokeObjectURL(logoPreview);
        }

        setTempData({ ...madrassaData });
        if (madrassaData.logoUrl) {
            resolveApiAssetUrl(madrassaData.logoUrl).then((resolvedLogoUrl) => {
                setLogoPreview(resolvedLogoUrl || AppImages.logo);
            });
        } else {
            setLogoPreview(AppImages.logo);
        }
        setIsEditing(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);

            const formData = new FormData();
            formData.append('name', tempData.name || '');
            formData.append('email', tempData.email || '');
            formData.append('phone1', tempData.phone1 || '');
            formData.append('phone2', tempData.phone2 || '');
            formData.append('address', tempData.address || '');
            formData.append('branch', tempData.branch || '');
            formData.append('city', tempData.city || '');
            formData.append('familyNoSeq', tempData.familyNoSeq || '');
            formData.append('regNo', tempData.regNo || '');
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
                branch: savedProfile.branch || '',
                city: savedProfile.city || '',
                familyNoSeq: savedProfile.familyNoSeq || '',
                regNo: savedProfile.regNo || '',
                logoUrl: savedProfile.logoUrl || '',
            };

            setMadrassaData(nextData);
            setTempData(nextData);
            setIsEditing(false);

            if (savedProfile.logoUrl) {
                const resolvedLogoUrl = await resolveApiAssetUrl(savedProfile.logoUrl);
                setLogoPreview(resolvedLogoUrl || AppImages.logo);
            } else {
                setLogoPreview(AppImages.logo);
            }
            notify.success('تمام تبدیلیاں محفوظ ہو گئی ہیں۔', 'پروفائل اپڈیٹ ہو گئی');
        } catch (saveError) {
            const message = saveError?.message || 'پروفائل محفوظ نہیں ہو سکی۔';
            notify.error(message, 'محفوظ کرنے میں مسئلہ پیش آیا');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCities = allCities.filter((c) => c.includes(citySearch));

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-10 px-4" dir="rtl">
            <div className="relative bg-gradient-to-br from-[#004d61] to-[#002a33] rounded-[3rem] p-8 text-white shadow-2xl overflow-hidden border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d094]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                        <div className="w-32 h-32 bg-white rounded-[2.5rem] p-2 shadow-2xl transition-all group-hover:scale-105 duration-500 border-4 border-white/20">
                            <img
                                src={logoPreview || AppImages.logo}
                                alt="Logo"
                                onError={() => setLogoPreview(AppImages.logo)}
                                className="w-full h-full object-contain rounded-[2rem]"
                            />
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                        />
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleLogoPick}
                                className="absolute -bottom-2 -right-2 bg-[#00d094] p-3 rounded-2xl shadow-lg hover:scale-110 transition-all text-white border-4 border-[#002a33] hover:rotate-12"
                            >
                                <Camera size={20} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 min-w-0 w-full text-center md:text-right">
                        {isEditing ? (
                            <div className="space-y-2 w-full">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#00d094] mr-2">ادارے کا نام</label>
                                <textarea
                                    value={tempData.name}
                                    onChange={(e) => setTempData({ ...tempData, name: e.target.value })}
                                    rows={2}
                                    dir="rtl"
                                    className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-xl font-black w-full min-w-0 outline-none focus:bg-white/20 focus:border-[#00d094] text-white transition-all shadow-inner resize-none text-right leading-relaxed overflow-y-hidden"
                                />
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

                    <div className="flex gap-3 mt-4 md:mt-0 shrink-0 self-center md:self-start">
                        {isEditing && (
                            <button onClick={resetEditingState} className="p-4 bg-rose-500/20 text-rose-200 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-500/30">
                                <X size={20} />
                            </button>
                        )}
                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            disabled={isSaving || isLoading}
                            className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all active:scale-95 shadow-xl ${
                                isEditing ? 'bg-[#00d094] text-white hover:bg-[#00b07d]' : 'bg-[#00d094] text-white hover:bg-[#00b07d] shadow-[#00d094]/30'
                            } ${(isSaving || isLoading) ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isEditing ? <><Save size={20} /> {isSaving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}</> : <><Edit3 size={20} /> ایڈٹ کریں</>}
                        </button>
                    </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    </div>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-[3rem] shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-[var(--color-text)] border-r-4 border-[#00d094] pr-4">رابطے کی تفصیلات</h3>
                    <InfoField label="ای میل" icon={<Mail size={16} />} value={madrassaData.email} isEditing={isEditing} tempValue={tempData.email} onChange={(v) => setTempData({ ...tempData, email: v })} />
                    <div className="grid grid-cols-2 gap-6">
                        <InfoField label="فون 1" icon={<Phone size={16} />} value={madrassaData.phone1} isEditing={isEditing} tempValue={tempData.phone1} onChange={(v) => setTempData({ ...tempData, phone1: v })} />
                        <InfoField label="فون 2" icon={<Phone size={16} />} value={madrassaData.phone2} isEditing={isEditing} tempValue={tempData.phone2} onChange={(v) => setTempData({ ...tempData, phone2: v })} />
                    </div>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-[3rem] shadow-sm space-y-6">
                    <h3 className="text-lg font-black text-[var(--color-text)] border-r-4 border-[#00d094] pr-4">مقام اور برانچ</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <InfoField label="برانچ" icon={<Building2 size={16} />} value={madrassaData.branch} isEditing={isEditing} tempValue={tempData.branch} onChange={(v) => setTempData({ ...tempData, branch: v })} />

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
                                        <span className="font-bold text-[var(--color-text)]">{tempData.city}</span>
                                        <ChevronDown size={18} className="text-[#00d094]" />
                                    </div>

                                    {isCityDropdownOpen && (
                                        <div className="absolute z-[100] w-full mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl rounded-2xl max-h-60 overflow-hidden animate-in zoom-in-95 duration-200">
                                            <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/50">
                                                <Search size={16} className="text-[var(--color-text-muted)]" />
                                                <input
                                                    placeholder="تلاش کریں..."
                                                    className="w-full bg-transparent text-sm outline-none text-[var(--color-text)] font-bold"
                                                    onChange={(e) => setCitySearch(e.target.value)}
                                                />
                                            </div>
                                            <div className="overflow-y-auto max-h-48 p-2 custom-scrollbar">
                                                {filteredCities.map((city) => (
                                                    <div
                                                        key={city}
                                                        onClick={() => {
                                                            setTempData({ ...tempData, city });
                                                            setIsCityDropdownOpen(false);
                                                        }}
                                                        className={`p-3 rounded-xl cursor-pointer font-bold text-sm flex justify-between items-center transition-all mb-1 ${
                                                            tempData.city === city ? 'bg-[#00d094]/20 text-[#00d094]' : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                                                        }`}
                                                    >
                                                        {city}
                                                        {tempData.city === city && <Check size={16} />}
                                                    </div>
                                                ))}
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
                    <InfoField label="مکمل پتہ" icon={<MapPin size={16} />} value={madrassaData.address} isEditing={isEditing} tempValue={tempData.address} onChange={(v) => setTempData({ ...tempData, address: v })} />
                </div>
            </div>
        </div>
    );
};

const InfoField = ({ label, value, isEditing, tempValue, onChange, icon }) => (
    <div className="space-y-3">
        <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest flex items-center gap-2">
            {icon && <span className="text-[#00d094]">{icon}</span>} {label}
        </label>
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            isEditing
                ? 'bg-[var(--color-bg)] border-[#00d094]/50 shadow-[inner_0_2px_4px_rgba(0,0,0,0.05)]'
                : 'bg-[var(--color-bg)] border-transparent'
        }`}>
            {isEditing ? (
                <input
                    value={tempValue}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-transparent w-full min-w-0 outline-none font-bold text-[var(--color-text)] focus:text-[#00d094] transition-colors"
                />
            ) : (
                <span className="font-bold text-[var(--color-text)] break-words">{value}</span>
            )}
        </div>
    </div>
);
