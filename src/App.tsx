import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActiveDealProvider } from "@/contexts/ActiveDealContext";
import { OwnerScopeProvider } from "@/contexts/OwnerScopeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

const Index = lazy(() => import("./pages/Index.tsx"));
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Deals = lazy(() => import("./pages/Deals.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Pipeline = lazy(() => import("./pages/Pipeline.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Ledger = lazy(() => import("./pages/Ledger.tsx"));
const EnergyLens = lazy(() => import("./pages/EnergyLens.tsx"));
const Incidents = lazy(() => import("./pages/Incidents.tsx"));
const ManageUp = lazy(() => import("./pages/ManageUp.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Manual = lazy(() => import("./pages/Manual.tsx"));
const Forecast = lazy(() => import("./pages/Forecast.tsx"));
const Installs = lazy(() => import("./pages/Installs.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen bg-background">
    {/* Header skeleton matches AppHeader height to avoid CLS on route change */}
    <div className="h-14 border-b border-border bg-card/40 backdrop-blur-sm" />
    <div className="mx-auto max-w-6xl p-6 space-y-4 animate-pulse">
      <div className="h-7 w-48 rounded-md bg-muted" />
      <div className="h-4 w-72 rounded-md bg-muted/70" />
      <div className="grid gap-4 sm:grid-cols-3 mt-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/60" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-muted/40 mt-2" />
    </div>
    <Loader2 className="sr-only" aria-label="Loading" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <OwnerScopeProvider>
              <ActiveDealProvider>
              <ErrorBoundary>
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                    <Route path="/deals" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
                    <Route path="/ledger" element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
                    <Route path="/energy-lens" element={<ProtectedRoute><EnergyLens /></ProtectedRoute>} />
                    <Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />
                    <Route path="/manage-up" element={<ProtectedRoute><ManageUp /></ProtectedRoute>} />
                    <Route path="/manual" element={<ProtectedRoute><Manual /></ProtectedRoute>} />
                    <Route path="/forecast" element={<ProtectedRoute><Forecast /></ProtectedRoute>} />
                    <Route path="/installs" element={<ProtectedRoute><Installs /></ProtectedRoute>} />
                    <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </ActiveDealProvider>
            </OwnerScopeProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
