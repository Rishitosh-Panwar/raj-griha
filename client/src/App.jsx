import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/customer/Home';
import Rooms from './pages/customer/Rooms';
import BookingConfirmation from './pages/customer/BookingConfirmation';
import Login from './pages/customer/Login';
import Signup from './pages/customer/Signup';
import MyBookings from './pages/customer/MyBookings';
import Dashboard from './pages/admin/Dashboard';
import RoomManagement from './pages/admin/RoomManagement';
import BookingManagement from './pages/admin/BookingManagement';
import MenuManagement from './pages/admin/MenuManagement';
import Menu from './pages/customer/Menu';
import OrderManagement from './pages/admin/OrderManagement';
import MyOrders from './pages/customer/MyOrders';
import GroupBooking from './pages/customer/GroupBooking';
import GroupConfirmation from './pages/customer/GroupConfirmation';
import RoomTypeDetails from './pages/customer/RoomTypeDetails';
import VerifyOtp from './pages/customer/VerifyOtp';
import About from './pages/customer/About';
import Gallery from './pages/customer/Gallery';
import Contact from './pages/customer/Contact';
import GalleryManagement from './pages/admin/GalleryManagement';
import NotFound from './pages/customer/NotFound';
import Privacy from './pages/customer/Privacy';
import Terms from './pages/customer/Terms';
import CancellationPolicy from './pages/customer/CancellationPolicy';
import AdminSettings from './pages/admin/Settings';
import Profile from './pages/customer/Profile';

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/rooms" element={<Layout><Rooms /></Layout>} />
        <Route path="/rooms/type/:type" element={<Layout><RoomTypeDetails /></Layout>} />
        <Route path="/booking-confirmation/:id" element={<Layout><BookingConfirmation /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/signup" element={<Layout><Signup /></Layout>} />
        <Route
          path="/my-bookings"
          element={
            <Layout>
              <ProtectedRoute><MyBookings /></ProtectedRoute>
            </Layout>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout><Dashboard /></AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rooms"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout><RoomManagement /></AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bookings"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout><BookingManagement /></AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout><MenuManagement /></AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/menu" element={<Layout><Menu /></Layout>} />
        <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminLayout><OrderManagement /></AdminLayout></ProtectedRoute>} />
        <Route path="/my-orders" element={<Layout><ProtectedRoute><MyOrders /></ProtectedRoute></Layout>} />
        <Route path="/group-booking" element={<Layout><GroupBooking /></Layout>} />
        <Route path="/group-confirmation/:groupId" element={<Layout><GroupConfirmation /></Layout>} />
        <Route path="/verify-otp" element={<Layout><VerifyOtp /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/gallery" element={<Layout><Gallery /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
        <Route path="/admin/gallery" element={<ProtectedRoute requireAdmin><AdminLayout><GalleryManagement /></AdminLayout></ProtectedRoute>} />
        <Route path="/legal/privacy" element={<Layout><Privacy /></Layout>} />
        <Route path="/terms" element={<Layout><Terms /></Layout>} />
        <Route path="/legal/cancellation-policy" element={<Layout><CancellationPolicy /></Layout>} />
        <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />
        <Route path="/profile" element={<Layout><ProtectedRoute><Profile /></ProtectedRoute></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </>
  );
}

export default App;