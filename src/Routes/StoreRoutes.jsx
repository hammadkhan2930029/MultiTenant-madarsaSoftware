import { Navigate, Route } from 'react-router-dom';
import { StoreApprovals } from '../Pages/StoreManagement/Approvals/StoreApprovals';
import { StoreCategories } from '../Pages/StoreManagement/Categories/StoreCategories';
import { StoreDashboard } from '../Pages/StoreManagement/Dashboard/StoreDashboard';
import { StoreDamagedStock } from '../Pages/StoreManagement/DamagedStock/StoreDamagedStock';
import { StoreItems } from '../Pages/StoreManagement/Items/StoreItems';
import { StorePurchases } from '../Pages/StoreManagement/Purchases/StorePurchases';
import { StoreReports } from '../Pages/StoreManagement/Reports/StoreReports';
import { StoreReturns } from '../Pages/StoreManagement/Returns/StoreReturns';
import { StoreSupplierDetail } from '../Pages/StoreManagement/Suppliers/StoreSupplierDetail';
import { StoreSuppliers } from '../Pages/StoreManagement/Suppliers/StoreSuppliers';
import { StoreStockIssues } from '../Pages/StoreManagement/StockIssues/StoreStockIssues';
import { StoreUnits } from '../Pages/StoreManagement/Units/Units';
import { withPermission } from '../Components/Auth/permissionGuards';

export const StoreRoutes = (
    <Route path="store">
        <Route index element={<Navigate to="/store/dashboard" replace />} />
        <Route path="approvals" element={withPermission(<StoreApprovals />, 'store.approve')} />
        <Route path="categories" element={withPermission(<StoreCategories />, 'store.categories.view')} />
        <Route path="dashboard" element={withPermission(<StoreDashboard />, 'store.view')} />
        <Route path="damaged-stock" element={withPermission(<StoreDamagedStock />, 'store.damaged_stock.view')} />
        <Route path="items" element={withPermission(<StoreItems />, 'store.items.view')} />
        <Route path="purchases" element={withPermission(<StorePurchases />, 'store.purchases.view')} />
        <Route path="reports" element={withPermission(<StoreReports />, 'store.reports')} />
        <Route path="stock-issues" element={withPermission(<StoreStockIssues />, 'store.stock_issues.view')} />
        <Route path="returns" element={withPermission(<StoreReturns />, 'store.returns.view')} />
        <Route path="suppliers" element={withPermission(<StoreSuppliers />, 'store.suppliers.view')} />
        <Route path="suppliers/:supplierId" element={withPermission(<StoreSupplierDetail />, 'store.suppliers.view')} />
        <Route path="units" element={withPermission(<StoreUnits />, 'store.units.view')} />
    </Route>
);
