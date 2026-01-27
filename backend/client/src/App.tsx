import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import KycVerification from "./pages/KycVerification";
import ServiceManagement from "./pages/ServiceManagement";
import SystemLogs from "./pages/SystemLogs";
import SystemSettings from "./pages/SystemSettings";
import SmtpSettings from "./pages/SmtpSettings";
import EmailSettings from "./pages/EmailSettings";
import UserProfile from "./pages/UserProfile";
import AnalyticsReports from "@/pages/AnalyticsReports";
import ReportSchedules from "@/pages/ReportSchedules";
import KycReviewerDashboard from "./pages/KycReviewerDashboard";
import SystemAdminDashboard from "./pages/SystemAdminDashboard";
import AuditTrailExport from "./pages/AuditTrailExport";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/"} component={Dashboard} />
      <Route path={"/kyc-reviewer"} component={KycReviewerDashboard} />
      <Route path={"/system-admin"} component={SystemAdminDashboard} />
      <Route path={"/users"} component={UserManagement} />
      <Route path={"/user-profile"} component={UserProfile} />
      <Route path={"/kyc"} component={KycVerification} />
      <Route path={"/analytics-reports"} component={AnalyticsReports} />
      <Route path="/report-schedules" component={ReportSchedules} />
      <Route path={"/services"} component={ServiceManagement} />
      <Route path={"/logs"} component={SystemLogs} />
      <Route path={"/audit-export"} component={AuditTrailExport} />
      <Route path="/settings" component={SystemSettings} />
      <Route path="/settings/smtp" component={SmtpSettings} />
      <Route path="/settings/email" component={EmailSettings} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
