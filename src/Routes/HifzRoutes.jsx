import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Hifz Components (Inhe aapne jo pages banaye hain unse link karein)
import { DailyJaizaEntry } from '../Pages/Hifz/Daily/DailyJaizaEntry';
import { DailyJaizaList } from '../Pages/Hifz/Daily/DailyJaizaList';
import { WeeklyJaizaForm } from '../Pages/Hifz/Weekly/WeeklyEntry';
import { WeeklyJaizaList } from '../Pages/Hifz/Weekly/WeeklyList';
import { MonthlyJaizaEntry } from '../Pages/Hifz/Monthly/MonthlyEntry';
import { MonthlyJaizaList } from '../Pages/Hifz/Monthly/MonthlyList';
import { ParaJaizaEntry } from '../Pages/Hifz/Sipara/paraEntry';
import { ParaJaizaList } from '../Pages/Hifz/Sipara/paraList';

export const HifzRoutes = () => {
    return (
        <Routes>
            {/* Jab koi direct /hifz par aaye */}
            <Route index element={<Navigate to="daily/entry" replace />} />

            {/* --- 1. Daily --- */}
            <Route path="daily">
                {/* /hifz/daily par aane wale ko entry par bhejdo */}
                <Route index element={<Navigate to="entry" replace />} />
                <Route path="entry" element={<DailyJaizaEntry />} />
                <Route path="list" element={<DailyJaizaList />} />
            </Route>

            {/* --- 2. Weekly --- */}
            <Route path="weekly">
                <Route index element={<Navigate to="entry" replace />} />
                <Route path="entry" element={<WeeklyJaizaForm />} />
                <Route path="list" element={<WeeklyJaizaList />} />
            </Route>

            {/* --- 3. Monthly --- */}
            <Route path="monthly">
                <Route index element={<Navigate to="entry" replace />} />
                <Route path="entry" element={<MonthlyJaizaEntry />} />
                <Route path="list" element={<MonthlyJaizaList />} />
            </Route>

            {/* --- 4. Para --- */}
            <Route path="para">
                <Route index element={<Navigate to="entry" replace />} />
                <Route path="entry" element={<ParaJaizaEntry />} />
                <Route path="list" element={<ParaJaizaList />} />
            </Route>

            {/* Invalid path handling */}
            <Route path="*" element={<Navigate to="daily/entry" replace />} />
        </Routes>
    );
};
