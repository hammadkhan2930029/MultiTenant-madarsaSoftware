const adminRoleNames = ['admin', 'super_admin'];

const permissionLandingRoutes = [
    { permission: 'dashboard.view', path: '/dashboard' },
    { permission: 'teachers.view', path: '/teachers/list' },
    { permission: 'teachers.attendance.view', path: '/teachers/attendance' },
    { permission: 'teachers.schedule.view', path: '/teachers/schedule' },
    { permission: 'finance.view', path: '/finance' },
    { permission: 'funds.view', path: '/finance/income/fund-list' },
    { permission: 'funds.create', path: '/finance/income/fund-collection' },
    { permission: 'salary.view', path: '/finance/expenses/payroll' },
    { permission: 'students.view', path: '/students/list' },
    { permission: 'students.create', path: '/students/admission' },
    { permission: 'attendance.view', path: '/students/attendance' },
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
    const firstAllowedRoute = permissionLandingRoutes.find((route) => permissions.includes(route.permission));

    return firstAllowedRoute?.path || '/Profile/change-password';
};
