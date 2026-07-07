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

export const FinanceRoutes = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="setup" replace />} />

            <Route path="setup">
                <Route path="income-expence" element={withPermission(<FinanceHeadsSetup />, 'finance.heads.view')} />
                <Route path="expense-heads" element={withPermission(<ExpenseHeadsSetup />, 'finance.heads.view')} />
                <Route index element={<Navigate to="income-expence" replace />} />
            </Route>

            <Route path="income">
                <Route path="fund-collection" element={withPermission(<FundCollection />, 'funds.create')} />
                <Route path="fund-list" element={withPermission(<FundList />, 'funds.view')} />
            </Route>

            <Route path="expenses">
                <Route path="payroll" element={withPermission(<SalaryEntry />, 'salary.view')} />
            </Route>

            <Route path="other-income-expense" element={withPermission(<OtherIncomeExpense />, 'finance.transactions.view')} />

            <Route path="reports">
                <Route path="financial-statements" element={withPermission(<FinancialStatement />, 'reports.view')} />
            </Route>
        </Routes>
    );
};
