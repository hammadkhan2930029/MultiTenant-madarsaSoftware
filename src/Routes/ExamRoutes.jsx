import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import { ExamSchedule } from '../Pages/Exams/ExamSchedule';
import { ExamScheduleIndex } from '../Pages/Exams/ExamScheduleIndex';
import { ExamResult } from '../Pages/Exams/ExamResult';
import { ResultGradeScale } from '../Pages/Exams/ResultGradeScale';

export const ExamRoutes = (
    <Route path="exams">
        <Route index element={<Navigate to="schedule-list" replace />} />
        <Route path="schedule-list" element={<ExamScheduleIndex />} />
        <Route path="schedule" element={<ExamSchedule />} />
        <Route path="result" element={<ExamResult />} />
        <Route path="result-grades" element={<ResultGradeScale />} />
    </Route>
);
