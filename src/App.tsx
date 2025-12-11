import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BottomNav } from "@/components/ui/BottomNav";
import { DriverBottomNav } from "@/components/ui/DriverBottomNav";
import Index from "./pages/Index";
import Bins from "./pages/Bins";
import BinDetail from "./pages/BinDetail";
import QRPage from "./pages/QRPage";
import Profile from "./pages/Profile";
import Rewards from "./pages/Rewards";
import SpinWheel from "./pages/SpinWheel";
import LuckyDraw from "./pages/LuckyDraw";
import Coupons from "./pages/Coupons";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import DriverHome from "./pages/driver/DriverHome";
import DriverSearch from "./pages/driver/DriverSearch";
import DriverProfile from "./pages/driver/DriverProfile";
import DriverAuth from "./pages/driver/DriverAuth";
import MunicipalAuth from "./pages/municipal/MunicipalAuth";
import MunicipalLayout from "./pages/municipal/MunicipalLayout";
import MunicipalDashboard from "./pages/municipal/MunicipalDashboard";
import MunicipalHouseholds from "./pages/municipal/MunicipalHouseholds";
import MunicipalComplaints from "./pages/municipal/MunicipalComplaints";
import MunicipalCollections from "./pages/municipal/MunicipalCollections";
import MunicipalDrivers from "./pages/municipal/MunicipalDrivers";
import MunicipalTasks from "./pages/municipal/MunicipalTasks";
import MunicipalHazards from "./pages/municipal/MunicipalHazards";
import MunicipalSettings from "./pages/municipal/MunicipalSettings";
import MunicipalRecycling from "./pages/municipal/MunicipalRecycling";
import MunicipalPincode from "./pages/municipal/MunicipalPincode";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          {/* Driver Auth - Separate */}
          <Route path="/driver/auth" element={<DriverAuth />} />
          {/* Municipal Auth - Separate */}
          <Route path="/municipal/auth" element={<MunicipalAuth />} />
          {/* Municipal Dashboard Routes */}
          <Route path="/municipal" element={<MunicipalLayout />}>
            <Route index element={<MunicipalDashboard />} />
            <Route path="households" element={<MunicipalHouseholds />} />
            <Route path="complaints" element={<MunicipalComplaints />} />
            <Route path="collections" element={<MunicipalCollections />} />
            <Route path="drivers" element={<MunicipalDrivers />} />
            <Route path="tasks" element={<MunicipalTasks />} />
            <Route path="hazards" element={<MunicipalHazards />} />
            <Route path="recycling" element={<MunicipalRecycling />} />
            <Route path="pincode" element={<MunicipalPincode />} />
            <Route path="settings" element={<MunicipalSettings />} />
          </Route>
          {/* Driver App Routes */}
          <Route
            path="/driver/*"
            element={
              <div className="max-w-md mx-auto bg-background min-h-screen relative">
                <Routes>
                  <Route path="/" element={<DriverHome />} />
                  <Route path="/search" element={<DriverSearch />} />
                  <Route path="/profile" element={<DriverProfile />} />
                </Routes>
                <DriverBottomNav />
              </div>
            }
          />
          {/* Citizen App Routes */}
          <Route
            path="*"
            element={
              <div className="max-w-md mx-auto bg-background min-h-screen relative">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/bins" element={<Bins />} />
                  <Route path="/bins/:binType" element={<BinDetail />} />
                  <Route path="/qr" element={<QRPage />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/rewards" element={<Rewards />} />
                  <Route path="/spinwheel" element={<SpinWheel />} />
                  <Route path="/luckydraw" element={<LuckyDraw />} />
                  <Route path="/coupons" element={<Coupons />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <BottomNav />
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;