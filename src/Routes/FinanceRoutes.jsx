import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { FinanceHeadsSetup } from '../Pages/Finance/Settings/FinanceHeadsSetup/FinanceHeadsSetup';
import { ExpenseHeadsSetup } from '../Pages/Finance/Settings/ExpenceHeads/ExpenceHeads';
import { FundCollection } from '../Pages/Finance/Incomes/FundCollection/FundCollection';
import { FundList } from '../Pages/Finance/Incomes/FundList/FundList';
import { SalaryEntry } from '../Pages/Finance/Expence/Salary/salary';
import { OtherIncomeExpense } from '../Pages/Finance/Transactions/OtherIncomeExpense';
import { FinancialStatement } from '../Pages/Finance/Reports/FinancialStatement';

export const FinanceRoutes = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="setup" replace />} />

            <Route path="setup">
                <Route path="income-expence" element={<FinanceHeadsSetup />} />
                <Route path="expense-heads" element={<ExpenseHeadsSetup />} />
                <Route index element={<Navigate to="income-expence" replace />} />
            </Route>

            <Route path="income">
                <Route path="fund-collection" element={<FundCollection />} />
                <Route path="fund-list" element={<FundList />} />
            </Route>

            <Route path="expenses">
                <Route path="payroll" element={<SalaryEntry />} />
            </Route>

            <Route path="other-income-expense" element={<OtherIncomeExpense />} />

            <Route path="reports">
                <Route path="financial-statements" element={<FinancialStatement />} />
            </Route>
        </Routes>
    );
};
