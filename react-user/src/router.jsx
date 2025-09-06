import { createBrowserRouter } from "react-router-dom";
import Dashboard from "./views/Dashboard";
import Login from "./views/Login";
import Signup from "./views/Signup";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import OrderForm from "./components/OrderForm";
import OrderFormDirect from "./components/OrderFormDirect";
import Payment from "./components/Payments";
import TransactionWaiting from "./components/transactions/TransactionWaiting";
import TransactionAccepted from "./components/transactions/TransactionAccepted";
import TransactionRejected from "./components/transactions/TransactionRejected";
import Service from "./views/Service";
import About from "./views/About";
import Contact from "./views/Contact";
import RejectedBooking from "./components/RejectedBooking";
import ShoppingCart from "./views/shoppingcart/ShoppingCart";
import WishlistPage from "./views/wishlist/WishlistPage";
import Profile from "./views/Profile";
import UpdateProfile from "./components/UpdateProfile";
import UpdatePassword from "./components/UpdatePassword";
import ListProduct from "./views/category/ListProduct";
import Products from "./views/products/Products";
import ProductDetail from "./views/products/ProductDetail";
import Category from "./views/category/Category";
import Reviews from "./views/review/Reviews";
import TransactionHistory from "./views/transactions/TransactionHistory";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
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
  {
    path: "/order",
    element: <OrderForm />,
  },
  {
    path: "/order-direct",
    element: <OrderFormDirect />,
  },
  {
    path: "/payment", // Add payment route
    element: <Payment />,
  },

  {
    path: "/bookings/:id/rejected",
    element: <RejectedBooking />,
  },
  {
    path: "/transactions/:id/waiting",
    element: <TransactionWaiting />,
  },
  {
    path: "/transactions/:id/accepted",
    element: <TransactionAccepted />,
  },
  {
    path: "/transactions/:id/rejected",
    element: <TransactionRejected />,
  },
  {
    path: "/layanan",
    element: <Service />,
  },
  {
    path: "/tentang",
    element: <About />,
  },
  {
    path: "/kontak",
    element: <Contact />,
  },
  {
    path: "/cart",
    element: <ShoppingCart />,
  },
  {
    path: "/wishlist",
    element: <WishlistPage />,
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
  {
    path: "/products",
    element: <ListProduct />,
  },
  {
    path: "/list-products",
    element: <Products />,
  },
  {
    path: "/categories",
    element: <Category />,
  },
  {
    path: "/reviews",
    element: <Reviews />,
  },
  {
    path: "/products/:id",
    element: <ProductDetail />,
  },
  {
    path: "/transaction-history",
    element: <TransactionHistory />,
  },
]);

export default router;
