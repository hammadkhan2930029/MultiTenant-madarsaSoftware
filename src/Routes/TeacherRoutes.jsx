import { Route } from 'react-router-dom';
import { TeachersList } from '../Pages/Teachers/TeacherList/TeachersList';
import { EmployeeDetails } from '../Pages/Teachers/TeacherDetails/EmployeeDetails';
import { TeacherAttendance } from '../Pages/Teachers/TeacherAttendance/TeacherAttendance';
import {TeacherAttendanceHistory}from '../Pages/Teachers/AttendanceHistory/AttendanceHistory';
import {TeachersScheduleManager}from '../Pages/Teachers/Schedule/Schedule'
import { SalaryIncrements } from '../Pages/Teachers/SalaryIncrements/SalaryIncrements';
import { TeacherAssignments } from '../Pages/Teachers/Assignments/TeacherAssignments';
import { SalaryEntry } from '../Pages/Finance/Expence/Salary/salary';
import { withPermission } from '../Components/Auth/permissionGuards';
import { RequirePermission } from '../Components/Auth/RequirePermission';
export const TeacherRoutes = (
        <Route path="teachers">
        <Route path="list" element={withPermission(<TeachersList staffType="teacher" />, 'teachers.view')} />
        <Route path="details/:id" element={withPermission(<EmployeeDetails />, 'teachers.details.view')} />
        <Route path="salary-increments" element={withPermission(<SalaryIncrements staffType="teacher" />, 'teachers.salary_increments.view')} />
        <Route path="salary" element={withPermission(<SalaryEntry staffType="teacher" />, 'salary.view')} />
        <Route path="attendance" element={<RequirePermission anyPermissions={['teachers.attendance.view', 'teachers.attendance.create', 'teachers.attendance.edit', 'teachers.attendance.delete']}><TeacherAttendance staffType="teacher" /></RequirePermission>} />
        <Route path="attendance-history/:id" element={<RequirePermission anyPermissions={['teachers.attendance.view', 'teachers.attendance.create', 'teachers.attendance.edit', 'teachers.attendance.delete']}><TeacherAttendanceHistory /></RequirePermission>} />
        <Route path="schedule" element={withPermission(<TeachersScheduleManager />, 'teachers.schedule.view')} />
        <Route path="assignments" element={withPermission(<TeacherAssignments />, 'teachers.assignments.view')} />



    </Route>
);
