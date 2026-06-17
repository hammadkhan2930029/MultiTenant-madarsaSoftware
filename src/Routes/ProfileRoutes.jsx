import { Route } from 'react-router-dom';
import { CreateCities } from '../Pages/ProfileSetting/Cities/CreateCities'
import { Profile } from '../Pages/ProfileSetting/Profile/Profile'
import { ChangePassword } from '../Pages/ProfileSetting/ChangePassword/ChangePassword';
import { Support } from '../Pages/ProfileSetting/Support/Support';
import { Suggestions } from '../Pages/ProfileSetting/Suggestions/Suggestions';


export const ProfileRoutes = (
    <Route path="Profile">
        <Route path="setting" element={<Profile />} />
        <Route path="change-password" element={<ChangePassword />} />
        <Route path="cities" element={<CreateCities />} />
        <Route path="support" element={<Support />} />
        <Route path="suggestions" element={<Suggestions />} />
    </Route>
);
