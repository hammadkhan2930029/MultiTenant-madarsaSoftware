import { Route } from 'react-router-dom';
import { StudentList } from '../Pages/Students/StudentList/StudentsList';
import { AdmissionForm } from '../Pages/Students/AdmissionForm/AdmissionForm';
import { CreateIdCard } from '../Pages/Students/CreateIDCard/CreateIDCard';
import { AttendancePage } from '../Pages/Students/AttendancePage/AttendancePage';
import { StudentAddToClass } from '../Pages/Students/StudentAddToClass/StudentAddToClass';
import { StudentScheduleManager } from '../Pages/Students/Schedule/Schedule'
import { FeesCollection } from '../Pages/Students/FeeGeneration/FeeGeneration';
import { StudentFeeDetail } from '../Pages/Students/FeeGeneration/StudentFeeDetails';
import { StudentProfile } from '../Pages/Students/StudentProfile/StudentProfile';
import { ParentsList } from '../Pages/Students/Parents/ParentsList';
import { ParentProfile } from '../Pages/Students/Parents/ParentProfile';
import { withPermission } from '../Components/Auth/permissionGuards';
import { RequirePermission } from '../Components/Auth/RequirePermission';


export const StudentRoutes = (
    <Route path="students">
        <Route path="list" element={withPermission(<StudentList />, 'students.view')} />
        <Route path="admission" element={withPermission(<AdmissionForm />, 'students.create')} />
        <Route path="create-id-card" element={withPermission(<CreateIdCard />, 'students.id_card.view')} />
        <Route path="parents" element={<RequirePermission anyPermissions={['parents.view', 'parents.create', 'parents.edit', 'parents.delete']}><ParentsList /></RequirePermission>} />
        <Route path="parents/profile/:id" element={<RequirePermission anyPermissions={['parents.view', 'parents.edit']}><ParentProfile /></RequirePermission>} />
        <Route path="attendance" element={<RequirePermission anyPermissions={['attendance.view', 'attendance.create', 'attendance.edit', 'attendance.delete']}><AttendancePage /></RequirePermission>} />
        <Route path="class_asign" element={withPermission(<StudentAddToClass />, 'students.assign_class')} />
        <Route path="schedule" element={withPermission(<StudentScheduleManager />, 'students.schedule.view')} />
        <Route path="fees" element={<RequirePermission anyPermissions={['student_fees.view', 'student_fees.create', 'student_fees.collect', 'student_fees.history', 'student_fees.edit']}><FeesCollection /></RequirePermission>} />
        <Route path="profile/:id" element={withPermission(<StudentProfile />, 'students.profile.view')} />
        <Route path="details/:id" element={<RequirePermission anyPermissions={['student_fees.view', 'student_fees.history', 'student_fees.collect', 'student_fees.edit']}><StudentFeeDetail /></RequirePermission>} />
    </Route>
);
