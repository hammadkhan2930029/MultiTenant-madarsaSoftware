import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Plus, Search, Trash2, MapPin, X, ArrowRight, Check, ChevronDown, Map
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createCity, deactivateCity, getCities } from '../../../Constant/CityApi';
import { useNotifier } from '../../../Components/Notifications/useNotifier';

const suggestedCities = [
  'کراچی', 'لاہور', 'اسلام آباد', 'راولپنڈی', 'فیصل آباد',
  'ملتان', 'پشاور', 'کوئٹہ', 'گوجرانوالہ', 'سیالکوٹ',
  'حیدرآباد', 'سکھر', 'جھنگ', 'شیخوپورہ', 'گجرات',
  'مردان', 'قصور', 'رحیم یار خان', 'سرگودھا', 'بہاولپور',
  'ساہیوال', 'اوکاڑہ', 'وہاڑی', 'ڈی جی خان', 'بہاولنگر',
  'چنیوٹ', 'ٹوبہ ٹیک سنگھ', 'پاکپتن', 'خانیوال', 'لودھراں',
  'بھکر', 'میانوالی', 'لیہ', 'مظفرگڑھ', 'راجن پور',
  'نارووال', 'ننکانہ صاحب', 'حافظ آباد', 'منڈی بہاؤالدین',
  'چکوال', 'اٹک', 'جہلم', 'گجر خان', 'تلہ گنگ',
  'ایبٹ آباد', 'ہری پور', 'مانسہرہ', 'بٹگرام', 'کوہستان',
  'سوات', 'مینگورہ', 'بونیر', 'شانگلہ', 'دیر بالا',
  'دیر زیریں', 'چترال', 'نوشہرہ', 'صوابی', 'کوہاٹ',
  'ہنگو', 'کرک', 'بنوں', 'لکی مروت', 'ڈیرہ اسماعیل خان',
  'مالاکنڈ', 'پاراچنار', 'خیبر', 'باجوڑ', 'مہمند',
  'میرپور', 'مظفرآباد', 'باغ', 'راولاکوٹ', 'کوٹلی',
  'گلگت', 'سکردو', 'ہنزہ', 'دیامر', 'غذر',
  'سبی', 'جعفر آباد', 'نصیر آباد', 'ژوب', 'لورالائی',
  'چمن', 'گوادر', 'تربت', 'خضدار', 'حب',
  'دادو', 'لاڑکانہ', 'شکارپور', 'جیکب آباد', 'گھوٹکی',
  'نواب شاہ', 'میرپور خاص', 'عمرکوٹ', 'بدین', 'ٹھٹھہ',
  'مٹیاری', 'ٹنڈو آدم', 'ٹنڈو محمد خان', 'جامشورو',
  'کشمور', 'کندھ کوٹ', 'سانگھڑ', 'خیرپور', 'نوشہرو فیروز'
];

export const CreateCities = () => {
    const navigate = useNavigate();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [cities, setCities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const dropdownRef = useRef(null);
    const notify = useNotifier();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadCities = useCallback(async () => {
        try {
            setIsLoading(true);
            const result = await getCities();
            setCities(result.items || []);
        } catch (error) {
            notify.error(error?.message || 'شہروں کی فہرست لوڈ نہیں ہو سکی۔', 'لوڈنگ میں مسئلہ پیش آیا');
        } finally {
            setIsLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        loadCities();
    }, [loadCities]);

    const activeCities = useMemo(
        () => cities.filter((city) => city.status === 'active'),
        [cities]
    );

    const filteredCities = suggestedCities.filter((city) => {
        const isNotAdded = !activeCities.some((item) => item.name === city);
        return isNotAdded && city.includes(searchTerm);
    });
    const cityNameToSave = (selectedCity || searchTerm).trim();

    const handleAddCity = async () => {
        if (!cityNameToSave) return;

        try {
            setIsSaving(true);
            const createdCity = await createCity({ name: cityNameToSave });
            setCities((prev) => [...prev, createdCity]);
            setSelectedCity('');
            setSearchTerm('');
            setIsOpen(false);
            setIsFormOpen(false);
            notify.success(`${createdCity.name} فہرست میں شامل کر دیا گیا۔`, 'شہر شامل ہو گیا');
        } catch (error) {
            notify.error(error?.message || 'شہر محفوظ نہیں ہو سکا۔', 'محفوظ کرنے میں مسئلہ پیش آیا');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivateCity = async (id) => {
        try {
            const updatedCity = await deactivateCity(id);
            setCities((prev) => prev.map((city) => (city.id === id ? updatedCity : city)));
            notify.success(`${updatedCity.name} غیر فعال کر دیا گیا۔`, 'شہر غیر فعال ہو گیا');
        } catch (error) {
            notify.error(error?.message || 'شہر حذف نہیں ہو سکا۔', 'حذف کرنے میں مسئلہ پیش آیا');
        }
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate('/Profile/setting');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-10" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-[var(--color-surface)] p-8 rounded-[3rem] border border-[var(--color-border)] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-[#00d094]/5 rounded-full blur-3xl -ml-16 -mt-16"></div>

                <div className="text-right z-10">
                    <h2 className="text-3xl font-black text-[var(--color-text)] tracking-tight flex items-center gap-3">
                        <Map className="text-[#00d094]" size={28} /> شہروں کی فہرست
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)] font-bold mt-5 mr-10">فعال شہر: {activeCities.length}</p>
                </div>

                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className={`z-10 flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95 ${isFormOpen
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white'
                        : 'bg-[#00d094] text-white shadow-[#00d094]/20 hover:bg-[#00b07d]'
                        }`}
                >
                    {isFormOpen ? 'منسوخ کریں' : 'نیا شہر شامل کریں'}
                    {isFormOpen ? <X size={20} /> : <Plus size={20} />}
                </button>
            </div>

            {isFormOpen ? (
                <div className="bg-[var(--color-surface)] border border-[#00d094]/20 shadow-2xl rounded-[3rem] p-10 animate-in slide-in-from-top-6 duration-500 relative z-[100]">
                    <div className="max-w-md mx-auto space-y-6 text-right">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 block uppercase tracking-[0.3em]">دستیاب شہر منتخب کریں</label>

                            <div className="relative" ref={dropdownRef}>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[var(--color-text-muted)] group-focus-within:text-[#00d094] transition-colors">
                                        <Search size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="شہر کا نام ٹائپ کریں..."
                                        value={searchTerm}
                                        onFocus={() => setIsOpen(true)}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setIsOpen(true);
                                            if (selectedCity !== e.target.value) setSelectedCity('');
                                        }}
                                        className="w-full bg-[var(--color-bg)] border-2 border-transparent focus:border-[#00d094] outline-none h-[70px] pr-14 pl-14 rounded-[1.5rem] text-lg font-bold text-right text-[var(--color-text)] transition-all shadow-inner"
                                    />
                                    <div
                                        className="absolute inset-y-0 left-4 flex items-center cursor-pointer text-[var(--color-text-muted)] hover:text-[#00d094] transition-colors"
                                        onClick={() => setIsOpen(!isOpen)}
                                    >
                                        <ChevronDown size={22} className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {isOpen ? (
                                    <div className="absolute top-full left-0 right-0 z-[110] mt-3 bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2rem] max-h-[300px] overflow-hidden animate-in zoom-in-95 duration-300">
                                        <div className="overflow-y-auto max-h-[300px] p-3 custom-scrollbar">
                                            {filteredCities.length > 0 ? (
                                                filteredCities.map((city) => (
                                                    <div
                                                        key={city}
                                                        onClick={() => {
                                                            setSelectedCity(city);
                                                            setSearchTerm(city);
                                                            setIsOpen(false);
                                                        }}
                                                        className={`p-4 mb-2 rounded-2xl cursor-pointer font-bold text-right transition-all flex items-center justify-between group ${selectedCity === city ? 'bg-[#00d094] text-white shadow-lg' : 'text-[var(--color-text)] hover:bg-[var(--color-bg)]'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {selectedCity === city ? <Check size={18} /> : <MapPin size={16} className="opacity-40 group-hover:text-[#00d094] group-hover:opacity-100" />}
                                                            <span>{city}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-10 text-center text-[var(--color-text-muted)] font-bold">
                                                    <Search size={40} className="mx-auto mb-3 opacity-10" />
                                                    کوئی نیا شہر نہیں ملا
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <button
                            onClick={handleAddCity}
                            disabled={!cityNameToSave || isSaving}
                            className={`w-full py-5 rounded-2xl font-black text-sm shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${cityNameToSave && !isSaving
                                ? 'bg-[#00d094] text-white hover:bg-[#00b07d] hover:shadow-[#00d094]/30'
                                : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed'}`}
                        >
                            {isSaving ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں اور فہرست میں شامل کریں'} <Plus size={20} />
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl rounded-[3rem] overflow-hidden">
                <div className="overflow-x-auto p-6">
                    <table className="w-full text-right border-separate border-spacing-y-3">
                        <thead>
                            <tr className="text-[var(--color-text-muted)] text-[11px] font-black uppercase tracking-[0.2em]">
                                <th className="px-8 py-4">#</th>
                                <th className="px-8 py-4">شہر کا نام</th>
                                <th className="px-8 py-4 text-center">انتظامی کنٹرول</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="3" className="py-16 text-center text-[var(--color-text-muted)] font-bold">
                                        شہر لوڈ ہو رہے ہیں...
                                    </td>
                                </tr>
                            ) : activeCities.length > 0 ? (
                                activeCities.map((city, index) => (
                                    <tr key={city.id} className="bg-[var(--color-bg)]/50 hover:bg-[var(--color-bg)] transition-all duration-300 group rounded-2xl border border-transparent hover:border-[#00d094]/20">
                                        <td className="px-8 py-5 font-bold text-[var(--color-text-muted)] first:rounded-r-[1.5rem]">
                                            {String(index + 1).padStart(2, '0')}
                                        </td>
                                        <td className="px-8 py-5 font-black text-[var(--color-text)]">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 flex items-center justify-center bg-[var(--color-surface)] text-[var(--color-text-muted)] rounded-xl group-hover:bg-[#00d094] group-hover:text-white transition-all shadow-inner">
                                                    <MapPin size={18} />
                                                </div>
                                                <span className="text-lg">{city.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 last:rounded-l-[1.5rem] text-center">
                                            <button
                                                onClick={() => handleDeactivateCity(city.id)}
                                                className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 hover:rotate-12"
                                                title="حذف کریں"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Map size={60} />
                                            <p className="text-xl font-black">فہرست خالی ہے</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-start pt-4">
                <button
                    type="button"
                    onClick={handleBack}
                    className="group flex items-center gap-3 bg-[var(--color-surface)] text-[var(--color-text-muted)] px-10 py-4 rounded-[1.5rem] font-black text-sm border border-[var(--color-border)] hover:bg-[var(--color-bg)] hover:text-[#00d094] transition-all shadow-md"
                >
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" /> واپس جائیں
                </button>
            </div>
        </div>
    );
};
