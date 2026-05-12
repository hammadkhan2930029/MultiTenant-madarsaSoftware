// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { SideBar } from './Components/SideBar/sidebar';
// import { Dashboard } from './Pages/Dashboard/dashboard';

// // Baaki pages ko bhi import karein
// // import { StudentList } from './pages/Students/StudentList';

// export const App = () => {
//   return (
//     <Router>
//       {/* SideBar ko main wrapper ke tor par rakhein */}
//       <SideBar>
//         <Routes>
//           {/* Default Route */}
//           <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
//           {/* Main Pages */}
//           <Route path="/dashboard" element={<Dashboard />} />
          
//           {/* Students Sub-Routes */}
//           <Route path="/students">
//              <Route path="list" element={<div className="p-10 text-right">فہرست طلباء کا صفحہ</div>} />
//              <Route path="admission" element={<div className="p-10 text-right">نیا داخلہ فارم</div>} />
//           </Route>

//           {/* Teacher Sub-Routes */}
//           <Route path="/teachers">
//              <Route path="list" element={<div className="p-10 text-right">اساتذہ کی لسٹ</div>} />
//           </Route>

//           {/* Baki routes bhi isi tarah add karein... */}
          
//         </Routes>
//       </SideBar>
//     </Router>
//   );
// }

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import {AppRoutes} from './Routes/Route'; 
import { NotificationProvider } from './Components/Notifications/NotificationProvider';

export const App = () => {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </NotificationProvider>
  );
}
