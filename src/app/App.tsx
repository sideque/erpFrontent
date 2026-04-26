import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@shared/auth/store';
import { PageLoader } from '@shared/ui/Spinner';
import { AppLayout } from '@widgets/Layout/AppLayout';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { PropertiesPage } from '@pages/PropertiesPage';
import { PropertyDetailsPage } from '@pages/PropertyDetailsPage';
import { OwnersPage } from '@pages/OwnersPage';
import { OwnerProfilePage } from '@pages/OwnerProfilePage';
import { TenantsPage } from '@pages/TenantsPage';
import { ManagementContractsPage } from '@pages/ManagementContractsPage';
import { TenancyContractsPage } from '@pages/TenancyContractsPage';
import { RentPage } from '@pages/RentPage';
import { InvoiceDetailsPage } from '@pages/InvoiceDetailsPage';
import { ExpensesPage } from '@pages/ExpensesPage';
import { MaintenancePage } from '@pages/MaintenancePage';
import { AccountingPage } from '@pages/AccountingPage';
import { OwnerStatementsPage } from '@pages/OwnerStatementsPage';
import { LeadsPage } from '@pages/LeadsPage';
import { SettingsPage } from '@pages/SettingsPage';
import { ForbiddenPage } from '@pages/ForbiddenPage';
import { RequirePermission } from './RequirePermission';
import { JournalEntry } from '@pages/JournalEntry';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30_000 },
  },
});

function ProtectedRoute() {
  const { user, hydrated } = useAuth();
  if (!hydrated) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export function App() {
  const hydrate = useAuth((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontSize: 14 } }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<RequirePermission perm="dashboard.view"><DashboardPage /></RequirePermission>} />
            <Route path="/properties" element={<RequirePermission perm="property.view"><PropertiesPage /></RequirePermission>} />
            <Route path="/properties/:id" element={<RequirePermission perm="property.view"><PropertyDetailsPage /></RequirePermission>} />
            <Route path="/owners" element={<RequirePermission perm="owner.view"><OwnersPage /></RequirePermission>} />
            <Route path="/owners/:id" element={<RequirePermission perm="owner.view"><OwnerProfilePage /></RequirePermission>} />
            <Route path="/tenants" element={<RequirePermission perm="tenant.view"><TenantsPage /></RequirePermission>} />
            <Route path="/management-contracts" element={<RequirePermission perm="mgmtContract.view"><ManagementContractsPage /></RequirePermission>} />
            <Route path="/tenancy-contracts" element={<RequirePermission perm="tenancyContract.view"><TenancyContractsPage /></RequirePermission>} />
            <Route path="/rent" element={<RequirePermission perm="rent.view"><RentPage /></RequirePermission>} />
            <Route path="/rent/invoices/:id" element={<RequirePermission perm="rent.view"><InvoiceDetailsPage /></RequirePermission>} />
            <Route path="/expenses" element={<RequirePermission perm="expense.view"><ExpensesPage /></RequirePermission>} />
            <Route path="/maintenance" element={<RequirePermission perm="maintenance.view"><MaintenancePage /></RequirePermission>} />
            <Route path="/accounting" element={<RequirePermission perm="accounting.view"><AccountingPage /></RequirePermission>} />
            <Route path="/accounting/owner-statements" element={<RequirePermission perm="ownerStatement.view"><OwnerStatementsPage /></RequirePermission>} />
            <Route path="/accounting/journal-entry" element={<RequirePermission perm="ownerStatement.view"><JournalEntry /></RequirePermission>} />
            <Route path="/leads" element={<RequirePermission perm="lead.view"><LeadsPage /></RequirePermission>} />
            <Route path="/settings" element={<RequirePermission perm="user.view"><SettingsPage /></RequirePermission>} />
            <Route path="/forbidden" element={<ForbiddenPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
