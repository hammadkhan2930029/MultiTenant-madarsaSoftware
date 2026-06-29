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


export const StudentRoutes = (
    <Route path="students">
        <Route path="list" element={withPermission(<StudentList />, 'students.view')} />
        <Route path="admission" element={withPermission(<AdmissionForm />, 'students.create')} />
        <Route path="create-id-card" element={withPermission(<CreateIdCard />, 'students.id_card.view')} />
        <Route path="parents" element={withPermission(<ParentsList />, 'parents.view')} />
        <Route path="parents/profile/:id" element={withPermission(<ParentProfile />, 'parents.view')} />
        <Route path="attendance" element={withPermission(<AttendancePage />, 'attendance.view')} />
        <Route path="class_asign" element={withPermission(<StudentAddToClass />, 'students.assign_class')} />
        <Route path="schedule" element={withPermission(<StudentScheduleManager />, 'students.schedule.view')} />
        <Route path="fees" element={withPermission(<FeesCollection />, 'fees.view')} />
        <Route path="profile/:id" element={withPermission(<StudentProfile />, 'students.profile.view')} />
        <Route path="details/:id" element={withPermission(<StudentFeeDetail />, 'fees.details.view')} />
    </Route>
);
