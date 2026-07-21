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
import { CNIC_INPUT_MAX_LENGTH, formatCnicInput, isCompleteCnic } from '../../../Utils/cnicFormat';

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
    relation: '',
    guardianMobile: '',
    guardianWhatsapp: '',
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
const MIN_PARENT_SEARCH_LENGTH = 1;

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

const isBlank = (value) => !String(value || '').trim();
const isValidEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
const isValidAmount = (value) => value === '' || value === null || value === undefined || (Number.isFinite(Number(value)) && Number(value) >= 0);
const isValidPhone = (value) => !value || /^[0-9+\-\s()]{7,20}$/.test(String(value).trim());
const isValidOptionalCnic = (value) => !String(value || '').trim() || isCompleteCnic(value);

const admissionValidationMessages = {
    idNo: 'داخلہ نمبر لازمی درج کریں۔',
    admissionDate: 'تاریخ داخلہ لازمی منتخب کریں۔',
    admissionFee: 'داخلہ فیس لازمی درج کریں۔',
    fullName: 'طالب علم کا نام لازمی درج کریں۔',
    fatherName: 'والد کا نام لازمی درج کریں۔',
    gender: 'جنس لازمی منتخب کریں۔',
    dob: 'تاریخ پیدائش لازمی منتخب کریں۔',
    currentAddress: 'حالیہ پتہ لازمی درج کریں۔',
    permanentAddress: 'مستقل پتہ لازمی درج کریں۔',
    guardianName: 'سرپرست کا نام لازمی درج کریں۔',
    relation: 'رشتہ لازمی درج کریں۔',
    guardianMobile: 'سرپرست موبائل لازمی درج کریں۔',
    monthlyFee: 'ماہانہ فیس لازمی درج کریں۔',
    email: 'درست ای میل درج کریں۔',
    phone: 'درست فون نمبر درج کریں۔',
    amount: 'رقم درست درج کریں۔',
    cnic: 'شناختی کارڈ نمبر 00000-0000000-0 کے فارمیٹ میں درج کریں۔',
};

const validateAdmissionForm = (values) => {
    const errors = {};

    if (isBlank(values.idNo)) errors.idNo = admissionValidationMessages.idNo;
    if (isBlank(values.admissionDate)) errors.admissionDate = admissionValidationMessages.admissionDate;
    if (isBlank(values.admissionFee)) errors.admissionFee = admissionValidationMessages.admissionFee;
    if (isBlank(values.fullName)) errors.fullName = admissionValidationMessages.fullName;
    if (isBlank(values.fatherName)) errors.fatherName = admissionValidationMessages.fatherName;
    if (isBlank(values.gender)) errors.gender = admissionValidationMessages.gender;
    if (isBlank(values.dob)) errors.dob = admissionValidationMessages.dob;
    if (isBlank(values.currentAddress)) errors.currentAddress = admissionValidationMessages.currentAddress;
    if (isBlank(values.permanentAddress)) errors.permanentAddress = admissionValidationMessages.permanentAddress;
    if (isBlank(values.guardianName)) errors.guardianName = admissionValidationMessages.guardianName;
    if (isBlank(values.relation)) errors.relation = admissionValidationMessages.relation;
    if (isBlank(values.guardianMobile)) errors.guardianMobile = admissionValidationMessages.guardianMobile;
    if (isBlank(values.monthlyFee)) errors.monthlyFee = admissionValidationMessages.monthlyFee;
    if (!isValidAmount(values.admissionFee)) errors.admissionFee = admissionValidationMessages.amount;
    if (!isValidAmount(values.monthlyFee)) errors.monthlyFee = admissionValidationMessages.amount;
    if (!isValidEmail(values.guardianEmail)) errors.guardianEmail = admissionValidationMessages.email;
    if (!isValidPhone(values.mobile)) errors.mobile = admissionValidationMessages.phone;
    if (!isValidPhone(values.whatsapp)) errors.whatsapp = admissionValidationMessages.phone;
    if (!isValidPhone(values.guardianMobile)) errors.guardianMobile = admissionValidationMessages.phone;
    if (!isValidPhone(values.guardianWhatsapp)) errors.guardianWhatsapp = admissionValidationMessages.phone;
    if (!isValidOptionalCnic(values.cnic)) errors.cnic = admissionValidationMessages.cnic;
    if (!isValidOptionalCnic(values.guardianCnic)) errors.guardianCnic = admissionValidationMessages.cnic;

    return errors;
};

const toUrduAdmissionError = (message) => {
    if (!message) return 'براہ کرم مطلوبہ معلومات درست اور مکمل درج کریں۔';
    if (/[\u0600-\u06FF]/.test(message)) return message;
    if (/required|missing|invalid|must be|please fill|validation/i.test(message)) {
        return 'براہ کرم مطلوبہ معلومات درست اور مکمل درج کریں۔';
    }
    return message;
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
        mobile: student?.phone || '',
        whatsapp: student?.whatsapp || '',
        guardianName: guardian.fullName || '',
        relation: guardianLink.relationship || primaryParentLink.relationship || '',
        guardianMobile: guardian.phone || '',
        guardianWhatsapp: guardian.whatsapp || '',
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
    const [selectedParentName, setSelectedParentName] = useState('');
    const [isParentDropdownOpen, setIsParentDropdownOpen] = useState(false);
    const parentSearchContainerRef = React.useRef(null);

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
        const handlePointerDown = (event) => {
            if (!parentSearchContainerRef.current?.contains(event.target)) {
                setIsParentDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
        };
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
                setSelectedParentName(primaryParentLink?.parent?.fullName || '');
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
                    getClasses('page=1&limit=100&status=active'),
                    getSections('page=1&limit=100&status=active'),
                    getTeachers('page=1&limit=100&status=active&staffType=teacher'),
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
        const selectedName = selectedParentName.trim();

        if (selectedParentId && selectedName && trimmedQuery === selectedName) {
            setParentResults([]);
            setIsParentSearching(false);
            setParentSearchError('');
            setIsParentDropdownOpen(false);
            return undefined;
        }

        if (trimmedQuery.length < MIN_PARENT_SEARCH_LENGTH) {
            setParentResults([]);
            setIsParentSearching(false);
            setParentSearchError('');
            setIsParentDropdownOpen(false);
            return undefined;
        }

        let isCurrentSearch = true;

        const timeoutId = setTimeout(async () => {
            setIsParentSearching(true);
            setParentSearchError('');

            try {
                const response = await getParents(`search=${encodeURIComponent(trimmedQuery)}&limit=6&status=active`);
                if (!isCurrentSearch) return;
                setParentResults(response?.items || []);
                setIsParentDropdownOpen(true);
            } catch (error) {
                if (!isCurrentSearch) return;
                setParentResults([]);
                setIsParentDropdownOpen(true);
                setParentSearchError(error.message || 'والدین کا ریکارڈ حاصل نہیں ہو سکا۔');
            } finally {
                if (!isCurrentSearch) return;
                setIsParentSearching(false);
            }
        }, 350);

        return () => {
            isCurrentSearch = false;
            clearTimeout(timeoutId);
        };
    }, [parentSearch, selectedParentId, selectedParentName]);

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
        setSelectedParentName(parent.fullName || '');
        setParentSearch(parent.fullName || '');
        setParentResults([]);
        setIsParentDropdownOpen(false);

        setFieldValue('fatherName', parent.fullName || '');
        setFieldValue('guardianName', parent.fullName || '');
        setFieldValue('guardianMobile', parent.phone || '');
        setFieldValue('guardianWhatsapp', parent.whatsapp || '');
        setFieldValue('guardianEmail', parent.email || '');
        setFieldValue('guardianCnic', parent.cnic || '');
        setFieldValue('fatherOccupation', parent.occupation || '');
        setFieldValue('currentAddress', parent.address || '');
        setFieldValue('permanentAddress', parent.address || '');

        setFieldValue('relation', '');
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
                    phone: selectedParentId ? submittedValues.guardianMobile : submittedValues.mobile,
                    whatsapp: selectedParentId ? submittedValues.guardianWhatsapp : submittedValues.whatsapp,
                    email: selectedParentId ? submittedValues.guardianEmail : undefined,
                    cnic: selectedParentId ? submittedValues.guardianCnic : submittedValues.cnic,
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
                    whatsapp: submittedValues.guardianWhatsapp,
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
                setSelectedParentName('');
                setSelectedRequiredClassId(null);
                setIsParentDropdownOpen(false);
            }
            setSubmitSuccess(editingStudentId
                ? 'طالب علم کا ریکارڈ کامیابی سے اپڈیٹ ہو گیا۔'
                : 'طالب علم کا داخلہ کامیابی سے محفوظ ہو گیا۔');
        } catch (error) {
            setSubmitError(toUrduAdmissionError(error.message) || 'طالب علم کا ریکارڈ محفوظ نہیں ہو سکا۔');
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
            <Formik initialValues={initialFormValues} enableReinitialize validate={validateAdmissionForm} onSubmit={handleFormSubmit}>
                {({ setFieldValue, values, isSubmitting, errors, touched }) => {
                    const printValues = savedPrintValues || values;
                    const printImagePreview = savedPrintImagePreview || imagePreview;
                    const madrassaName = madrassaProfile?.name?.trim() || 'جامعہ انوار القرآن';
                    const madrassaLogo = madrassaProfile?.logoUrl ? getApiAssetUrl(madrassaProfile.logoUrl) : AppImages.logo;

                    return (
                    <>
                        <Form noValidate className="admission-form print:hidden space-y-8 pb-10">
                            <div className="bg-[var(--color-surface)] rounded-[2rem] shadow-2xl border border-[#00d094]/30 overflow-hidden">
                                <div className="bg-[#002a33] p-8 text-center text-white">
                                    <h2 className="text-3xl font-bold">طالب علم داخلہ فارم</h2>
                                    <p className="text-sm text-emerald-400 mt-2">{madrassaName}</p>
                                </div>

                                <div className="p-6 md:p-10 space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-4 gap-6 items-end border-b pb-8">
                                        <FormikInputField
                                            label="داخلہ نمبر"
                                            name="idNo"
                                            required
                                            error={touched.idNo && errors.idNo ? errors.idNo : ''}
                                            placeholder={isAdmissionNumberLoading ? 'بن رہا ہے...' : ''}
                                            className="text-[var(--color-text-main)]"
                                        />
                                        <FormikInputField label="داخلہ فیس" name="admissionFee" required error={touched.admissionFee && errors.admissionFee ? errors.admissionFee : ''} />
                                        <FormikInputField label="تاریخ داخلہ" name="admissionDate" type="date" required error={touched.admissionDate && errors.admissionDate ? errors.admissionDate : ''} />
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
                                        <div ref={parentSearchContainerRef} className="flex h-16 w-full max-w-xl flex-row items-stretch overflow-visible rounded-2xl border-2 border-slate-100 bg-white shadow-sm transition-all hover:border-emerald-400">
                                            <div className="flex w-20 shrink-0 items-center justify-center rounded-r-2xl bg-[#00d094] text-[#002a33] transition-colors hover:bg-[#00b37e]">
                                                <Search size={22} strokeWidth={2.5} className="group-hover:text-white" />
                                            </div>
                                            <div className="relative w-full">
                                                <input
                                                    type="text"
                                                    value={parentSearch}
                                                    onChange={(event) => {
                                                        setSelectedParentId(null);
                                                        setSelectedParentName('');
                                                        setParentSearch(event.target.value);
                                                        setIsParentDropdownOpen(event.target.value.trim().length >= MIN_PARENT_SEARCH_LENGTH);
                                                    }}
                                                    onFocus={() => {
                                                        if (
                                                            parentSearch.trim().length >= MIN_PARENT_SEARCH_LENGTH &&
                                                            parentSearch.trim() !== selectedParentName.trim()
                                                        ) {
                                                            setIsParentDropdownOpen(true);
                                                        }
                                                    }}
                                                    placeholder="سرپرست کو تلاش کریں..."
                                                    className="h-full w-full rounded-l-2xl bg-slate-50 px-5 text-right text-lg font-medium leading-normal text-[#002a33] outline-none placeholder:text-slate-400 focus:bg-white"
                                                    dir="rtl"
                                                />
                                                {isParentDropdownOpen && parentSearch.trim().length >= MIN_PARENT_SEARCH_LENGTH ? (
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
                                                error={touched.fullName && errors.fullName ? errors.fullName : ''}
                                                className="admission-urdu-input"
                                            />
                                            <FormikInputField
                                                label="والد کا نام"
                                                name="fatherName"
                                                required
                                                error={touched.fatherName && errors.fatherName ? errors.fatherName : ''}
                                                className="admission-urdu-input"
                                            />
                                            <FormikSelectField
                                                label="جنس"
                                                name="gender"
                                                required
                                                error={touched.gender && errors.gender ? errors.gender : ''}
                                                options={[
                                                    { value: 'male', label: 'مرد' },
                                                    { value: 'female', label: 'خاتون' },
                                                    { value: 'other', label: 'دیگر' },
                                                ]}
                                            />
                                            <FormikInputField label="قومیت / ذات" name="caste" />
                                            <FormikCnicField label="آئی ڈی نمبر" name="cnic" error={touched.cnic && errors.cnic ? errors.cnic : ''} />
                                            <FormikInputField label="بے فارم نمبر" name="bForm" />
                                            <FormikInputField label="تاریخ پیدائش" name="dob" type="date" required error={touched.dob && errors.dob ? errors.dob : ''} />
                                        </div>
                                    </FormSection>

                                    <FormSection title="رابطہ اور پتہ" icon={<MapPin size={20} />}>
                                        <div className="grid grid-cols-1 gap-6 mb-6">
                                            <FormikInputField
                                                label="حالیہ پتہ"
                                                name="currentAddress"
                                                required
                                                error={touched.currentAddress && errors.currentAddress ? errors.currentAddress : ''}
                                                className="admission-urdu-input"
                                            />
                                            <FormikInputField
                                                label="مستقل پتہ"
                                                name="permanentAddress"
                                                required
                                                error={touched.permanentAddress && errors.permanentAddress ? errors.permanentAddress : ''}
                                                className="admission-urdu-input"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <FormikInputField
                                                label="ضلع"
                                                name="district"
                                                className="admission-urdu-input"
                                            />
                                            <FormikInputField label="موبائل نمبر" name="mobile" error={touched.mobile && errors.mobile ? errors.mobile : ''} />
                                            <FormikInputField label="واٹس ایپ" name="whatsapp" error={touched.whatsapp && errors.whatsapp ? errors.whatsapp : ''} />
                                        </div>
                                    </FormSection>

                                    <FormSection title="سرپرست کی تفصیل" icon={<Phone size={20} />}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <FormikInputField label="نام سرپرست" name="guardianName" required error={touched.guardianName && errors.guardianName ? errors.guardianName : ''} />
                                            <FormikInputField label="رشتہ" name="relation" required error={touched.relation && errors.relation ? errors.relation : ''} />
                                            <FormikInputField label="سرپرست موبائل" name="guardianMobile" required error={touched.guardianMobile && errors.guardianMobile ? errors.guardianMobile : ''} />
                                            <FormikInputField label="سرپرست واٹس ایپ" name="guardianWhatsapp" error={touched.guardianWhatsapp && errors.guardianWhatsapp ? errors.guardianWhatsapp : ''} />
                                            <FormikCnicField label="سرپرست آئی ڈی نمبر" name="guardianCnic" error={touched.guardianCnic && errors.guardianCnic ? errors.guardianCnic : ''} />
                                            <FormikInputField label="سرپرست کا پیشہ" name="fatherOccupation" />
                                            <FormikInputField label="ای میل" name="guardianEmail" error={touched.guardianEmail && errors.guardianEmail ? errors.guardianEmail : ''} />
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
                                                        label="جماعت"
                                                        value={field.value || ''}
                                                        options={classOptions.map((item) => ({
                                                            id: item.id,
                                                            label: item.name,
                                                            meta: '',
                                                        }))}
                                                        placeholder="جماعت تلاش کریں"
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
                                                        label="سیکشن"
                                                        value={field.value || ''}
                                                        options={filteredJamaatOptions}
                                                        placeholder="سیکشن تلاش کریں"
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
                                            <FormikInputField label="ماہانہ فیس" name="monthlyFee" required error={touched.monthlyFee && errors.monthlyFee ? errors.monthlyFee : ''} />
                                            <FormikInputField label="بیماری (اگر ہے)" name="medicalCondition" />
                                            <FormikInputField label="رہائشی (ہاں/نہیں)" name="reside" />
                                        </div>
                                    </FormSection>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-[#00d094] hover:bg-[#00b37e] text-[#002a33] py-6 rounded-2xl font-black text-2xl transition-all shadow-xl flex items-center justify-center gap-4"
                                    >
                                        <Save size={28} /> {isSubmitting ? 'محفوظ ہو رہا ہے...' : 'محفوظ کریں'}
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

                        <div className="admission-print-area hidden print:block w-full text-[13px] relative" dir="rtl" style={{ fontFamily: 'Jameel Noori Nastaleeq, Noto Nastaliq Urdu, serif' }}>
                            <div className="absolute inset-0 flex items-center justify-center z-0" style={{ pointerEvents: 'none' }}>
                                <img
                                    src={madrassaLogo}
                                    alt="Jamia Logo Watermark"
                                    className="w-[600px] h-[300px] -mt-40 object-contain"
                                    style={{ webkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                                />
                            </div>

                            <div className="admission-print-sheet border-[3px] border-[#004a5e] border-dashed rounded-md p-6 relative bg-white z-10">
                                <div className="admission-print-header text-center border-b-2 border-[#004a5e] pb-2 mb-6">
                                    <h1 className="text-4xl font-bold text-[#0f172a]">{madrassaName}</h1>
                                    <div className="bg-[#00d094] text-white px-6 py-2 rounded-full shadow-xl inline-block text-lg font-bold mt-7">داخلہ فارم</div>
                                </div>

                                <div className="admission-print-top flex gap-6 mb-8 items-start">
                                    <div className="admission-print-photo w-32 h-40 border-2 border-[#00d094] rounded-xl flex-shrink-0 flex items-center justify-center bg-gray-50 z-20">
                                        {printImagePreview ? <img src={printImagePreview} className="w-full h-full object-cover rounded-lg" alt="Student" /> : <span className="text-xs">تصویر</span>}
                                    </div>
                                    <div className="admission-print-main-fields flex-1 space-y-6 pt-2">
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

                                <div className="admission-print-body space-y-6">
                                    <div className="flex gap-6">
                                        <PrintLine label="والد کا نام" value={printValues.fatherName} />
                                        <PrintLine label="آئی ڈی نمبر" value={printValues.cnic} />
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

                                    <div className="admission-print-guardian bg-[#e5faf4]/80 p-4 shadow-sm rounded-lg space-y-4 border border-[#00d094]/20">
                                        <div className="flex gap-6">
                                            <PrintLine label="نام سرپرست" value={printValues.guardianName} />
                                            <PrintLine label="رشتہ" value={printValues.relation} />
                                        </div>
                                        <div className="flex gap-6">
                                            <PrintLine label="سرپرست موبائل" value={printValues.guardianMobile} />
                                            <PrintLine label="سرپرست واٹس ایپ" value={printValues.guardianWhatsapp} />
                                        </div>
                                        <div className="flex gap-6">
                                            <PrintLine label="سرپرست آئی ڈی نمبر" value={printValues.guardianCnic} />
                                            <PrintLine label="ای میل" value={printValues.guardianEmail} />
                                        </div>
                                    </div>

                                    <div className="admission-print-education grid grid-cols-2 gap-x-10 gap-y-6 border-t pt-4 border-[#004a5e]">
                                        <PrintLine label="دینی تعلیم" value={printValues.religiousEdu} />
                                        <PrintLine label="عصری تعلیم" value={printValues.secularEdu} />
                                        <PrintLine label="سابقہ مدرسہ" value={printValues.prevMadrassa} />
                                        <PrintLine label="سابقہ اسکول" value={printValues.prevSchool} />
                                        <PrintLine label="بیماری" value={printValues.medicalCondition} />
                                        <PrintLine label="استاد کا نام" value={printValues.teacherName} />
                                    </div>

                                    <div className="admission-print-class flex gap-6 bg-[#e5faf4]/80 shadow-sm p-3 rounded border border-[#00d094]/20">
                                        <PrintLine label="جماعت" value={printValues.requiredClass} />
                                        <PrintLine label="سیکشن" value={printValues.requiredJamaat} />
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
                                html, body, #root {
                                    width: 210mm;
                                    height: 297mm;
                                    min-height: 297mm;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    overflow: hidden !important;
                                    background: #ffffff !important;
                                }
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
                                    width: 210mm !important;
                                    height: 297mm !important;
                                    padding: 7mm 8mm !important;
                                    overflow: hidden !important;
                                    background: #ffffff !important;
                                    font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', serif;
                                }
                                .admission-print-sheet {
                                    width: 194mm !important;
                                    height: 283mm !important;
                                    max-height: 283mm !important;
                                    overflow: hidden !important;
                                    padding: 8mm !important;
                                    break-inside: avoid !important;
                                    page-break-inside: avoid !important;
                                }
                                .admission-print-header {
                                    margin-bottom: 4mm !important;
                                    padding-bottom: 2mm !important;
                                }
                                .admission-print-header h1 {
                                    font-size: 25px !important;
                                    line-height: 1.25 !important;
                                }
                                .admission-print-header div {
                                    margin-top: 3mm !important;
                                    padding: 1.5mm 9mm !important;
                                    font-size: 15px !important;
                                }
                                .admission-print-top {
                                    gap: 5mm !important;
                                    margin-bottom: 4mm !important;
                                }
                                .admission-print-photo {
                                    width: 26mm !important;
                                    height: 33mm !important;
                                }
                                .admission-print-main-fields,
                                .admission-print-body,
                                .admission-print-guardian {
                                    gap: 0 !important;
                                    row-gap: 0 !important;
                                }
                                .admission-print-main-fields,
                                .admission-print-body {
                                    --tw-space-y-reverse: 0 !important;
                                }
                                .admission-print-main-fields > :not([hidden]) ~ :not([hidden]) {
                                    margin-top: 4mm !important;
                                }
                                .admission-print-body > :not([hidden]) ~ :not([hidden]) {
                                    margin-top: 4mm !important;
                                }
                                .admission-print-guardian {
                                    padding: 3mm !important;
                                }
                                .admission-print-guardian > :not([hidden]) ~ :not([hidden]) {
                                    margin-top: 3mm !important;
                                }
                                .admission-print-education {
                                    gap: 4mm 8mm !important;
                                    padding-top: 3mm !important;
                                }
                                .admission-print-class {
                                    padding: 2.5mm !important;
                                }
                                .admission-print-line {
                                    align-items: baseline !important;
                                    gap: 2mm !important;
                                    min-height: 7mm !important;
                                    break-inside: avoid !important;
                                    page-break-inside: avoid !important;
                                }
                                .admission-print-label {
                                    font-size: 11px !important;
                                    line-height: 1.4 !important;
                                }
                                .admission-print-value {
                                    min-height: 6mm !important;
                                    font-size: 12px !important;
                                    line-height: 1.4 !important;
                                    padding-left: 2mm !important;
                                    padding-right: 2mm !important;
                                    overflow-wrap: anywhere !important;
                                }
                                .admission-print-area .absolute.inset-0 img {
                                    width: 115mm !important;
                                    height: 62mm !important;
                                    margin-top: -35mm !important;
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

const FormikCnicField = ({ label, name, error = '' }) => (
    <Field name={name}>
        {({ field, form }) => (
            <InputField
                label={label}
                {...field}
                value={field.value || ''}
                onChange={(event) => form.setFieldValue(name, formatCnicInput(event.target.value))}
                maxLength={CNIC_INPUT_MAX_LENGTH}
                inputMode="numeric"
                dir="ltr"
                error={error}
                placeholder="00000-0000000-0"
                className="admission-form-control text-right"
            />
        )}
    </Field>
);

const FormikSelectField = ({ label, name, options, required = false, error = '' }) => (
    <Field name={name}>
        {({ field, form }) => (
            <SelectField
                label={label}
                required={required}
                error={error}
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
    <div style={{ flex }} className="admission-print-line flex items-baseline gap-2">
        <span className="admission-print-label font-bold text-gray-800 whitespace-nowrap">{label}:</span>
        <span className="admission-print-value flex-1 border-b border-black border-dotted min-h-[22px] px-2 text-[14px] font-bold text-[#0f172a]" style={{ color: '#0f172a' }}>
            {value || ''}
        </span>
    </div>
);


