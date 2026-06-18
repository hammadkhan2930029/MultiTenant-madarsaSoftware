import { Route } from 'react-router-dom';
import { ShiftManagement } from '../Pages/Settings/CreateShift/CreateShift';
import { DepartmentManagement } from '../Pages/Settings/CreateDepartments/CreateDepartments';
import { QualificationManagement } from '../Pages/Settings/DegreeName/DegreeName'
import { withPermission } from '../Components/Auth/RequirePermission';

export const SettingRoutes = (
    <Route path="setting">
        <Route path="shift" element={withPermission(<ShiftManagement />, 'settings.shifts.view')} />
        <Route path="department" element={withPermission(<DepartmentManagement />, 'settings.departments.view')} />
        <Route path="degree-name" element={withPermission(<QualificationManagement />, 'settings.degrees.view')} />


    </Route>
);
