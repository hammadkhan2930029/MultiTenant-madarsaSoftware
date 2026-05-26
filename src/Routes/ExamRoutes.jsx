import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import { ExamSchedule } from '../Pages/Exams/ExamSchedule';

export const ExamRoutes = (
    <Route path="exams">
        <Route index element={<Navigate to="schedule" replace />} />
        <Route path="schedule" element={<ExamSchedule />} />
    </Route>
);
