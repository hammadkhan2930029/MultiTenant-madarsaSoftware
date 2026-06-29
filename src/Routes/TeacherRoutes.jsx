import { Route } from 'react-router-dom';
import { TeachersList } from '../Pages/Teachers/TeacherList/TeachersList';
import { EmployeeDetails } from '../Pages/Teachers/TeacherDetails/EmployeeDetails';
import { TeacherAttendance } from '../Pages/Teachers/TeacherAttendance/TeacherAttendance';
import {TeacherAttendanceHistory}from '../Pages/Teachers/AttendanceHistory/AttendanceHistory';
import {TeachersScheduleManager}from '../Pages/Teachers/Schedule/Schedule'
import { SalaryIncrements } from '../Pages/Teachers/SalaryIncrements/SalaryIncrements';
import { withPermission } from '../Components/Auth/permissionGuards';
export const TeacherRoutes = (
        <Route path="teachers">
        <Route path="list" element={withPermission(<TeachersList staffType="teacher" />, 'teachers.view')} />
        <Route path="details/:id" element={withPermission(<EmployeeDetails />, 'teachers.details.view')} />
        <Route path="salary-increments" element={withPermission(<SalaryIncrements />, 'teachers.salary_increments.view')} />
        <Route path="attendance" element={withPermission(<TeacherAttendance />, 'teachers.attendance.view')} />
        <Route path="attendance-history/:id" element={withPermission(<TeacherAttendanceHistory />, 'teachers.attendance.view')} />
        <Route path="schedule" element={withPermission(<TeachersScheduleManager />, 'teachers.schedule.view')} />



    </Route>
);
