import { Route } from 'react-router-dom';
import { TeachersList } from '../Pages/Teachers/TeacherList/TeachersList';
import { EmployeeDetails } from '../Pages/Teachers/TeacherDetails/EmployeeDetails';
import { TeacherAttendance } from '../Pages/Teachers/TeacherAttendance/TeacherAttendance';
import {TeacherAttendanceHistory}from '../Pages/Teachers/AttendanceHistory/AttendanceHistory';
import {TeachersScheduleManager}from '../Pages/Teachers/Schedule/Schedule'
import { SalaryIncrements } from '../Pages/Teachers/SalaryIncrements/SalaryIncrements';
export const TeacherRoutes = (
        <Route path="teachers">
        <Route path="list" element={<TeachersList staffType="teacher" />} />
        <Route path="details/:id" element={<EmployeeDetails />} />
        <Route path="salary-increments" element={<SalaryIncrements />} />
        <Route path="attendance" element={<TeacherAttendance />} />
        <Route path="attendance-history/:id" element={<TeacherAttendanceHistory />} />
        <Route path="schedule" element={<TeachersScheduleManager />} />



    </Route>
);
