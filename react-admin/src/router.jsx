import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "./views/Layout";
import Dashboard from "./views/Dashboard";
import Login from "./views/Login";
import Signup from "./views/Signup";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import SemuaPelanggan from "./views/users/Users";
import TambahPelanggan from "./views/users/CreateUser";
import Saran from "./views/Saran";
import Rating from "./views/ratings/Rating";
import Profile from "./components/Profile";
import UpdateProfile from "./components/UpdateProfile";
import UpdatePassword from "./components/UpdatePassword";
import Products from "./views/products/Products";
import ProductCreate from "./views/products/ProductCreate";
import ProductEdit from "./views/products/ProductEdit";
import ProductDetail from "./views/products/ProductDetail";
import UserTransactions from "./views/transactions/Transactions";
import SizeList from "./views/size/SizeList";
import SizeForm from "./views/size/SizeForm";
import Categories from "./views/category/Category";
import CategoryForm from "./views/category/CategoryForm";
import SalesReport from "./views/reports/SalesReport";

const isAuthenticated = () => {
  return localStorage.getItem("access_token") !== null;
};

const ProtectedLayout = () => {
  return isAuthenticated() ? <Layout /> : <Navigate to="/login" replace />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      {
        path: "/",
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/update-profile",
        element: <UpdateProfile />,
      },
      {
        path: "/update-password",
        element: <UpdatePassword />,
      },
      // Customer Management
      {
        path: "customer/semua",
        element: <SemuaPelanggan />,
      },
      {
        path: "admin/users/create",
        element: <TambahPelanggan />,
      },
      // Product Management
      {
        path: "products",
        element: <Products />,
      },
      {
        path: "products/create",
        element: <ProductCreate />,
      },
      {
        path: "products/edit/:id",
        element: <ProductEdit />,
      },
      {
        path: "products/:id",
        element: <ProductDetail />,
      },
      {
        path: "categories",
        element: <Categories />,
      },
      {
        path: "categories/create",
        element: <CategoryForm />,
      },
      {
        path: "categories/edit/:id",
        element: <CategoryForm />,
      },
      // Transactions
      {
        path: "/transactions",
        element: <UserTransactions />,
      },
      // Reports
      {
        path: "/reports/sales",
        element: <SalesReport />,
      },
      // Feedback
      {
        path: "/feedback/saran",
        element: <Saran />,
      },
      {
        path: "/feedback/testimoni",
        element: <Rating />,
      },
      // Rating Management
      {
        path: "/ratings",
        element: <Rating />,
      },
      // Size Management
      {
        path: "/sizes",
        element: <SizeList />,
      },
      {
        path: "/sizes/create",
        element: <SizeForm />,
      },
      {
        path: "/sizes/edit/:id",
        element: <SizeForm />,
      },
    ],
  },
  // Auth routes
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
]);

export default router;
