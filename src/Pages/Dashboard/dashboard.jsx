import React, { useEffect, useState } from 'react';
import {
    UserPlus, Users, Calendar, Wallet, UserCheck,
    TrendingUp, BookOpen, ChevronLeft, Settings2, X, Check, Landmark
} from 'lucide-react';
/* eslint-disable-next-line no-unused-vars */
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getParents, getStudents } from '../../Constant/StudentsApi';
import { getTeachers } from '../../Constant/TeachersApi';
import { getFinancialRecords } from '../../Constant/FinancialApi';
import { getStudentAttendance } from '../../Constant/AttendanceApi';
import { getExamSchedules } from '../../Constant/ExamSchedulesApi';
import { getExamResults } from '../../Constant/ExamResultsApi';
import {
    getDailyHifzEntries,
    getMonthlyHifzEntries,
    getSiparaHifzEntries,
    getWeeklyHifzEntries,
} from '../../Constant/HifzApi';
import { getBranches } from '../../Constant/AcademicSetupApi';
import { canUseTenantBranchContext, getAdminSession, getSelectedBranchContext } from '../../Constant/AdminAuth';
import { usePermissions } from '../../Hooks/usePermissions';
import { formatCurrencyAmount } from '../../Utils/amountFormat';

//--------------------------------------------------------------------------

const urduWeekdayNames = ['اتوار', 'پیر', 'منگل', 'بدھ', 'جمعرات', 'جمعہ', 'ہفتہ'];
const emptyPieData = [
    { name: 'موصول', value: 0, color: '#00d094' },
    { name: 'باقی', value: 100, color: 'var(--color-bg)' },
];

const quickActionCatalog = [
    { id: 'student-admission', label: 'نیا طالب علم', icon: UserPlus, bg: 'bg-blue-600 shadow-blue-600/30', path: '/students/admission' },
    { id: 'parents', label: 'والدین', icon: Users, bg: 'bg-emerald-500 shadow-emerald-500/30', path: '/students/parents' },
    { id: 'student-attendance', label: 'حاضری لگائیں', icon: Calendar, bg: 'bg-indigo-500 shadow-indigo-500/30', path: '/students/attendance' },
    { id: 'fund-collection', label: 'فنڈ جمع کریں', icon: Wallet, bg: 'bg-orange-500 shadow-orange-500/30', path: '/finance/income/fund-collection' },
    { id: 'add-teacher', label: 'نیا استاد شامل کریں', icon: UserCheck, bg: 'bg-teal-600 shadow-teal-600/30', path: '/HRManagement' },
    { id: 'teacher-list', label: 'اساتذہ کی فہرست', icon: Users, bg: 'bg-cyan-600 shadow-cyan-600/30', path: '/teachers/list' },
    { id: 'exam-schedule', label: 'امتحانی شیڈول', icon: BookOpen, bg: 'bg-violet-600 shadow-violet-600/30', path: '/exams/schedule' },
    { id: 'daily-hifz', label: 'یومیہ جائزہ', icon: BookOpen, bg: 'bg-lime-600 shadow-lime-600/30', path: '/hifz/daily/entry' },
    { id: 'student-fees', label: 'فیس جنریشن', icon: Wallet, bg: 'bg-rose-600 shadow-rose-600/30', path: '/students/fees' },
    { id: 'student-schedule', label: 'نظام الاوقات', icon: Calendar, bg: 'bg-sky-600 shadow-sky-600/30', path: '/students/schedule' },
];

const defaultQuickActionIds = ['student-admission', 'parents', 'student-attendance', 'fund-collection'];

const getQuickActionStorageKey = () => {
    const adminId = getAdminSession()?.admin?.id || 'default';
    return `dashboard-quick-actions:${adminId}`;
};

const getInitialQuickActionIds = () => {
    try {
        const savedIds = JSON.parse(localStorage.getItem(getQuickActionStorageKey()) || 'null');
        if (!Array.isArray(savedIds)) return defaultQuickActionIds;

        const validIds = savedIds.filter((id) => quickActionCatalog.some((action) => action.id === id));
        return [...new Set(validIds)];
    } catch {
        return defaultQuickActionIds;
    }
};
const getTotalItems = (result) => Number(result?.meta?.totalItems ?? result?.meta?.total ?? result?.items?.length ?? 0);

const formatCount = (value, fallback) => {
    const number = Number(value);
    if (Number.isNaN(number)) return fallback;
    return number.toLocaleString('en-US');
};

const formatCurrency = (value, fallback) => {
    return formatCurrencyAmount(value, fallback);
};

const toDateKey = (date) => date.toISOString().split('T')[0];

const getLastSevenDays = () =>
    Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        return date;
    });

const getUrduWeekdayName = (date) => urduWeekdayNames[date.getDay()];

const buildEmptyLineData = () => getLastSevenDays().map((date) => ({
    name: getUrduWeekdayName(date),
    value: 0,
}));

const getAttendancePercent = (items = []) => {
    if (!items.length) return null;
    const presentCount = items.filter((item) => item.status === 'Present' || item.status === 'Late').length;
    return Math.round((presentCount / items.length) * 100);
};

const getRelativeTime = (value) => {
    if (!value) return 'ابھی';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'ابھی';

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMinutes < 1) return 'ابھی';
    if (diffMinutes < 60) return `${diffMinutes} منٹ پہلے`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} گھنٹے پہلے`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} دن پہلے`;
};

const getRecordDate = (record) => new Date(record.updatedAt || record.createdAt || record.date || record.transactionDate || 0).getTime();
const getActivityDate = (record) => record.updatedAt || record.createdAt || record.date || record.transactionDate;
const wasUpdated = (record) => {
    if (!record?.createdAt || !record?.updatedAt) return false;
    return new Date(record.updatedAt).getTime() - new Date(record.createdAt).getTime() > 1000;
};
const getItems = (result) => result?.items || [];

const createActivity = ({ record, title, amount, color, path }) => ({
    id: `${path}-${record.id ?? getRecordDate(record)}`,
    title,
    amount,
    time: getRelativeTime(getActivityDate(record)),
    color,
    path,
    sortDate: getRecordDate(record),
});

const getStatusLabel = (status) => {
    if (status === 'loading') return 'لوڈ ہو رہا ہے';
    if (status === 'error') return 'عارضی ڈیٹا';
    return '';
};

const withStatusLabel = (label, status) => {
    const statusLabel = getStatusLabel(status);
    return statusLabel ? `${label} · ${statusLabel}` : label;
};

const loadOptional = async (allowed, request) => {
    if (!allowed) return { skipped: true, value: null };

    try {
        return { skipped: false, value: await request() };
    } catch {
        return { skipped: false, value: null, error: true };
    }
};

const hasLoadedValue = (result) => !result?.skipped && result?.value;

//--------------------------------------------------------------------------
const StatCard =
    (
        {
            title,
            value,
            subValue,
            icon: Icon, // eslint-disable-line no-unused-vars
            colorClass,
            borderClass,
            isIncome,
            onClick,
        }) => (

        <motion.div initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onClick={onClick}
            onKeyDown={(event) => {
                if (!onClick) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick();
                }
            }}
            className={`p-6 rounded-[2rem] flex-1 min-w-[240px] bg-[var(--color-surface)] border border-[var(--color-border)] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group shadow-sm ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40' : ''}`}>
            {/* Background Decorative Icon */}
            <div className="absolute -right-4 -top-4 w-20 h-20 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity text-[var(--color-text)]">
                <Icon size={80} />
            </div>

            <div className="flex justify-between items-start relative z-10">
                <div className={`p-3 rounded-2xl ${colorClass} bg-gradient-to-br transition-transform group-hover:scale-110 duration-500 shadow-lg shadow-current/20`}>
                    <Icon size={22} className="text-white" />
                </div>

                <div className="text-right">
                    <p className="text-[var(--color-text-muted)] text-[12px] mb-1 font-bold font-urdu tracking-widest uppercase">{title}</p>
                    <h3 className={`font-black text-[var(--color-text)] tracking-tight ${isIncome ? 'text-lg' : 'text-2xl'}`}>
                        {value}
                    </h3>
                </div>
            </div>

            {subValue && (
                <div className="mt-4 pt-3 border-t border-[var(--color-border)] relative z-10">
                    <p className="text-[11px] text-[var(--color-text-muted)] font-medium font-urdu">{subValue}</p>
                </div>
            )}

            {/* Bottom Accent Line */}
            <div className={`absolute bottom-0 right-0 left-0 h-1.5 ${borderClass} opacity-80`} />
        </motion.div>
    );
//--------------------------------------------------------------------------

export const Dashboard = () => {
    const navigate = useNavigate();
    const { hasPageAccess, hasPermission, hasAnyPermission } = usePermissions();
    const session = getAdminSession();
    const canUseBranchContext = canUseTenantBranchContext(session);
    const selectedBranchContext = getSelectedBranchContext(session);
    const scopeSubValue = canUseBranchContext
        ? (selectedBranchContext.branchId ? 'منتخب برانچ' : 'تمام برانچز')
        : '';
    const canViewStudents = hasPermission('students.view');
    const canViewTeachers = hasPermission('teachers.view');
    const canViewStaff = hasPermission('staff.view');
    const canViewParents = hasPermission('parents.view');
    const canViewAttendance = hasPermission('attendance.view');
    const canViewFinance = hasAnyPermission(['fees.view', 'finance.view', 'finance.transactions.view', 'finance.reports.view']);
    const canViewExamSchedules = hasPermission('exams.view');
    const canViewExamResults = hasPermission('exam_results.view');
    const canViewDailyHifz = hasPermission('hifz.daily.view');
    const canViewWeeklyHifz = hasPermission('hifz.weekly.view');
    const canViewMonthlyHifz = hasPermission('hifz.monthly.view');
    const canViewSiparaHifz = hasPermission('hifz.para.view');
    const canViewBranchSummary = canUseBranchContext && hasPermission('branches.view');
    const [quickActionIds, setQuickActionIds] = useState(getInitialQuickActionIds);
    const [isQuickActionSettingsOpen, setIsQuickActionSettingsOpen] = useState(false);
    const [topStats, setTopStats] = useState({
        students: '0',
        teachers: '0',
        staff: '0',
        fees: 'PKR 0',
    });
    const [chartStats, setChartStats] = useState({
        pieData: emptyPieData,
        feePercent: 0,
        receivedAmount: 'PKR 0',
        attendanceData: buildEmptyLineData(),
        attendancePercent: 0,
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [dashboardStatus, setDashboardStatus] = useState({
        stats: 'loading',
        charts: 'loading',
        activities: 'loading',
        branches: 'loading',
    });
    const [financeCards, setFinanceCards] = useState({
        payableAmount: 0,
        receivableAmount: 0,
        totalKharch: 0,
        total: 0,
    });
    const [branchStats, setBranchStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        limit: null,
        remaining: 0,
    });

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        localStorage.setItem(getQuickActionStorageKey(), JSON.stringify(quickActionIds));
    }, [quickActionIds]);

    const allowedQuickActions = quickActionCatalog.filter((action) => hasPageAccess(action.path));

    const selectedQuickActions = quickActionIds
        .map((id) => quickActionCatalog.find((action) => action.id === id))
        .filter((action) => action && hasPageAccess(action.path))
        .filter(Boolean);

    const toggleQuickAction = (actionId) => {
        if (!allowedQuickActions.some((action) => action.id === actionId)) return;
        setQuickActionIds((current) => (
            current.includes(actionId)
                ? current.filter((id) => id !== actionId)
                : [...current, actionId]
        ));
    };

    useEffect(() => {
        let isMounted = true;

        const loadDashboardStats = async () => {
            try {
                const [studentsResult, teachersResult, staffResult, financeResult] = await Promise.all([
                    loadOptional(canViewStudents, () => getStudents('page=1&limit=1&status=active')),
                    loadOptional(canViewTeachers, () => getTeachers('page=1&limit=1&staffType=teacher')),
                    loadOptional(canViewStaff, () => getTeachers('page=1&limit=1&staffType=staff')),
                    loadOptional(canViewFinance, () => getFinancialRecords('page=1&limit=1')),
                ]);

                if (!isMounted) return;

                setTopStats((current) => {
                    const studentsTotal = hasLoadedValue(studentsResult) ? getTotalItems(studentsResult.value) : null;
                    const teachersTotal = hasLoadedValue(teachersResult) ? getTotalItems(teachersResult.value) : null;
                    const staffTotal = hasLoadedValue(staffResult) ? getTotalItems(staffResult.value) : null;
                    const totalFees = hasLoadedValue(financeResult)
                        ? financeResult.value?.summary?.totalAmdan
                        : null;

                    return {
                        students: studentsTotal !== null ? formatCount(studentsTotal, current.students) : current.students,
                        teachers: teachersTotal !== null ? formatCount(teachersTotal, current.teachers) : current.teachers,
                        staff: staffTotal !== null ? formatCount(staffTotal, current.staff) : current.staff,
                        fees: totalFees !== null && totalFees !== undefined ? formatCurrency(totalFees, current.fees) : current.fees,
                    };
                });

                const hasStatsData = [studentsResult, teachersResult, staffResult, financeResult].some(hasLoadedValue);
                setDashboardStatus((current) => ({ ...current, stats: hasStatsData ? 'ready' : 'error' }));

                let hasChartData = false;

                if (hasLoadedValue(financeResult)) {
                    const summary = financeResult.value?.summary || {};
                    const income = Number(summary.totalAmdan || 0);
                    const expense = Number(summary.totalKharch || 0);
                    const total = income + expense;
                    const incomePercent = total > 0 ? Math.round((income / total) * 100) : 0;
                    setFinanceCards({
                        payableAmount: Number(summary.payableAmount || 0),
                        receivableAmount: Number(summary.receivableAmount || 0),
                        totalKharch: expense,
                        total: Number(summary.remainingBalance || 0),
                    });
                    hasChartData = true;
                    setChartStats((current) => ({
                        ...current,
                        feePercent: incomePercent,
                        receivedAmount: formatCurrency(income, 'PKR 0'),
                        pieData: total > 0
                            ? [
                                { name: 'موصول', value: incomePercent, color: '#00d094' },
                                { name: 'باقی', value: Math.max(0, 100 - incomePercent), color: 'var(--color-bg)' },
                            ]
                            : emptyPieData,
                    }));
                }

                const attendanceDays = getLastSevenDays();
                const attendanceResults = canViewAttendance
                    ? await Promise.allSettled(
                        attendanceDays.map((date) =>
                            getStudentAttendance(`page=1&limit=100&date=${toDateKey(date)}`),
                        ),
                    )
                    : [];

                if (!isMounted) return;

                const nextAttendanceData = attendanceDays.map((date, index) => {
                    const result = attendanceResults[index];
                    if (!result || result.status !== 'fulfilled') {
                        return { name: getUrduWeekdayName(date), value: 0 };
                    }

                    const percent = getAttendancePercent(result.value?.items || []);
                    return {
                        name: getUrduWeekdayName(date),
                        value: percent ?? 0,
                    };
                });
                const realAttendanceValues = attendanceResults
                    .filter((result) => result.status === 'fulfilled')
                    .map((result) => getAttendancePercent(result.value?.items || []))
                    .filter((value) => value !== null);

                if (canViewAttendance) {
                    hasChartData = true;
                    const average = realAttendanceValues.length
                        ? Math.round(realAttendanceValues.reduce((sum, value) => sum + value, 0) / realAttendanceValues.length)
                        : 0;
                    setChartStats((current) => ({
                        ...current,
                        attendanceData: nextAttendanceData,
                        attendancePercent: average,
                    }));
                }

                setDashboardStatus((current) => ({ ...current, charts: hasChartData ? 'ready' : 'error' }));
            } catch {
                if (!isMounted) return;
                setChartStats((current) => ({
                    ...current,
                    pieData: emptyPieData,
                    feePercent: 0,
                    receivedAmount: formatCurrency(0, 'PKR 0'),
                    attendanceData: buildEmptyLineData(),
                    attendancePercent: 0,
                }));
                setDashboardStatus((current) => ({ ...current, stats: 'error', charts: 'error' }));
            }
        };

        loadDashboardStats();

        return () => {
            isMounted = false;
        };
    }, [canViewAttendance, canViewFinance, canViewStaff, canViewStudents, canViewTeachers]);

    useEffect(() => {
        let isMounted = true;

        const loadBranchStats = async () => {
            if (!canViewBranchSummary) {
                setDashboardStatus((current) => ({ ...current, branches: 'ready' }));
                return;
            }

            try {
                const [allBranches, activeBranches, inactiveBranches] = await Promise.all([
                    getBranches('page=1&limit=1'),
                    getBranches('page=1&limit=1&status=active'),
                    getBranches('page=1&limit=1&status=inactive'),
                ]);

                if (!isMounted) return;

                const branchLimit = allBranches?.branchLimit || {};
                setBranchStats({
                    total: Number(allBranches?.meta?.totalItems ?? allBranches?.items?.length ?? 0),
                    active: Number(activeBranches?.meta?.totalItems ?? activeBranches?.items?.length ?? 0),
                    inactive: Number(inactiveBranches?.meta?.totalItems ?? inactiveBranches?.items?.length ?? 0),
                    limit: branchLimit.branchLimit ?? branchLimit.limit ?? null,
                    remaining: Number(branchLimit.remainingBranches ?? branchLimit.remaining ?? 0),
                });
                setDashboardStatus((current) => ({ ...current, branches: 'ready' }));
            } catch {
                if (!isMounted) return;
                setDashboardStatus((current) => ({ ...current, branches: 'error' }));
            }
        };

        loadBranchStats();

        return () => {
            isMounted = false;
        };
    }, [canViewBranchSummary]);

    useEffect(() => {
        let isMounted = true;

        const loadRecentActivities = async () => {
            try {
                const [
                    studentsResult,
                    teachersResult,
                    parentsResult,
                    financeResult,
                    attendanceResult,
                    examSchedulesResult,
                    examResultsResult,
                    dailyHifzResult,
                    weeklyHifzResult,
                    monthlyHifzResult,
                    siparaHifzResult,
                ] = await Promise.all([
                    loadOptional(canViewStudents, () => getStudents('page=1&limit=10')),
                    loadOptional(canViewTeachers || canViewStaff, () => getTeachers('page=1&limit=10')),
                    loadOptional(canViewParents, () => getParents('page=1&limit=10')),
                    loadOptional(canViewFinance, () => getFinancialRecords('page=1&limit=10')),
                    loadOptional(canViewAttendance, () => getStudentAttendance('page=1&limit=10')),
                    loadOptional(canViewExamSchedules, () => getExamSchedules('page=1&limit=10')),
                    loadOptional(canViewExamResults, () => getExamResults('page=1&limit=10')),
                    loadOptional(canViewDailyHifz, () => getDailyHifzEntries('page=1&limit=10')),
                    loadOptional(canViewWeeklyHifz, () => getWeeklyHifzEntries('page=1&limit=10')),
                    loadOptional(canViewMonthlyHifz, () => getMonthlyHifzEntries('page=1&limit=10')),
                    loadOptional(canViewSiparaHifz, () => getSiparaHifzEntries('page=1&limit=10')),
                ]);

                if (!isMounted) return;

                const studentActivities = hasLoadedValue(studentsResult)
                    ? getItems(studentsResult.value).map((student) => createActivity({
                        record: student,
                        title: `${student.fullName || 'طالب علم'} کا ریکارڈ ${wasUpdated(student) ? 'اپڈیٹ ہوا' : 'شامل ہوا'}`,
                        amount: student.admissionNumber ? `داخلہ نمبر: ${student.admissionNumber}` : 'طالب علم',
                        color: 'bg-emerald-500',
                        path: `/students/profile/${student.id}`,
                    }))
                    : [];

                const teacherActivities = hasLoadedValue(teachersResult)
                    ? getItems(teachersResult.value)
                        .filter((teacher) => (teacher.staffType === 'staff' ? canViewStaff : canViewTeachers))
                        .map((teacher) => createActivity({
                            record: teacher,
                            title: `${teacher.fullName || 'استاد / عملہ'} کا ریکارڈ ${wasUpdated(teacher) ? 'اپڈیٹ ہوا' : 'شامل ہوا'}`,
                            amount: teacher.staffType === 'staff' ? 'دیگر عملہ' : (teacher.subject || 'استاد'),
                            color: 'bg-teal-500',
                            path: teacher.staffType === 'staff' ? '/staff/list' : `/teachers/details/${teacher.id}`,
                        }))
                    : [];

                const parentActivities = hasLoadedValue(parentsResult)
                    ? getItems(parentsResult.value).map((parent) => createActivity({
                        record: parent,
                        title: `${parent.fullName || 'والدین'} کا ریکارڈ ${wasUpdated(parent) ? 'اپڈیٹ ہوا' : 'شامل ہوا'}`,
                        amount: parent.familyNumber ? `فیملی نمبر: ${parent.familyNumber}` : 'والدین',
                        color: 'bg-violet-500',
                        path: `/students/parents/profile/${parent.id}`,
                    }))
                    : [];

                const financeActivities = hasLoadedValue(financeResult)
                    ? getItems(financeResult.value).map((record) => {
                        const isIncome = record.type === 'amdan' || record.type === 'income';
                        return createActivity({
                            record,
                            title: `${record.category || record.financeHead?.name || (isIncome ? 'آمدن' : 'خرچ')} ${isIncome ? 'جمع ہوئی' : 'درج ہوا'}`,
                            amount: formatCurrency(record.amount, 'PKR 0'),
                            color: isIncome ? 'bg-blue-500' : 'bg-rose-500',
                            path: isIncome ? '/finance/income/fund-list' : '/finance/other-income-expense',
                        });
                    })
                    : [];

                const attendanceActivities = hasLoadedValue(attendanceResult)
                    ? getItems(attendanceResult.value).map((attendance) => createActivity({
                        record: attendance,
                        title: `${attendance.student?.fullName || 'طالب علم'} کی حاضری درج ہوئی`,
                        amount: attendance.status || 'حاضری',
                        color: 'bg-indigo-500',
                        path: '/students/attendance',
                    }))
                    : [];

                const examScheduleActivities = hasLoadedValue(examSchedulesResult)
                    ? getItems(examSchedulesResult.value).map((schedule) => createActivity({
                        record: schedule,
                        title: `${schedule.examName || 'امتحانی شیڈول'} ${wasUpdated(schedule) ? 'اپڈیٹ ہوا' : 'بنایا گیا'}`,
                        amount: schedule.class?.name || schedule.subject?.name || 'امتحان',
                        color: 'bg-amber-500',
                        path: '/exams/schedule-list',
                    }))
                    : [];

                const examResultActivities = hasLoadedValue(examResultsResult)
                    ? getItems(examResultsResult.value).map((result) => createActivity({
                        record: result,
                        title: `${result.student?.fullName || 'طالب علم'} کا امتحانی نتیجہ ${wasUpdated(result) ? 'اپڈیٹ ہوا' : 'محفوظ ہوا'}`,
                        amount: result.percentage !== undefined ? `${result.percentage}%` : (result.examName || 'نتیجہ'),
                        color: 'bg-cyan-500',
                        path: '/exams/result-list',
                    }))
                    : [];

                const mapHifzActivities = (result, label, path, color) => (
                    hasLoadedValue(result)
                        ? getItems(result.value).map((entry) => createActivity({
                            record: entry,
                            title: `${entry.student?.fullName || 'طالب علم'} کا ${label} ${wasUpdated(entry) ? 'اپڈیٹ ہوا' : 'درج ہوا'}`,
                            amount: entry.performanceStatus || entry.quality || 'حفظ',
                            color,
                            path,
                        }))
                        : []
                );

                const hifzActivities = [
                    ...mapHifzActivities(dailyHifzResult, 'یومیہ جائزہ', '/hifz/daily/list', 'bg-lime-500'),
                    ...mapHifzActivities(weeklyHifzResult, 'ہفتہ وار جائزہ', '/hifz/weekly/list', 'bg-green-500'),
                    ...mapHifzActivities(monthlyHifzResult, 'ماہانہ جائزہ', '/hifz/monthly/list', 'bg-fuchsia-500'),
                    ...mapHifzActivities(siparaHifzResult, 'سپارہ جائزہ', '/hifz/para/list', 'bg-orange-500'),
                ];

                const nextActivities = [
                    ...studentActivities,
                    ...teacherActivities,
                    ...parentActivities,
                    ...financeActivities,
                    ...attendanceActivities,
                    ...examScheduleActivities,
                    ...examResultActivities,
                    ...hifzActivities,
                ]
                    .sort((a, b) => b.sortDate - a.sortDate)
                    .slice(0, 30)
                    .map((activity) => {
                        const activityWithoutSortDate = { ...activity };
                        delete activityWithoutSortDate.sortDate;
                        return activityWithoutSortDate;
                    });

                setRecentActivities(nextActivities);

                const hasActivitySource = [
                    studentsResult,
                    teachersResult,
                    parentsResult,
                    financeResult,
                    attendanceResult,
                    examSchedulesResult,
                    examResultsResult,
                    dailyHifzResult,
                    weeklyHifzResult,
                    monthlyHifzResult,
                    siparaHifzResult,
                ].some(hasLoadedValue);

                setDashboardStatus((current) => ({ ...current, activities: hasActivitySource ? 'ready' : 'error' }));
            } catch {
                if (!isMounted) return;
                setRecentActivities([]);
                setDashboardStatus((current) => ({ ...current, activities: 'error' }));
            }
        };

        loadRecentActivities();

        return () => {
            isMounted = false;
        };
    }, [
        canViewAttendance,
        canViewDailyHifz,
        canViewExamResults,
        canViewExamSchedules,
        canViewFinance,
        canViewMonthlyHifz,
        canViewParents,
        canViewSiparaHifz,
        canViewStaff,
        canViewStudents,
        canViewTeachers,
        canViewWeeklyHifz,
    ]);

    const topStatCards = [
        canViewStudents ? { id: 'students', title: withStatusLabel('کل طلباء', dashboardStatus.stats), value: topStats.students, icon: Users, colorClass: 'bg-blue-500', borderClass: 'bg-blue-500', subValue: scopeSubValue, path: '/students/list' } : null,
        canViewTeachers ? { id: 'teachers', title: withStatusLabel('کل اساتذہ', dashboardStatus.stats), value: topStats.teachers, icon: UserCheck, colorClass: 'bg-teal-500', borderClass: 'bg-teal-500', subValue: scopeSubValue, path: '/teachers/list' } : null,
        canViewStaff ? { id: 'staff', title: withStatusLabel('کل عملہ', dashboardStatus.stats), value: topStats.staff, icon: Users, colorClass: 'bg-indigo-500', borderClass: 'bg-indigo-500', subValue: scopeSubValue, path: '/staff/list' } : null,
        canViewFinance ? { id: 'fees', title: withStatusLabel('مجموعی فیس', dashboardStatus.stats), value: topStats.fees, icon: Wallet, colorClass: 'bg-rose-500', borderClass: 'bg-rose-500', subValue: scopeSubValue, path: hasPageAccess('/finance/reports/financial-statements') ? '/finance/reports/financial-statements' : null } : null,
    ].filter(Boolean);

    const branchStatCards = canViewBranchSummary ? [
        { id: 'total-branches', title: withStatusLabel('کل برانچز', dashboardStatus.branches), value: formatCount(branchStats.total, '0'), icon: Landmark, colorClass: 'bg-blue-500', borderClass: 'bg-blue-500', subValue: 'آرکائیو برانچز شامل نہیں', path: '/branch-management' },
        { id: 'active-branches', title: withStatusLabel('فعال برانچز', dashboardStatus.branches), value: formatCount(branchStats.active, '0'), icon: Landmark, colorClass: 'bg-emerald-500', borderClass: 'bg-emerald-500', path: '/branch-management' },
        { id: 'inactive-branches', title: withStatusLabel('غیر فعال برانچز', dashboardStatus.branches), value: formatCount(branchStats.inactive, '0'), icon: Landmark, colorClass: 'bg-orange-500', borderClass: 'bg-orange-500', path: '/branch-management' },
        { id: 'branch-limit', title: withStatusLabel('برانچ حد', dashboardStatus.branches), value: branchStats.limit === null || branchStats.limit === undefined ? '—' : formatCount(branchStats.limit, '0'), icon: Landmark, colorClass: 'bg-cyan-600', borderClass: 'bg-cyan-600', subValue: `باقی گنجائش: ${formatCount(branchStats.remaining, '0')}`, path: '/branch-management' },
    ] : [];

    return (
        <div className="w-full animate-in fade-in duration-700 font-urdu p-4 bg-[var(--color-bg)] min-h-screen text-[var(--color-text)]">
            {/* 1. Top Core Stats */}
            <div className="flex flex-wrap gap-6 mb-8" dir="rtl">
                {topStatCards.map((card) => (
                    <StatCard key={card.id} {...card} onClick={card.path ? () => navigate(card.path) : undefined} />
                ))}
                {branchStatCards.map((card) => (
                    <StatCard key={card.id} {...card} onClick={card.path ? () => navigate(card.path) : undefined} />
                ))}
            </div>

            {/* 2. Charts Section */}
            {(canViewFinance || canViewAttendance) ? (
            <div className={`grid grid-cols-1 ${canViewFinance && canViewAttendance ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8 mb-8`} dir="rtl">
                {canViewFinance ? (
                <motion.div
                    className="min-h-[450px] bg-[var(--color-surface)] p-8 rounded-[3rem] border border-[var(--color-border)] flex flex-col justify-between shadow-sm"
                >
                    <div className="flex flex-row justify-between items-center mb-6 ">
                        <span className="text-[10px] bg-[var(--color-bg)] px-2 sm:px-2 md:px-4 lg:px-4 py-1.5 rounded-full text-[var(--color-text-muted)] font-black tracking-widest uppercase border border-[var(--color-border)]">{withStatusLabel('ماہانہ جائزہ', dashboardStatus.charts)}</span>
                        <h3 className="font-black text-[var(--color-text)] text-lg text-center">فیس کی مجموعی صورتحال</h3>
                    </div>
                    <div className="h-64 flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={chartStats.pieData} innerRadius={80} outerRadius={100} paddingAngle={8} dataKey="value" startAngle={90} endAngle={450}>
                                    {chartStats.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '20px', border: 'none', boxShadow: 'var(--shadow-card)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-4xl font-black text-[var(--color-text)] tracking-tight">{chartStats.feePercent}%</span>
                            <p className="text-[11px] text-emerald-500 font-black uppercase mt-1">موصول شدہ</p>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex justify-between items-center">
                        <span className="font-extrabold text-[var(--color-text)] text-base">{chartStats.receivedAmount}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-[var(--color-text-muted)] font-bold text-sm">موصول شدہ رقم</span>
                            <div className="w-3 h-3 rounded-full bg-[#00d094] shadow-[0_0_15px_rgba(0,208,148,0.5)]" />
                        </div>
                    </div>
                </motion.div>
                ) : null}

                {canViewAttendance ? (
                <motion.div
                    className="bg-[var(--color-surface)] p-8 rounded-[3rem] border border-[var(--color-border)] flex flex-col min-h-[450px] shadow-sm"
                >
                    <div className="flex justify-between items-center mb-10">
                        <div className="bg-emerald-500/10 text-emerald-500 px-5 py-2 rounded-full text-[10px] font-black tracking-tight border border-emerald-500/20 uppercase">{withStatusLabel(`${chartStats.attendancePercent}% حاضری`, dashboardStatus.charts)}</div>
                        <h3 className="font-black text-[var(--color-text)] text-lg">حاضری کا جائزہ</h3>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartStats.attendanceData}
                            margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
                        >
                            <CartesianGrid
                                vertical={false}
                                stroke="var(--color-border)"
                                strokeDasharray="8 8"
                                strokeOpacity={0.2}
                            />

                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 13, fill: 'var(--color-text-muted)', fontWeight: '800' }}
                                dy={20}
                                padding={{ left: 20, right: 20 }}
                            />

                            <YAxis hide domain={[0, 100]} />

                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--color-surface)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--color-border)',
                                    boxShadow: 'var(--shadow-card)'
                                }}
                            />

                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#00d094"
                                strokeWidth={6}
                                dot={{ r: 6, fill: '#00d094', strokeWidth: 3, stroke: 'var(--color-surface)' }}
                                activeDot={{ r: 8, fill: '#00d094' }}
                                animationDuration={2500}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>
                ) : null}
            </div>
            ) : null}

            {/* 3. Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8" dir="rtl">
                <motion.div
                    className="lg:col-span-5 bg-[var(--color-surface)] p-8 rounded-[3rem] border border-[var(--color-border)] shadow-sm"
                >
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <h3 className="text-lg font-bold text-[var(--color-text)]">کوئیک ایکشنز</h3>
                        <button
                            type="button"
                            onClick={() => setIsQuickActionSettingsOpen(true)}
                            className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm font-black text-[var(--color-text)] transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                        >
                            <Settings2 size={17} />
                            ترتیب دیں
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {selectedQuickActions.map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => navigate(btn.path)}
                                className={`flex flex-col items-center justify-center p-6 ${btn.bg} shadow-lg hover:shadow-2xl text-white rounded-3xl transition-all hover:scale-105 active:scale-95`}
                            >
                                <btn.icon size={26} />
                                <span className="text-xs font-bold mt-2">{btn.label}</span>
                            </button>
                        ))}
                        {!selectedQuickActions.length ? (
                            <button
                                type="button"
                                onClick={() => setIsQuickActionSettingsOpen(true)}
                                className="col-span-2 flex min-h-40 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                            >
                                <Settings2 size={26} />
                                <span className="text-sm font-black">کوئیک ایکشن شامل کریں</span>
                            </button>
                        ) : null}
                    </div>
                </motion.div>

                <motion.div
                    className="lg:col-span-7 bg-[var(--color-surface)] p-8 rounded-[3rem] border border-[var(--color-border)] shadow-sm"
                >
                    <h3 className="text-lg font-bold text-[var(--color-text)] mb-6">{withStatusLabel('تازہ ترین سرگرمیاں', dashboardStatus.activities)}</h3>
                    <div className="h-[390px] space-y-3 overflow-y-auto pl-2 vip-scrollbar">
                        {recentActivities.map((item) => (
                            <button
                                type="button"
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className="flex w-full items-center justify-between gap-4 rounded-3xl border border-transparent bg-[var(--color-bg)]/40 p-5 text-right transition-all hover:border-[var(--color-border)] hover:bg-[var(--color-bg)]"
                            >
                                <div className="flex min-w-0 items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${item.color} shadow-lg shadow-current/40`} />
                                    <span className="truncate text-sm font-bold text-[var(--color-text)]">{item.title}</span>
                                </div>
                                <div className="flex shrink-0 items-center gap-3 text-left">
                                    <ChevronLeft size={16} className="text-[var(--color-text-muted)]" />
                                    <div>
                                    <span className="text-xs font-black text-[var(--color-text)] block">{item.amount}</span>
                                    <span className="text-[10px] text-[var(--color-text-muted)]">{item.time}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                        {!recentActivities.length && dashboardStatus.activities !== 'loading' ? (
                            <div className="flex h-full items-center justify-center text-sm font-bold text-[var(--color-text-muted)]">
                                ابھی کوئی سرگرمی دستیاب نہیں۔
                            </div>
                        ) : null}
                    </div>
                </motion.div>
            </div>

            {/* 4. Bottom Financial Cards */}
            {canViewFinance ? (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" dir="rtl">
                <StatCard title="قابل ادائیگی" value={formatCurrency(financeCards.payableAmount, 'PKR 0')} subValue="خریداری کی باقی ادائیگیاں" icon={BookOpen} colorClass="bg-blue-500" borderClass="bg-blue-500" onClick={() => navigate('/store/purchases?outstanding=true')} />
                <StatCard title="قابل وصولی" value={formatCurrency(financeCards.receivableAmount, 'PKR 0')} subValue="طلباء فیس کی باقی وصولی" icon={Users} colorClass="bg-emerald-500" borderClass="bg-emerald-500" onClick={() => navigate('/students/fees?status=due&allMonths=true')} />
                <StatCard title="کل خرچ" value={formatCurrency(financeCards.totalKharch, 'PKR 0')} subValue="مالیاتی ریکارڈ کے مطابق" icon={TrendingUp} colorClass="bg-indigo-500" borderClass="bg-indigo-500" onClick={() => navigate('/finance/reports/financial-statements?type=kharch')} />
                <StatCard title="کل" value={formatCurrency(financeCards.total, 'PKR 0')} subValue="کل آمدن منفی کل خرچ" icon={Wallet} colorClass="bg-orange-500" borderClass="bg-orange-500" isIncome={true} onClick={() => navigate('/finance/reports/financial-statements')} />
            </motion.div>
            ) : null}

            {isQuickActionSettingsOpen ? (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
                    onClick={() => setIsQuickActionSettingsOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl rounded-[2.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl md:p-8"
                        dir="rtl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-[var(--color-text)]">کوئیک ایکشنز ترتیب دیں</h2>
                                <p className="mt-2 text-sm font-bold text-[var(--color-text-muted)]">
                                    جن اختیارات کو ڈیش بورڈ پر دکھانا ہو انہیں منتخب کریں۔
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsQuickActionSettingsOpen(false)}
                                className="rounded-xl bg-[var(--color-bg)] p-2.5 text-[var(--color-text-muted)] transition-all hover:text-rose-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-6 grid max-h-[55vh] grid-cols-1 gap-3 overflow-y-auto pl-1 sm:grid-cols-2 vip-scrollbar">
                            {allowedQuickActions.map((action) => {
                                const isSelected = quickActionIds.includes(action.id);
                                const Icon = action.icon;

                                return (
                                    <button
                                        key={action.id}
                                        type="button"
                                        onClick={() => toggleQuickAction(action.id)}
                                        className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-right transition-all ${
                                            isSelected
                                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                                                : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary)]/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${action.bg.split(' ')[0]}`}>
                                                <Icon size={20} />
                                            </span>
                                            <span className="font-black text-[var(--color-text)]">{action.label}</span>
                                        </div>
                                        <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                                            isSelected
                                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[#0b1120]'
                                                : 'border-[var(--color-border)] text-transparent'
                                        }`}>
                                            <Check size={15} />
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row sm:justify-between">
                            <button
                                type="button"
                                onClick={() => setQuickActionIds(defaultQuickActionIds)}
                                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-5 py-3 text-sm font-black text-[var(--color-text-muted)] transition-all hover:text-[var(--color-text)]"
                            >
                                ڈیفالٹ بحال کریں
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsQuickActionSettingsOpen(false)}
                                className="rounded-2xl bg-[var(--color-primary)] px-7 py-3 text-sm font-black text-[#0b1120] transition-all hover:brightness-105"
                            >
                                محفوظ کریں
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

        </div>
    );
};
