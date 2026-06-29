import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import { ExamSchedule } from '../Pages/Exams/ExamSchedule';
import { ExamScheduleIndex } from '../Pages/Exams/ExamScheduleIndex';
import { ExamResult } from '../Pages/Exams/ExamResult';
import { ExamResultIndex } from '../Pages/Exams/ExamResultIndex';
import { ResultGradeScale } from '../Pages/Exams/ResultGradeScale';
import { withPermission } from '../Components/Auth/permissionGuards';

export const ExamRoutes = (
    <Route path="exams">
        <Route index element={<Navigate to="schedule-list" replace />} />
        <Route path="schedule-list" element={withPermission(<ExamScheduleIndex />, 'exams.view')} />
        <Route path="schedule" element={withPermission(<ExamSchedule />, 'exams.create')} />
        <Route path="result-list" element={withPermission(<ExamResultIndex />, 'exam_results.view')} />
        <Route path="result" element={withPermission(<ExamResult />, 'exam_results.create')} />
        <Route path="result-grades" element={withPermission(<ResultGradeScale />, 'result_grades.view')} />
    </Route>
);
