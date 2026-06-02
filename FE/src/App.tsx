import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import Listings from "./pages/Listings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Explore from "./pages/Explore";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import AppointmentDetail from "./pages/AppointmentDetail";
import ManageProperty from "./pages/ManageProperty";
import AddProperty from "./pages/AddProperty";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import PropertyDetail from "./pages/PropertyDetail";
import PricePrediction from "./pages/PricePrediction";
import Agents from "./pages/Agents";
import AgentDetail from "./pages/AgentDetail";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/" element={<Index />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/prediction" element={<PricePrediction />} />
            <Route path="/listings" element={<Listings />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/agents/:slug" element={<AgentDetail />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/confirm" element={<ResetPasswordConfirm />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* ── Protected routes (cần đăng nhập) ── */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/your-info" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/appointment/:id" element={<ProtectedRoute><AppointmentDetail /></ProtectedRoute>} />
            <Route path="/manage-property/:id" element={<ProtectedRoute requireVerifiedSeller><ManageProperty /></ProtectedRoute>} />
            <Route path="/add-property" element={<ProtectedRoute requireVerifiedSeller><AddProperty /></ProtectedRoute>} />
            <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
