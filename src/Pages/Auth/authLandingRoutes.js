const adminRoleNames = ['admin', 'super_admin'];

const permissionLandingRoutes = [
    { permission: 'dashboard.view', path: '/dashboard' },
    { permission: 'teachers.view', path: '/teachers/list' },
    { permissions: ['teachers.attendance.view', 'teachers.attendance.create', 'teachers.attendance.edit', 'teachers.attendance.delete'], path: '/teachers/attendance' },
    { permissions: ['staff.attendance.view', 'staff.attendance.create', 'staff.attendance.edit', 'staff.attendance.delete'], path: '/staff/attendance' },
    { permission: 'teachers.schedule.view', path: '/teachers/schedule' },
    { permissions: ['student_fees.view', 'student_fees.create', 'student_fees.collect', 'student_fees.history', 'student_fees.edit'], path: '/students/fees' },
    { permissions: ['finance.heads.view', 'finance.heads.edit'], path: '/finance/setup/income-expence' },
    { permissions: ['finance.transactions.view', 'finance.transactions.create'], path: '/finance/other-income-expense' },
    { permissions: ['finance.reports.view', 'reports.view'], path: '/finance/reports/financial-statements' },
    { permission: 'funds.view', path: '/finance/income/fund-list' },
    { permission: 'funds.create', path: '/finance/income/fund-collection' },
    { permission: 'salary.view', path: '/finance/expenses/payroll' },
    { permissions: ['parents.view', 'parents.create', 'parents.edit', 'parents.delete'], path: '/students/parents' },
    { permission: 'students.view', path: '/students/list' },
    { permissions: ['students.create', 'admissions.create'], path: '/students/admission' },
    { permissions: ['attendance.view', 'attendance.create', 'attendance.edit', 'attendance.delete'], path: '/students/attendance' },
    { permissions: ['roles.view', 'roles.manage'], path: '/role-management' },
    { permissions: ['users.view', 'users.manage'], path: '/role-management/users' },
    { permission: 'hifz.view', path: '/hifz' },
    { permission: 'hifz.daily.view', path: '/hifz/daily/list' },
    { permission: 'hifz.daily.create', path: '/hifz/daily/entry' },
    { permission: 'store.view', path: '/store/dashboard' },
    { permission: 'store.items.view', path: '/store/items' },
    { permission: 'exams.view', path: '/exams/schedule-list' },
    { permission: 'exam_results.view', path: '/exams/result-list' },
    { permission: 'staff.view', path: '/staff/list' },
    { permission: 'profile.view', path: '/Profile/setting' },
    { permission: 'profile.change_password', path: '/Profile/change-password' },
];

export const isAdminRoleName = (roleName) => adminRoleNames.includes(roleName);

export const getRoleName = (session) => {
    const role = session?.role || session?.admin?.roleDetails || session?.user?.role || session?.admin?.role || '';
    const roleName = typeof role === 'string'
        ? role
        : role?.roleName || role?.role_name || role?.name || '';

    return String(roleName).trim().toLowerCase();
};

export const getDefaultRouteForSession = (session) => {
    const roleName = getRoleName(session);

    if (isAdminRoleName(roleName)) {
        return '/dashboard';
    }

    const permissions = Array.isArray(session?.permissions) ? session.permissions : [];
    const firstAllowedRoute = permissionLandingRoutes.find((route) => (
        route.permissions
            ? route.permissions.some((permission) => permissions.includes(permission))
            : permissions.includes(route.permission)
    ));

    return firstAllowedRoute?.path || '/Profile/change-password';
};
