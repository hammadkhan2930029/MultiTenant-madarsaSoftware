import { Route } from 'react-router-dom';
import { CreateClasses } from '../Pages/ClassManagment/CreateClass/CreateClass';
import { CreateSections } from '../Pages/ClassManagment/Sections/Section';
import { CreateSessions } from '../Pages/ClassManagment/Sessions/Session';
import { CreateSubjects } from '../Pages/ClassManagment/Subjects/Subjects'
import { withPermission } from '../Components/Auth/RequirePermission';

export const DepartmentRoutes = (
    <>
        <Route path="class-management">
            <Route path="Classes" element={withPermission(<CreateClasses />, 'classes.view')} />
            <Route path="sections" element={withPermission(<CreateSections />, 'sections.view')} />
            <Route path="session" element={withPermission(<CreateSessions />, 'sessions.view')} />
            <Route path="subjects" element={withPermission(<CreateSubjects />, 'subjects.view')} />


        </Route>
        {/* 
    <Route path="hifz">
      <Route path="daily-report" element={<HifzDaily />} />
      <Route path="exams" element={<HifzExams />} />
    </Route> */}
    </>
);
