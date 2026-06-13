import React, { useEffect, useMemo, useState } from 'react';
import {
    BookOpen,
    Camera,
    CheckCircle,
    ChevronDown,
    HeartPulse,
    MapPin,
    Phone,
    Printer,
    Save,
    Search,
    User,
    X,
} from 'lucide-react';
import { Field, Form, Formik } from 'formik';
import { useSearchParams } from 'react-router-dom';
import { AppImages } from '../../../Constant/AppImages';
import { DateField, InputField, SelectField } from '../../../Components/HR/FormElements';
import { createStudent, getNextAdmissionNumber, getParents, getStudentById, updateStudent } from '../../../Constant/StudentsApi';
import { getClasses, getSections } from '../../../Constant/AcademicSetupApi';
import { getTeachers } from '../../../Constant/TeachersApi';
import { useNotificationBridge } from '../../../Components/Notifications/useNotificationBridge';
import { fetchMadrassaProfile, getAdminSession, getApiAssetUrl } from '../../../Constant/AdminAuth';

const INITIAL_VALUES = {
    idNo: '',
    admissionDate: '',
    admissionFee: '',
    fullName: '',
    fatherName: '',
    gender: 'male',
    caste: '',
    cnic: '',
    dob: '',
    bForm: '',
    currentAddress: '',
    permanentAddress: '',
    district: '',
    fatherOccupation: '',
    mobile: '',
    whatsapp: '',
    guardianName: '',
    relation: 'father',
    guardianMobile: '',
    guardianEmail: '',
    guardianCnic: '',
    prevMadrassa: '',
    prevSchool: '',
    secularEdu: '',
    religiousEdu: '',
    requiredClass: '',
    requiredJamaat: '',
    teacherName: '',
    medicalCondition: '',
    monthlyFee: '',
    reside: 'نہیں',
    studentImage: '',
};

const DEFAULT_ADMISSION_NUMBER = '0001';

const parseAdmissionNumber = (value) => {
    const text = String(value || '').trim();
    const match = text.match(/^(.*?)(\d+)$/);

    if (!match) return null;

    return {
        prefix: match[1],
        number: Number(match[2]),
        width: match[2].length,
    };
};

const buildNextAdmissionNumber = (students = []) => {
    const highest = students
        .map((student) => parseAdmissionNumber(student?.admissionNumber))
        .filter(Boolean)
        .reduce((currentHighest, item) => {
            if (!currentHighest || item.number > currentHighest.number) return item;
            return currentHighest;
        }, null);

    if (!highest) return DEFAULT_ADMISSION_NUMBER;

    const nextNumber = highest.number + 1;
    return `${highest.prefix}${String(nextNumber).padStart(highest.width, '0')}`;
};

const fetchNextAdmissionNumber = async () => {
    return (await getNextAdmissionNumber()) || DEFAULT_ADMISSION_NUMBER;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const buildPrintValues = (formValues, savedStudent) => ({
    ...INITIAL_VALUES,
    ...formValues,
    idNo: savedStudent?.admissionNumber || formValues.idNo,
    admissionDate: savedStudent?.admissionDate || formValues.admissionDate,
    admissionFee: savedStudent?.admissionFee ?? formValues.admissionFee,
    fullName: savedStudent?.fullName || formValues.fullName,
    fatherName: savedStudent?.fatherName || formValues.fatherName,
    gender: savedStudent?.gender || formValues.gender,
    caste: savedStudent?.caste || formValues.caste,
    cnic: savedStudent?.cnic || formValues.cnic,
    dob: savedStudent?.dob || formValues.dob,
    bForm: savedStudent?.bForm || formValues.bForm,
    currentAddress: savedStudent?.currentAddress || savedStudent?.address || formValues.currentAddress,
    permanentAddress: savedStudent?.permanentAddress || formValues.permanentAddress,
    district: savedStudent?.district || formValues.district,
    mobile: savedStudent?.phone || formValues.mobile,
    whatsapp: savedStudent?.whatsapp || formValues.whatsapp,
    prevMadrassa: savedStudent?.prevMadrassa || formValues.prevMadrassa,
    prevSchool: savedStudent?.prevSchool || formValues.prevSchool,
    secularEdu: savedStudent?.secularEdu || formValues.secularEdu,
    religiousEdu: savedStudent?.religiousEdu || formValues.religiousEdu,
    requiredClass: savedStudent?.requiredClass || formValues.requiredClass,
    requiredJamaat: savedStudent?.requiredJamaat || formValues.requiredJamaat,
    teacherName: savedStudent?.teacherName || formValues.teacherName,
    medicalCondition: savedStudent?.medicalCondition || formValues.medicalCondition,
    monthlyFee: savedStudent?.monthlyFee ?? formValues.monthlyFee,
    reside: savedStudent?.reside || formValues.reside,
});

const toDateInputValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).split('T')[0];
    return date.toISOString().split('T')[0];
};

const mapStudentToFormValues = (student) => {
    const primaryParentLink = student?.parents?.find((item) => item.isPrimary) || student?.parents?.[0] || {};
    const primaryParent = primaryParentLink.parent || {};
    const guardianLink = student?.parents?.find((item) => !item.isPrimary) || {};
    const guardian = guardianLink.parent || primaryParent;

    return {
        ...INITIAL_VALUES,
        idNo: student?.admissionNumber || '',
        admissionDate: toDateInputValue(student?.admissionDate),
        admissionFee: student?.admissionFee ?? '',
        fullName: student?.fullName || '',
        fatherName: student?.fatherName || primaryParent.fullName || '',
        gender: student?.gender || 'male',
        caste: student?.caste || '',
        cnic: student?.cnic || primaryParent.cnic || '',
        dob: toDateInputValue(student?.dob),
        bForm: student?.bForm || '',
        currentAddress: student?.currentAddress || student?.address || primaryParent.address || '',
        permanentAddress: student?.permanentAddress || '',
        district: student?.district || '',
        fatherOccupation: primaryParent.occupation || '',
        mobile: student?.phone || primaryParent.phone || '',
        whatsapp: student?.whatsapp || '',
        guardianName: guardian.fullName || '',
        relation: guardianLink.relationship || primaryParentLink.relationship || 'father',
        guardianMobile: guardian.phone || '',
        guardianEmail: guardian.email || '',
        guardianCnic: guardian.cnic || '',
        prevMadrassa: student?.prevMadrassa || '',
        prevSchool: student?.prevSchool || '',
        secularEdu: student?.secularEdu || '',
        religiousEdu: student?.religiousEdu || '',
        requiredClass: student?.requiredClass || '',
        requiredJamaat: student?.requiredJamaat || '',
        teacherName: student?.teacherName || '',
        medicalCondition: student?.medicalCondition || '',
        monthlyFee: student?.monthlyFee ?? '',
        reside: student?.reside || INITIAL_VALUES.reside,
        studentImage: student?.imageUrl || '',
    };
};

export const AdmissionForm = () => {
    const [searchParams] = useSearchParams();
    const editingStudentId = searchParams.get('studentId');
    const [initialFormValues, setInitialFormValues] = useState(INITIAL_VALUES);
    const [isAdmissionNumberLoading, setIsAdmissionNumberLoading] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [savedProfile, setSavedProfile] = useState(null);
    const [savedPrintValues, setSavedPrintValues] = useState(null);
    const [savedPrintImagePreview, setSavedPrintImagePreview] = useState(null);
    const [madrassaProfile, setMadrassaProfile] = useState(() => getAdminSession()?.madrassaProfile || null);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');

    const [parentSearch, setParentSearch] = useState('');
    const [parentResults, setParentResults] = useState([]);
    const [isParentSearching, setIsParentSearching] = useState(false);
    const [parentSearchError, setParentSearchError] = useState('');
    const [selectedParentId, setSelectedParentId] = useState(null);
    const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);

    const [classOptions, setClassOptions] = useState([]);
    const [sectionOptions, setSectionOptions] = useState([]);
    const [teacherOptions, setTeacherOptions] = useState([]);
    const [selectedRequiredClassId, setSelectedRequiredClassId] = useState(null);

    useNotificationBridge({ error: submitError, success: submitSuccess });
    useNotificationBridge({ error: parentSearchError });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadAdmissionNumber = async () => {
            if (editingStudentId) {
                setIsAdmissionNumberLoading(false);
                return;
            }

            setIsAdmissionNumberLoading(true);

            try {
                const nextAdmissionNumber = await fetchNextAdmissionNumber();
                if (isMounted) {
                    setInitialFormValues({ ...INITIAL_VALUES, idNo: nextAdmissionNumber });
                }
            } catch {
                if (isMounted) {
                    setInitialFormValues({ ...INITIAL_VALUES, idNo: DEFAULT_ADMISSION_NUMBER });
                    setSubmitError('داخلہ نمبر خودکار طور پر نہیں بن سکا۔ پہلے سے طے شدہ سلسلہ 0001 سے شروع کر دیا گیا ہے۔');
                }
            } finally {
                if (isMounted) {
                    setIsAdmissionNumberLoading(false);
                }
            }
        };

        loadAdmissionNumber();

        return () => {
            isMounted = false;
        };
    }, [editingStudentId]);

    useEffect(() => {
        if (!editingStudentId) return undefined;

        let isMounted = true;

        const loadStudentForEdit = async () => {
            setIsAdmissionNumberLoading(true);
            setSubmitError('');

            try {
                const student = await getStudentById(editingStudentId);
                if (!isMounted) return;

                const nextValues = mapStudentToFormValues(student);
                const primaryParentLink = student?.parents?.find((item) => item.isPrimary) || student?.parents?.[0];

                setInitialFormValues(nextValues);
                setSelectedParentId(primaryParentLink?.parent?.id || null);
                setParentSearch(primaryParentLink?.parent?.fullName || '');
                setImagePreview(student?.imageUrl ? getApiAssetUrl(student.imageUrl) : null);
            } catch (error) {
                if (isMounted) {
                    setSubmitError(error.message || 'طالب علم کی معلومات لوڈ نہیں ہو سکیں۔');
                }
            } finally {
                if (isMounted) {
                    setIsAdmissionNumberLoading(false);
                }
            }
        };

        loadStudentForEdit();

        return () => {
            isMounted = false;
        };
    }, [editingStudentId]);

    useEffect(() => {
        let isMounted = true;

        const loadMadrassaProfile = async () => {
            try {
                const profile = await fetchMadrassaProfile();
                if (isMounted) {
                    setMadrassaProfile(profile);
                }
            } catch {
                if (isMounted) {
                    setMadrassaProfile(getAdminSession()?.madrassaProfile || null);
                }
            }
        };

        loadMadrassaProfile();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const loadDropdownOptions = async () => {
            try {
                const [classesResponse, sectionsResponse, teachersResponse] = await Promise.all([
                    getClasses('page=1&limit=100'),
                    getSections('page=1&limit=100'),
                    getTeachers('page=1&limit=100&staffType=teacher'),
                ]);

                setClassOptions((classesResponse?.items || []).filter((item) => item.status === 'active'));
                setSectionOptions((sectionsResponse?.items || []).filter((item) => item.status === 'active'));
                setTeacherOptions((teachersResponse?.items || []).filter((item) => item.status === 'active'));
            } catch {
                setClassOptions([]);
                setSectionOptions([]);
                setTeacherOptions([]);
            }
        };

        loadDropdownOptions();
    }, []);

    useEffect(() => {
        const trimmedQuery = parentSearch.trim();

        if (trimmedQuery.length < 2) {
            setParentResults([]);
            setIsParentSearching(false);
            setParentSearchError('');
            setIsParentDropdownOpen(false);
            return undefined;
        }

        const timeoutId = setTimeout(async () => {
            setIsParentSearching(true);
            setParentSearchError('');

            try {
                const response = await getParents(`search=${encodeURIComponent(trimmedQuery)}&limit=6&status=active`);
                setParentResults(response?.items || []);
                setIsParentDropdownOpen(true);
            } catch (error) {
                setParentResults([]);
                setIsParentDropdownOpen(true);
                setParentSearchError(error.message || 'والدین کا ریکارڈ حاصل نہیں ہو سکا۔');
            } finally {
                setIsParentSearching(false);
            }
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [parentSearch]);

    const filteredJamaatOptions = useMemo(
        () =>
            sectionOptions
                .filter((item) => !selectedRequiredClassId || item.classId === selectedRequiredClassId)
                .map((item) => ({
                    id: item.id,
                    label: item.name,
                    meta: item.class?.name || '',
                })),
        [sectionOptions, selectedRequiredClassId],
    );

    const handleParentSelect = (parent, setFieldValue) => {
        setSelectedParentId(parent.id);
        setParentSearch(parent.fullName || '');
        setParentResults([]);
        setIsParentDropdownOpen(false);

        setFieldValue('fatherName', parent.fullName || '');
        setFieldValue('mobile', parent.phone || '');
        setFieldValue('guardianName', parent.fullName || '');
        setFieldValue('guardianMobile', parent.phone || '');
        setFieldValue('guardianEmail', parent.email || '');
        setFieldValue('guardianCnic', parent.cnic || '');
        setFieldValue('cnic', parent.cnic || '');
        setFieldValue('fatherOccupation', parent.occupation || '');
        setFieldValue('currentAddress', parent.address || '');
        setFieldValue('permanentAddress', parent.address || '');

        const primaryStudentLink = parent.students?.find((studentLink) => studentLink?.isPrimary);
        setFieldValue('relation', primaryStudentLink?.relationship || 'father');
    };

    const handleFormSubmit = async (values, { setSubmitting, resetForm }) => {
        setSubmitError('');
        setSubmitSuccess('');

        try {
            const admissionNumber = values.idNo?.trim() || initialFormValues.idNo || DEFAULT_ADMISSION_NUMBER;
            const submittedValues = { ...values, idNo: admissionNumber };

            if (!admissionNumber || !submittedValues.fullName?.trim() || !submittedValues.fatherName?.trim() || !submittedValues.gender) {
                setSubmitError('براہ کرم داخلہ نمبر، طالب علم کا نام، والد کا نام اور جنس لازمی مکمل کریں۔');
                return;
            }

            const parents = [];
            const guardianRelation = submittedValues.relation?.trim() || 'father';
            const guardianIsFather =
                submittedValues.guardianName?.trim() === submittedValues.fatherName?.trim();

            if (submittedValues.fatherName) {
                parents.push({
                    ...(selectedParentId ? { parentId: selectedParentId } : {}),
                    fullName: submittedValues.fatherName,
                    relationship: guardianIsFather ? guardianRelation : 'father',
                    isPrimary: true,
                    phone: submittedValues.mobile,
                    cnic: submittedValues.cnic,
                    occupation: submittedValues.fatherOccupation,
                    address: submittedValues.currentAddress,
                });
            }

            if (submittedValues.guardianName && !guardianIsFather) {
                parents.push({
                    ...(selectedParentId ? { parentId: selectedParentId } : {}),
                    fullName: submittedValues.guardianName,
                    relationship: guardianRelation,
                    isPrimary: false,
                    phone: submittedValues.guardianMobile,
                    email: submittedValues.guardianEmail,
                    cnic: submittedValues.guardianCnic,
                    address: submittedValues.currentAddress,
                });
            }

            const payload = {
                admissionNumber,
                admissionDate: submittedValues.admissionDate,
                admissionFee: submittedValues.admissionFee,
                fullName: submittedValues.fullName,
                fatherName: submittedValues.fatherName,
                gender: submittedValues.gender,
                caste: submittedValues.caste,
                cnic: submittedValues.cnic,
                dob: submittedValues.dob,
                bForm: submittedValues.bForm,
                phone: submittedValues.mobile || submittedValues.whatsapp,
                whatsapp: submittedValues.whatsapp,
                address: submittedValues.currentAddress,
                currentAddress: submittedValues.currentAddress,
                permanentAddress: submittedValues.permanentAddress,
                district: submittedValues.district,
                prevMadrassa: submittedValues.prevMadrassa,
                prevSchool: submittedValues.prevSchool,
                secularEdu: submittedValues.secularEdu,
                religiousEdu: submittedValues.religiousEdu,
                requiredClass: submittedValues.requiredClass,
                requiredJamaat: submittedValues.requiredJamaat,
                teacherName: submittedValues.teacherName,
                medicalCondition: submittedValues.medicalCondition,
                monthlyFee: submittedValues.monthlyFee,
                reside: submittedValues.reside,
                parents,
                image: imageFile,
            };

            const student = editingStudentId
                ? await updateStudent(editingStudentId, payload)
                : await createStudent(payload);

            let nextAdmissionNumber = buildNextAdmissionNumber([{ admissionNumber: student?.admissionNumber || admissionNumber }]);

            if (!editingStudentId) {
                try {
                    nextAdmissionNumber = await fetchNextAdmissionNumber();
                } catch {
                    // Keep the local next number when refreshing the list is unavailable.
                }
            }

            const nextInitialValues = editingStudentId ? mapStudentToFormValues(student) : { ...INITIAL_VALUES, idNo: nextAdmissionNumber };

            setSavedProfile(student);
            setSavedPrintValues(buildPrintValues(submittedValues, student));
            setSavedPrintImagePreview(imagePreview);
            setShowModal(true);
            setInitialFormValues(nextInitialValues);
            resetForm({ values: nextInitialValues });
            setImageFile(null);

            if (!editingStudentId) {
                setImagePreview(null);
                setParentSearch('');
                setParentResults([]);
                setSelectedParentId(null);
                setSelectedRequiredClassId(null);
                setIsParentDropdownOpen(false);
            }
            setSubmitSuccess(editingStudentId
                ? 'طالب علم کا ریکارڈ کامیابی سے اپڈیٹ ہو گیا۔'
                : 'طالب علم کا داخلہ کامیابی سے محفوظ ہو گیا۔');
        } catch (error) {
            setSubmitError(error.message || 'طالب علم کا ریکارڈ محفوظ نہیں ہو سکا۔');
        } finally {
            setSubmitting(false);
        }
    };

    const triggerPrint = () => {
        setShowModal(false);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.print();
            });
        });
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-2 bg-[var(--color-bg)]" dir="rtl">
            <Formik initialValues={initialFormValues} enableReinitialize onSubmit={handleFormSubmit}>
                {({ setFieldValue, values, isSubmitting }) => {
                    const printValues = savedPrintValues || values;
                    const printImagePreview = savedPrintImagePreview || imagePreview;
                    const madrassaName = madrassaProfile?.name?.trim() || 'جامعہ انوار القرآن';

                    return (
                    <>
                        <Form className="admission-form print:hidden space-y-8 pb-10">
                            <div className="bg-[var(--color-surface)] rounded-[2rem] shadow-2xl border border-[#00d094]/30 overflow-hidden">
                                <div className="bg-[#002a33] p-8 text-center text-white">
                                    <h2 className="text-3xl font-bold">طالب علم رجسٹریشن فارم</h2>
                                    <p className="text-emerald-400 mt-2">{madrassaName}</p>
                                </div>

                                <div className="p-6 md:p-10 space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-4 gap-6 items-end border-b pb-8">
                                        <FormikInputField
                                            label="داخلہ نمبر"
                                            name="idNo"
                                            required
                                            placeholder={isAdmissionNumberLoading ? 'بن رہا ہے...' : ''}
                                            className="text-[var(--color-text-main)]"
                                        />
                                        <FormikInputField label="داخلہ فیس" name="admissionFee" />
                                        <FormikInputField label="تاریخ داخلہ" name="admissionDate" type="date" />
                                        <div className="flex justify-center">
                                            <label className="w-28 h-34 border-4 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition-all overflow-hidden bg-slate-50">
                                                {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" alt="preview" /> : <Camera className="text-slate-400" />}
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(event) => {
                                                        const file = event.target.files?.[0];
                                                        if (!file) return;
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setImagePreview(reader.result);
                                                            setImageFile(file);
                                                            setFieldValue('studentImage', file.name);
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex flex-row justify-end items-start">
                                        <div className="flex h-16 w-full max-w-xl flex-row items-stretch overflow-visible rounded-2xl border-2 border-slate-100 bg-white shadow-sm transition-all hover:border-emerald-400">
                                            <div className="flex w-20 shrink-0 items-center justify-center rounded-r-2xl bg-[#00d094] text-[#002a33] transition-colors hover:bg-[#00b37e]">
                                                <Search size={22} strokeWidth={2.5} className="group-hover:text-white" />
                                            </div>
                                            <div className="relative w-full">
                                                <input
                                                    type="text"
                                                    value={parentSearch}
                                                    onChange={(event) => {
                                                        setSelectedParentId(null);
                                                        setParentSearch(event.target.value);
                                                        setIsParentDropdownOpen(Boolean(event.target.value.trim()));
                                                    }}
                                                    onFocus={() => {
                                                        if (parentSearch.trim().length >= 2) {
                                                            setIsParentDropdownOpen(true);
                                                        }
                                                    }}
                                                    placeholder="والدین تلاش کریں..."
                                                    className="h-full w-full rounded-l-2xl bg-slate-50 px-5 text-right text-lg font-medium leading-normal text-[#002a33] outline-none placeholder:text-slate-400 focus:bg-white"
                                                    dir="rtl"
                                                />
                                                {isParentDropdownOpen && parentSearch.trim().length >= 2 ? (
                                                    <div className="absolute top-full right-0 left-0 mt-2 rounded-2xl border border-slate-200 bg-white shadow-2xl z-20 overflow-hidden">
                                                        {isParentSearching ? (
                                                            <div className="px-4 py-3 text-sm text-slate-500 text-right">والدین کا ریکارڈ تلاش کیا جا رہا ہے...</div>
                                                        ) : parentResults.length > 0 ? (
                                                            parentResults.map((parent) => (
                                                                <button
                                                                    key={parent.id}
                                                                    type="button"
                                                                    onClick={() => handleParentSelect(parent, setFieldValue)}
                                                                    className={`w-full px-4 py-3 text-right transition-colors border-b border-slate-100 last:border-b-0 ${
                                                                        selectedParentId === parent.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-700'
                                                                    }`}
                                                                >
                                                                    <div className="font-semibold">{parent.fullName}</div>
                                                                    <div className="text-xs text-slate-500">
                                                                        {[parent.familyNumber, parent.phone, parent.email, parent.cnic].filter(Boolean).join(' | ') || 'مزید معلومات دستیاب نہیں۔'}
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-3 text-sm text-slate-500 text-right">کوئی والدین ریکارڈ نہیں ملا۔</div>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <FormSection title="بنیادی معلومات" icon={<User size={20} />}>
                                        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
                                            <FormikInputField
                                                label="نام طالب علم"
                                                name="fullName"
                                                required
                                                className="admission-urdu-input"
                                            />
                                            <FormikInputField
                                                label="والد کا نام"
                                                name="fatherName"
                                                required
                                                className="admission-urdu-input"
                                            />
                                            <FormikSelectField
                                                label="جنس"
                                                name="gender"
                                                required
                                                options={[
                                                    { value: 'male', label: 'مرد' },
                                                    { value: 'female', label: 'خاتون' },
                                                    { value: 'other', label: 'دیگر' },
                                                ]}
                                            />
                                            <FormikInputField label="قومیت / ذات" name="caste" />
                                            <FormikInputField label="شناختی کارڈ نمبر" name="cnic" />
                                            <FormikInputField label="بے فارم نمبر" name="bForm" />
                                            <FormikInputField label="تاریخ پیدائش" name="dob" type="date" />
                                        </div>
                                    </FormSection>

                                    <FormSection title="رابطہ اور پتہ" icon={<MapPin size={20} />}>
                                        <div className="grid grid-cols-1 gap-6 mb-6">
                                            <FormikInputField
                                                label="حالیہ پتہ"
                                                name="currentAddress"
                                                className="admission-urdu-input"
                                            />
                                            <FormikInputField
                                                label="مستقل پتہ"
                                                name="permanentAddress"
                                                className="admission-urdu-input"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <FormikInputField
                                                label="ضلع"
                                                name="district"
                                                className="admission-urdu-input"
                                            />
                                            <FormikInputField label="والد کا پیشہ" name="fatherOccupation" />
                                            <FormikInputField label="موبائل نمبر" name="mobile" />
                                            <FormikInputField label="واٹس ایپ" name="whatsapp" />
                                        </div>
                                    </FormSection>

                                    <FormSection title="سرپرست کی تفصیل" icon={<Phone size={20} />}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <FormikInputField label="نام سرپرست" name="guardianName" />
                                            <FormikInputField label="رشتہ" name="relation" />
                                            <FormikInputField label="سرپرست موبائل" name="guardianMobile" />
                                            <FormikInputField label="سرپرست CNIC" name="guardianCnic" />
                                            <FormikInputField label="ای میل" name="guardianEmail" />
                                        </div>
                                    </FormSection>

                                    <FormSection title="تعلیمی ریکارڈ" icon={<BookOpen size={20} />}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <FormikInputField label="دینی تعلیم" name="religiousEdu" />
                                            <FormikInputField label="عصری تعلیم" name="secularEdu" />
                                            <FormikInputField label="سابقہ مدرسہ" name="prevMadrassa" />
                                            <FormikInputField label="سابقہ اسکول" name="prevSchool" />

                                            <Field name="requiredClass">
                                                {({ field, form }) => (
                                                    <SearchableSelectField
                                                        label="مطلوبہ درجہ"
                                                        value={field.value || ''}
                                                        options={classOptions.map((item) => ({
                                                            id: item.id,
                                                            label: item.name,
                                                            meta: '',
                                                        }))}
                                                        placeholder="درجہ تلاش کریں"
                                                        onChange={(nextValue) => form.setFieldValue('requiredClass', nextValue)}
                                                        onSelectOption={(option) => {
                                                            setSelectedRequiredClassId(option?.id || null);
                                                            form.setFieldValue('requiredClass', option?.label || '');
                                                            form.setFieldValue('requiredJamaat', '');
                                                        }}
                                                    />
                                                )}
                                            </Field>

                                            <Field name="requiredJamaat">
                                                {({ field, form }) => (
                                                    <SearchableSelectField
                                                        label="جماعت"
                                                        value={field.value || ''}
                                                        options={filteredJamaatOptions}
                                                        placeholder="جماعت تلاش کریں"
                                                        onChange={(nextValue) => form.setFieldValue('requiredJamaat', nextValue)}
                                                        onSelectOption={(option) => form.setFieldValue('requiredJamaat', option?.label || '')}
                                                    />
                                                )}
                                            </Field>

                                            <Field name="teacherName">
                                                {({ field, form }) => (
                                                    <SearchableSelectField
                                                        label="استاد کا نام"
                                                        value={field.value || ''}
                                                        options={teacherOptions.map((item) => ({
                                                            id: item.id,
                                                            label: item.fullName,
                                                            meta: item.subject || item.phone || '',
                                                        }))}
                                                        placeholder="استاد تلاش کریں"
                                                        onChange={(nextValue) => form.setFieldValue('teacherName', nextValue)}
                                                        onSelectOption={(option) => form.setFieldValue('teacherName', option?.label || '')}
                                                    />
                                                )}
                                            </Field>
                                        </div>
                                    </FormSection>

                                    <FormSection title="دیگر معلومات" icon={<HeartPulse size={20} />}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <FormikInputField label="ماہانہ فیس" name="monthlyFee" />
                                            <FormikInputField label="بیماری (اگر ہے)" name="medicalCondition" />
                                            <FormikInputField label="رہائشی (ہاں/نہیں)" name="reside" />
                                        </div>
                                    </FormSection>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-[#00d094] hover:bg-[#00b37e] text-[#002a33] py-6 rounded-2xl font-black text-2xl transition-all shadow-xl flex items-center justify-center gap-4"
                                    >
                                        <Save size={28} /> {isSubmitting ? 'محفوظ ہو رہا ہے...' : 'ڈیٹا محفوظ کریں'}
                                    </button>
                                </div>
                            </div>
                        </Form>

                        {showModal ? (
                            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 print:hidden">
                                <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl scale-in-center">
                                    <div className="bg-[#002a33] p-8 text-center text-white relative">
                                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
                                            <X />
                                        </button>
                                        <div className="bg-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle size={32} />
                                        </div>
                                        <h3 className="text-2xl font-bold">ڈیٹا محفوظ ہو گیا!</h3>
                                    </div>
                                    <div className="p-10 space-y-6 text-center">
                                        <p className="text-slate-600 text-lg">
                                            طالب علم <b>{savedProfile?.fullName || printValues.fullName}</b> کا فارم مکمل ہو چکا ہے۔ کیا آپ ابھی پرنٹ نکالنا چاہتے ہیں؟
                                        </p>
                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={triggerPrint}
                                                className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
                                            >
                                                <Printer /> ابھی پرنٹ نکالیں
                                            </button>
                                            <button
                                                onClick={() => setShowModal(false)}
                                                className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                            >
                                                صرف محفوظ کریں
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="admission-print-area hidden print:block w-full text-[13px] px-2 py-3 relative" dir="rtl" style={{ fontFamily: 'Jameel Noori Nastaleeq, Noto Nastaliq Urdu, serif' }}>
                            <div className="absolute inset-0 flex items-center justify-center z-0" style={{ pointerEvents: 'none' }}>
                                <img
                                    src={AppImages.logo}
                                    alt="Jamia Logo Watermark"
                                    className="w-[600px] h-[300px] -mt-40 object-contain"
                                    style={{ webkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                                />
                            </div>

                            <div className="border-[3px] border-[#004a5e] border-dashed rounded-md p-6 relative bg-white h-[1095px] z-10">
                                <div className="text-center border-b-2 border-[#004a5e] pb-2 mb-6">
                                    <h1 className="text-4xl font-bold text-[#0f172a]">{madrassaName}</h1>
                                    <div className="bg-[#00d094] text-white px-6 py-2 rounded-full shadow-xl inline-block text-lg font-bold mt-7">داخلہ فارم</div>
                                </div>

                                <div className="flex gap-6 mb-8 items-start">
                                    <div className="w-32 h-40 border-2 border-[#00d094] rounded-xl flex-shrink-0 flex items-center justify-center bg-gray-50 z-20">
                                        {printImagePreview ? <img src={printImagePreview} className="w-full h-full object-cover rounded-lg" alt="Student" /> : <span className="text-xs">تصویر</span>}
                                    </div>
                                    <div className="flex-1 space-y-6 pt-2">
                                        <div className="flex gap-4">
                                            <PrintLine label="داخلہ نمبر" value={printValues.idNo} />
                                            <PrintLine label="تاریخ داخلہ" value={formatDate(printValues.admissionDate)} />
                                        </div>
                                        <div className="flex gap-4">
                                            <PrintLine label="داخلہ فیس" value={printValues.admissionFee} />
                                            <PrintLine label="قومیت / ذات" value={printValues.caste} />
                                        </div>
                                        <PrintLine label="نام طالب علم" value={printValues.fullName} flex="1.5" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex gap-6">
                                        <PrintLine label="والد کا نام" value={printValues.fatherName} />
                                        <PrintLine label="شناختی کارڈ نمبر" value={printValues.cnic} />
                                    </div>
                                    <div className="flex gap-6">
                                        <PrintLine label="بے فارم نمبر" value={printValues.bForm} />
                                        <PrintLine label="تاریخ پیدائش" value={formatDate(printValues.dob)} />
                                    </div>
                                    <PrintLine label="حالیہ پتہ" value={printValues.currentAddress} />
                                    <PrintLine label="مستقل پتہ" value={printValues.permanentAddress} />
                                    <div className="grid grid-cols-3 gap-6">
                                        <PrintLine label="ضلع" value={printValues.district} />
                                        <PrintLine label="موبائل نمبر" value={printValues.mobile} />
                                        <PrintLine label="واٹس ایپ" value={printValues.whatsapp} />
                                    </div>

                                    <div className="bg-[#e5faf4]/80 p-4 shadow-sm rounded-lg space-y-4 border border-[#00d094]/20">
                                        <div className="flex gap-6">
                                            <PrintLine label="نام سرپرست" value={printValues.guardianName} />
                                            <PrintLine label="رشتہ" value={printValues.relation} />
                                        </div>
                                        <div className="flex gap-6">
                                            <PrintLine label="سرپرست موبائل" value={printValues.guardianMobile} />
                                            <PrintLine label="سرپرست CNIC" value={printValues.guardianCnic} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-10 gap-y-6 border-t pt-4 border-[#004a5e]">
                                        <PrintLine label="دینی تعلیم" value={printValues.religiousEdu} />
                                        <PrintLine label="عصری تعلیم" value={printValues.secularEdu} />
                                        <PrintLine label="سابقہ مدرسہ" value={printValues.prevMadrassa} />
                                        <PrintLine label="سابقہ اسکول" value={printValues.prevSchool} />
                                        <PrintLine label="بیماری" value={printValues.medicalCondition} />
                                        <PrintLine label="استاد کا نام" value={printValues.teacherName} />
                                    </div>

                                    <div className="flex gap-6 bg-[#e5faf4]/80 shadow-sm p-3 rounded border border-[#00d094]/20">
                                        <PrintLine label="مطلوبہ درجہ" value={printValues.requiredClass} />
                                        <PrintLine label="جماعت" value={printValues.requiredJamaat} />
                                        <PrintLine label="ماہانہ فیس" value={printValues.monthlyFee} />
                                    </div>
                                </div>

                            </div>
                        </div>

                        <style
                            dangerouslySetInnerHTML={{
                                __html: `
                            @media print {
                                @page { size: A4 portrait; margin: 0; }
                                html, body, #root { width: 100%; min-height: 100%; }
                                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                body * { visibility: hidden; }
                                .admission-print-area,
                                .admission-print-area * {
                                    visibility: visible !important;
                                }
                                .admission-print-area {
                                    display: block !important;
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    width: 100%;
                                    font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif;
                                }
                                h1 { font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif !important; }
                            }
                        `,
                            }}
                        />
                    </>
                    );
                }}
            </Formik>
        </div>
    );
};

const FormSection = ({ title, icon, children }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#002a33] flex items-center gap-2 border-r-4 border-[#00d094] pr-3 bg-slate-50 py-2 rounded-l-lg">
            {icon} {title}
        </h3>
        {children}
    </div>
);

const FormikInputField = ({ label, name, type = 'text', className = '', ...props }) => (
    <Field name={name}>
        {({ field, form }) =>
            type === 'date' ? (
                <DateField
                    label={label}
                    name={name}
                    value={field.value || ''}
                    onChange={(nextValue) => form.setFieldValue(name, nextValue)}
                    className={`admission-date-field ${className}`}
                    {...props}
                />
            ) : (
                <InputField
                    label={label}
                    type={type}
                    {...field}
                    {...props}
                    value={field.value || ''}
                    className={`admission-form-control ${className}`}
                />
            )
        }
    </Field>
);

const FormikSelectField = ({ label, name, options, required = false }) => (
    <Field name={name}>
        {({ field, form }) => (
            <SelectField
                label={label}
                required={required}
                options={options}
                value={field.value || options[0]?.value || options[0]}
                onChange={(event) => form.setFieldValue(name, event.target.value)}
                className="admission-form-control"
            />
        )}
    </Field>
);

const SearchableSelectField = ({ label, value, options, onChange, onSelectOption, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);

    const filteredOptions = useMemo(() => {
        const query = String(value || '').trim().toLowerCase();
        if (!query) return options;

        return options.filter((option) =>
            [option.label, option.meta]
                .filter(Boolean)
                .some((item) => String(item).toLowerCase().includes(query)),
        );
    }, [options, value]);

    return (
        <div className="space-y-2 relative">
            <label className="text-[11px] font-black text-[var(--color-text-muted)] mr-2 uppercase tracking-widest">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(event) => {
                        onChange(event.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                    placeholder={placeholder}
                    className="admission-form-control w-full rounded-2xl border outline-none font-bold transition-all bg-[var(--color-input)] border-transparent focus:border-[var(--color-primary)]"
                />
                <ChevronDown size={18} className="absolute left-4 top-4 text-[var(--color-text-muted)] pointer-events-none" />

                {isOpen ? (
                    <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.slice(0, 12).map((option) => (
                                <button
                                    key={`${label}-${option.id}-${option.label}`}
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => {
                                        onSelectOption(option);
                                        setIsOpen(false);
                                    }}
                                    className="block w-full border-b border-[var(--color-border)] px-4 py-3 text-right transition-colors hover:bg-[var(--color-bg)] last:border-b-0"
                                >
                                    <div className="font-bold text-[var(--color-text-main)]">{option.label}</div>
                                    {option.meta ? <div className="mt-1 text-xs text-[var(--color-text-muted)]">{option.meta}</div> : null}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-right text-[var(--color-text-muted)]">کوئی ریکارڈ نہیں ملا۔</div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const PrintLine = ({ label, value, flex = '1' }) => (
    <div style={{ flex }} className="flex items-baseline gap-2">
        <span className="font-bold text-gray-800 whitespace-nowrap">{label}:</span>
        <span className="flex-1 border-b border-black border-dotted min-h-[22px] px-2 text-[14px] font-bold text-[#0f172a]" style={{ color: '#0f172a' }}>
            {value || ''}
        </span>
    </div>
);
