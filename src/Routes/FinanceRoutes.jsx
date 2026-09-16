import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FinanceHeadsSetup } from '../Pages/Finance/Settings/FinanceHeadsSetup/FinanceHeadsSetup';
import { ExpenseHeadsSetup } from '../Pages/Finance/Settings/ExpenceHeads/ExpenceHeads';
import { FundCollection } from '../Pages/Finance/Incomes/FundCollection/FundCollection';
import { FundList } from '../Pages/Finance/Incomes/FundList/FundList';
import { SalaryEntry } from '../Pages/Finance/Expence/Salary/salary';
import { OtherIncomeExpense } from '../Pages/Finance/Transactions/OtherIncomeExpense';
import { FinancialStatement } from '../Pages/Finance/Reports/FinancialStatement';
import { withPermission } from '../Components/Auth/permissionGuards';
import { RequirePermission } from '../Components/Auth/RequirePermission';
import { hasAnyPermission } from '../Constant/AdminAuth';
import { getAdminSession } from '../Constant/AdminAuth';
import { getDefaultRouteForSession } from '../Pages/Auth/authLandingRoutes';

const FinanceIndexRedirect = () => {
    const destinations = [
        { permissions: ['finance.heads.view', 'finance.heads.edit'], path: 'setup/income-expence' },
        { permissions: ['funds.view'], path: 'income/fund-list' },
        { permissions: ['funds.create'], path: 'income/fund-collection' },
        { permissions: ['finance.transactions.view', 'finance.transactions.create'], path: 'other-income-expense' },
        { permissions: ['salary.view'], path: 'expenses/payroll' },
        { permissions: ['finance.reports.view', 'reports.view'], path: 'reports/financial-statements' },
    ];
    const destination = destinations.find((item) => hasAnyPermission(item.permissions));

    return <Navigate to={destination?.path || getDefaultRouteForSession(getAdminSession())} replace />;
};

export const FinanceRoutes = () => {
    return (
        <Routes>
            <Route index element={<FinanceIndexRedirect />} />

            <Route path="setup">
                <Route path="income-expence" element={<RequirePermission anyPermissions={['finance.heads.view', 'finance.heads.edit']}><FinanceHeadsSetup /></RequirePermission>} />
                <Route path="expense-heads" element={<RequirePermission anyPermissions={['finance.heads.view', 'finance.heads.edit']}><ExpenseHeadsSetup /></RequirePermission>} />
                <Route index element={<Navigate to="income-expence" replace />} />
            </Route>

            <Route path="income">
                <Route path="fund-collection" element={withPermission(<FundCollection />, 'funds.create')} />
                <Route path="fund-list" element={withPermission(<FundList />, 'funds.view')} />
            </Route>

            <Route path="expenses">
                <Route path="payroll" element={withPermission(<SalaryEntry />, 'salary.view')} />
            </Route>

            <Route path="other-income-expense" element={<RequirePermission anyPermissions={['finance.transactions.view', 'finance.transactions.create']}><OtherIncomeExpense /></RequirePermission>} />

            <Route path="reports">
                <Route path="financial-statements" element={<RequirePermission anyPermissions={['finance.reports.view', 'reports.view']}><FinancialStatement /></RequirePermission>} />
            </Route>
        </Routes>
    );
};
