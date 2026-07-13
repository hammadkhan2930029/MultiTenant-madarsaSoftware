import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Hifz Components (Inhe aapne jo pages banaye hain unse link karein)
import { DailyJaizaEntry } from '../Pages/Hifz/Daily/DailyJaizaEntry';
import { DailyJaizaList } from '../Pages/Hifz/Daily/DailyJaizaList';
import { WeeklyJaizaForm } from '../Pages/Hifz/Weekly/WeeklyEntry';
import { WeeklyJaizaList } from '../Pages/Hifz/Weekly/WeeklyList';
import { MonthlyJaizaEntry } from '../Pages/Hifz/Monthly/MonthlyEntry';
import { MonthlyJaizaList } from '../Pages/Hifz/Monthly/MonthlyList';
import { ParaJaizaEntry } from '../Pages/Hifz/Sipara/paraEntry';
import { ParaJaizaList } from '../Pages/Hifz/Sipara/paraList';
import { withPermission } from '../Components/Auth/permissionGuards';

export const HifzRoutes = () => {
    const location = useLocation();

    useEffect(() => {
        window.requestAnimationFrame(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
        });
    }, [location.pathname]);

    return (
        <Routes>
            {/* Jab koi direct /hifz par aaye */}
            <Route index element={<Navigate to="daily/entry" replace />} />

            {/* --- 1. Daily --- */}
            <Route path="daily">
                {/* /hifz/daily par aane wale ko entry par bhejdo */}
                <Route index element={<Navigate to="entry" replace />} />
                <Route path="entry" element={withPermission(<DailyJaizaEntry />, 'hifz.daily.create')} />
                <Route path="list" element={withPermission(<DailyJaizaList />, 'hifz.daily.view')} />
            </Route>

            {/* --- 2. Weekly --- */}
            <Route path="weekly">
                <Route index element={<Navigate to="entry" replace />} />
                <Route path="entry" element={withPermission(<WeeklyJaizaForm />, 'hifz.weekly.create')} />
                <Route path="list" element={withPermission(<WeeklyJaizaList />, 'hifz.weekly.view')} />
            </Route>

            {/* --- 3. Monthly --- */}
            <Route path="monthly">
                <Route index element={<Navigate to="entry" replace />} />
                <Route path="entry" element={withPermission(<MonthlyJaizaEntry />, 'hifz.monthly.create')} />
                <Route path="list" element={withPermission(<MonthlyJaizaList />, 'hifz.monthly.view')} />
            </Route>

            {/* --- 4. Para --- */}
            <Route path="para">
                <Route index element={<Navigate to="entry" replace />} />
                <Route path="entry" element={withPermission(<ParaJaizaEntry />, 'hifz.para.create')} />
                <Route path="list" element={withPermission(<ParaJaizaList />, 'hifz.para.view')} />
            </Route>

            {/* Invalid path handling */}
            <Route path="*" element={<Navigate to="daily/entry" replace />} />
        </Routes>
    );
};
