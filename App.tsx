import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import Login from './pages/Login';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeForm from './pages/employees/EmployeeForm';
import DailyAttendance from './pages/attendance/DailyAttendance';
import WorkerEvaluation from './pages/evaluation/WorkerEvaluation';
import SupervisorEvaluation from './pages/evaluation/SupervisorEvaluation';
import ProductionDashboard from './pages/dashboards/ProductionDashboard';
import Reports from './pages/reports/Reports';
import Notifications from './pages/notifications/Notifications';
import { PERMISSIONS } from './context/AuthContext';

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<ProductionDashboard />} />
              <Route path="employees" element={
                <ProtectedRoute roles={PERMISSIONS.viewAllEmployees}><EmployeeList /></ProtectedRoute>
              } />
              <Route path="employees/:id" element={
                <ProtectedRoute roles={PERMISSIONS.manageEmployees}><EmployeeForm /></ProtectedRoute>
              } />
              <Route path="attendance" element={
                <ProtectedRoute roles={PERMISSIONS.enterAttendance}><DailyAttendance /></ProtectedRoute>
              } />
              <Route path="evaluation/workers" element={
                <ProtectedRoute roles={PERMISSIONS.enterEvaluation}><WorkerEvaluation /></ProtectedRoute>
              } />
              <Route path="evaluation/supervisors" element={
                <ProtectedRoute roles={['admin', 'hr_manager']}><SupervisorEvaluation /></ProtectedRoute>
              } />
              <Route path="reports" element={<Reports />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}
