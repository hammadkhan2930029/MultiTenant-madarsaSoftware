import { Route } from 'react-router-dom';
import { CreateCities } from '../Pages/ProfileSetting/Cities/CreateCities'
import { Profile } from '../Pages/ProfileSetting/Profile/Profile'
import { ChangePassword } from '../Pages/ProfileSetting/ChangePassword/ChangePassword';
import { Support } from '../Pages/ProfileSetting/Support/Support';
import { Suggestions } from '../Pages/ProfileSetting/Suggestions/Suggestions';
import { withPermission } from '../Components/Auth/RequirePermission';


export const ProfileRoutes = (
    <Route path="Profile">
        <Route path="setting" element={withPermission(<Profile />, 'profile.view')} />
        <Route path="change-password" element={withPermission(<ChangePassword />, 'profile.change_password')} />
        <Route path="cities" element={withPermission(<CreateCities />, 'settings.cities.view')} />
        <Route path="support" element={withPermission(<Support />, 'support.view')} />
        <Route path="suggestions" element={withPermission(<Suggestions />, 'suggestions.view')} />
    </Route>
);
