import React, { useEffect, useState } from 'react';
import {
    UserPlus, Users, Calendar, Wallet, UserCheck,
    TrendingUp, BookOpen
} from 'lucide-react';
/* eslint-disable-next-line no-unused-vars */
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getStudents } from '../../Constant/StudentsApi';
import { getTeachers } from '../../Constant/TeachersApi';
import { getFinancialRecords } from '../../Constant/FinancialApi';
import { getStudentAttendance } from '../../Constant/AttendanceApi';

//--------------------------------------------------------------------------

const fallbackLineData = [
    { name: 'ہفتہ', value: 80 },
    { name: 'اتوار', value: 85 },
    { name: 'پیر', value: 83 },
    { name: 'منگل', value: 91 },
    { name: 'بدھ', value: 88 },
    { name: 'جمعرات', value: 89 },
    { name: 'جمعہ', value: 95 },
];
const fallbackPieData = [
    { name: 'موصول', value: 75, color: '#00d094' },
    { name: 'باقی', value: 25, color: 'var(--color-bg)' },
];
const fallbackRecentActivities = [
    { title: 'احمد رضا نے فیس جمع کروائی', amount: 'PKR 4,500', time: '2 منٹ پہلے', color: 'bg-blue-500' },
    { title: 'نیا طالب علم رجسٹر ہوا', amount: 'داخلہ مکمل', time: '15 منٹ پہلے', color: 'bg-emerald-500' },
];

const getTotalItems = (result) => Number(result?.meta?.totalItems ?? result?.meta?.total ?? result?.items?.length ?? 0);

const formatCount = (value, fallback) => {
    const number = Number(value);
    if (Number.isNaN(number)) return fallback;
    return number.toLocaleString('en-US');
};

const formatCurrency = (value, fallback) => {
    const number = Number(value);
    if (Number.isNaN(number)) return fallback;

    if (Math.abs(number) >= 1000000) return `PKR ${(number / 1000000).toFixed(1)}M`;
    if (Math.abs(number) >= 1000) return `PKR ${(number / 1000).toFixed(0)}K`;
    return `PKR ${number.toLocaleString('en-US')}`;
};

const toDateKey = (date) => date.toISOString().split('T')[0];

const getLastSevenDays = () =>
    Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        return date;
    });

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

const getRecordDate = (record) => new Date(record.createdAt || record.updatedAt || record.date || record.transactionDate || 0).getTime();

const getStatusLabel = (status) => {
    if (status === 'loading') return 'لوڈ ہو رہا ہے';
    if (status === 'error') return 'عارضی ڈیٹا';
    return '';
};

const withStatusLabel = (label, status) => {
    const statusLabel = getStatusLabel(status);
    return statusLabel ? `${label} · ${statusLabel}` : label;
};

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
            isIncome
        }) => (

        <motion.div initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-[2rem] flex-1 min-w-[240px] bg-[var(--color-surface)] border border-[var(--color-border)] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 relative overflow-hidden group shadow-sm">
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
    const [topStats, setTopStats] = useState({
        students: '350',
        teachers: '15',
        fees: 'PKR 1.7M',
    });
    const [chartStats, setChartStats] = useState({
        pieData: fallbackPieData,
        feePercent: 75,
        receivedAmount: 'PKR 1,320,000',
        attendanceData: fallbackLineData,
        attendancePercent: 91,
    });
    const [recentActivities, setRecentActivities] = useState(fallbackRecentActivities);
    const [dashboardStatus, setDashboardStatus] = useState({
        stats: 'loading',
        charts: 'loading',
        activities: 'loading',
    });

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        let isMounted = true;

        const loadDashboardStats = async () => {
            try {
                const [studentsResult, teachersResult, financeResult] = await Promise.allSettled([
                    getStudents('page=1&limit=1'),
                    getTeachers('page=1&limit=1&staffType=teacher'),
                    getFinancialRecords('page=1&limit=1'),
                ]);

                if (!isMounted) return;

                setTopStats((current) => {
                    const studentsTotal = studentsResult.status === 'fulfilled' ? getTotalItems(studentsResult.value) : null;
                    const teachersTotal = teachersResult.status === 'fulfilled' ? getTotalItems(teachersResult.value) : null;
                    const totalFees = financeResult.status === 'fulfilled'
                        ? financeResult.value?.summary?.totalAmdan
                        : null;

                    return {
                        students: studentsTotal !== null ? formatCount(studentsTotal, current.students) : current.students,
                        teachers: teachersTotal !== null ? formatCount(teachersTotal, current.teachers) : current.teachers,
                        fees: totalFees !== null && totalFees !== undefined ? formatCurrency(totalFees, current.fees) : current.fees,
                    };
                });

                const hasStatsData = [studentsResult, teachersResult, financeResult].some((result) => result.status === 'fulfilled');
                setDashboardStatus((current) => ({ ...current, stats: hasStatsData ? 'ready' : 'error' }));

                let hasChartData = false;

                if (financeResult.status === 'fulfilled') {
                    const summary = financeResult.value?.summary || {};
                    const income = Number(summary.totalAmdan || 0);
                    const expense = Number(summary.totalKharch || 0);
                    const total = income + expense;

                    if (total > 0) {
                        hasChartData = true;
                        const incomePercent = Math.round((income / total) * 100);
                        setChartStats((current) => ({
                            ...current,
                            feePercent: incomePercent,
                            receivedAmount: formatCurrency(income, current.receivedAmount),
                            pieData: [
                                { name: 'موصول', value: incomePercent, color: '#00d094' },
                                { name: 'باقی', value: Math.max(0, 100 - incomePercent), color: 'var(--color-bg)' },
                            ],
                        }));
                    }
                }

                const attendanceResults = await Promise.allSettled(
                    getLastSevenDays().map((date) =>
                        getStudentAttendance(`page=1&limit=100&date=${toDateKey(date)}`),
                    ),
                );

                if (!isMounted) return;

                const nextAttendanceData = attendanceResults.map((result, index) => {
                    const fallback = fallbackLineData[index];
                    if (result.status !== 'fulfilled') return fallback;

                    const percent = getAttendancePercent(result.value?.items || []);
                    return {
                        name: fallback.name,
                        value: percent ?? fallback.value,
                    };
                });
                const realAttendanceValues = attendanceResults
                    .filter((result) => result.status === 'fulfilled')
                    .map((result) => getAttendancePercent(result.value?.items || []))
                    .filter((value) => value !== null);

                if (realAttendanceValues.length) {
                    hasChartData = true;
                    const average = Math.round(realAttendanceValues.reduce((sum, value) => sum + value, 0) / realAttendanceValues.length);
                    setChartStats((current) => ({
                        ...current,
                        attendanceData: nextAttendanceData,
                        attendancePercent: average,
                    }));
                }

                setDashboardStatus((current) => ({ ...current, charts: hasChartData ? 'ready' : 'error' }));
            } catch {
                if (!isMounted) return;
                setDashboardStatus((current) => ({ ...current, stats: 'error', charts: 'error' }));
            }
        };

        loadDashboardStats();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadRecentActivities = async () => {
            try {
                const [studentsResult, financeResult] = await Promise.allSettled([
                    getStudents('page=1&limit=5'),
                    getFinancialRecords('page=1&limit=5'),
                ]);

                if (!isMounted) return;

                const studentActivities = studentsResult.status === 'fulfilled'
                    ? (studentsResult.value?.items || []).map((student) => ({
                        title: `${student.fullName || 'نیا طالب علم'} رجسٹر ہوا`,
                        amount: student.admissionNumber ? `داخلہ نمبر: ${student.admissionNumber}` : 'داخلہ مکمل',
                        time: getRelativeTime(student.createdAt || student.updatedAt),
                        color: 'bg-emerald-500',
                        sortDate: getRecordDate(student),
                    }))
                    : [];

                const financeActivities = financeResult.status === 'fulfilled'
                    ? (financeResult.value?.items || []).map((record) => {
                        const isIncome = record.type === 'amdan' || record.type === 'income';
                        return {
                            title: `${record.category || record.financeHead?.name || (isIncome ? 'آمدن' : 'خرچ')} ${isIncome ? 'جمع ہوئی' : 'درج ہوا'}`,
                            amount: formatCurrency(record.amount, 'PKR 0'),
                            time: getRelativeTime(record.createdAt || record.date || record.transactionDate),
                            color: isIncome ? 'bg-blue-500' : 'bg-rose-500',
                            sortDate: getRecordDate(record),
                        };
                    })
                    : [];

                const nextActivities = [...studentActivities, ...financeActivities]
                    .sort((a, b) => b.sortDate - a.sortDate)
                    .slice(0, 4)
                    .map(({ sortDate, ...activity }) => activity);

                if (nextActivities.length) {
                    setRecentActivities(nextActivities);
                }

                setDashboardStatus((current) => ({ ...current, activities: nextActivities.length ? 'ready' : 'error' }));
            } catch {
                if (!isMounted) return;
                setDashboardStatus((current) => ({ ...current, activities: 'error' }));
            }
        };

        loadRecentActivities();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="w-full animate-in fade-in duration-700 font-urdu p-4 bg-[var(--color-bg)] min-h-screen text-[var(--color-text)]">
            {/* 1. Top Core Stats */}
            <div className="flex flex-wrap gap-6 mb-8" dir="rtl">
                <StatCard title={withStatusLabel('کل طلباء', dashboardStatus.stats)} value={topStats.students} icon={Users} colorClass="bg-blue-500" borderClass="bg-blue-500" />
                <StatCard title={withStatusLabel('کل اساتذہ', dashboardStatus.stats)} value={topStats.teachers} icon={UserCheck} colorClass="bg-teal-500" borderClass="bg-teal-500" />
                <StatCard title={withStatusLabel('مجموعی فیس', dashboardStatus.stats)} value={topStats.fees} icon={Wallet} colorClass="bg-rose-500" borderClass="bg-rose-500" />
            </div>

            {/* 2. Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8" dir="rtl">
                <motion.div
                    className="min-h-[450px] bg-[var(--color-surface)] p-8 rounded-[3rem] border border-[var(--color-border)] flex flex-col justify-between shadow-sm"
                >
                    <div className="flex flex-row justify-between items-center mb-6 ">
                        <span className="text-[10px] bg-[var(--color-bg)] px-2 sm:px-2 md:px-4 lg:px-4 py-1.5 rounded-full text-[var(--color-text-muted)] font-black tracking-widest uppercase border border-[var(--color-border)]">{withStatusLabel('Monthly Overview', dashboardStatus.charts)}</span>
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

                <motion.div
                    className="bg-[var(--color-surface)] p-8 rounded-[3rem] border border-[var(--color-border)] flex flex-col min-h-[450px] shadow-sm"
                >
                    <div className="flex justify-between items-center mb-10">
                        <div className="bg-emerald-500/10 text-emerald-500 px-5 py-2 rounded-full text-[10px] font-black tracking-tight border border-emerald-500/20 uppercase">{withStatusLabel(`${chartStats.attendancePercent}% Attendance`, dashboardStatus.charts)}</div>
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

                            <YAxis hide domain={['auto', 'auto']} />

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
            </div>

            {/* 3. Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8" dir="rtl">
                <motion.div
                    className="lg:col-span-5 bg-[var(--color-surface)] p-8 rounded-[3rem] border border-[var(--color-border)] shadow-sm"
                >
                    <h3 className="text-lg font-bold text-[var(--color-text)] mb-6">کوئیک ایکشنز</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "نیا طالب علم", icon: UserPlus, bg: "bg-blue-600 shadow-blue-600/30", path: "/students/admission" },
                            { label: "نئے والدین", icon: Users, bg: "bg-emerald-500 shadow-emerald-500/30", path: "/students/parents" },
                            { label: "حاضری لگائیں", icon: Calendar, bg: "bg-indigo-500 shadow-indigo-500/30", path: "/students/attendance" },
                            { label: "فیس جمع کریں", icon: Wallet, bg: "bg-orange-500 shadow-orange-500/30", path: "/finance/income/fund-collection" }
                        ].map((btn, i) => (
                            <button
                                key={i}
                                onClick={() => navigate(btn.path)}
                                className={`flex flex-col items-center justify-center p-6 ${btn.bg} shadow-lg hover:shadow-2xl text-white rounded-3xl transition-all hover:scale-105 active:scale-95`}
                            >
                                <btn.icon size={26} />
                                <span className="text-xs font-bold mt-2">{btn.label}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    className="lg:col-span-7 bg-[var(--color-surface)] p-8 rounded-[3rem] border border-[var(--color-border)] shadow-sm"
                >
                    <h3 className="text-lg font-bold text-[var(--color-text)] mb-6">{withStatusLabel('تازہ ترین سرگرمیاں', dashboardStatus.activities)}</h3>
                    <div className="space-y-3">
                        {recentActivities.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-5 bg-[var(--color-bg)]/40 hover:bg-[var(--color-bg)] rounded-full transition-all border border-transparent hover:border-[var(--color-border)]">
                                <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${item.color} shadow-lg shadow-current/40`} />
                                    <span className="text-sm font-bold text-[var(--color-text)]">{item.title}</span>
                                </div>
                                <div className="text-left">
                                    <span className="text-xs font-black text-[var(--color-text)] block">{item.amount}</span>
                                    <span className="text-[10px] text-[var(--color-text-muted)]">{item.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* 4. Bottom Financial Cards */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" dir="rtl">
                <StatCard title="قابل ادائیگی" value="PKR 250,000" subValue="آج: 8 مکمل" icon={BookOpen} colorClass="bg-blue-500" borderClass="bg-blue-500" />
                <StatCard title="قابل وصولی" value="PKR 38,000" subValue="87% حاضری" icon={Users} colorClass="bg-emerald-500" borderClass="bg-emerald-500" />
                <StatCard title="کل خرچ" value="PKR 33,000" subValue="78% اوسط حاضری" icon={TrendingUp} colorClass="bg-indigo-500" borderClass="bg-indigo-500" />
                <StatCard title="کل آمدنی" value="PKR 803,000" subValue="اس مہینے 12% اضافہ" icon={Wallet} colorClass="bg-orange-500" borderClass="bg-orange-500" isIncome={true} />
            </motion.div>

        </div>
    );
};
