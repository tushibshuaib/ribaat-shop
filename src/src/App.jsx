import { useEffect } from "react";
import { Outlet, Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";
import RequireAdmin from "./components/RequireAdmin.jsx";
import { isConfigured } from "./lib/supabase.js";
import AdminLayout from "./admin/AdminLayout.jsx";
import Banners from "./admin/Banners.jsx";
import Categories from "./admin/Categories.jsx";
import Dashboard from "./admin/Dashboard.jsx";
import Inventory from "./admin/Inventory.jsx";
import Login from "./admin/Login.jsx";
import Orders from "./admin/Orders.jsx";
import ProductForm from "./admin/ProductForm.jsx";
import Products from "./admin/Products.jsx";
import Settings from "./admin/Settings.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Home from "./pages/Home.jsx";
import NotFound from "./pages/NotFound.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Shop from "./pages/Shop.jsx";
import TrackOrder from "./pages/TrackOrder.jsx";

function StoreLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      {!isConfigured ? (
        <div className="config-warning">
          Setup needed: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify, then redeploy.
        </div>
      ) : null}
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="product/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-success" element={<OrderSuccess />} />
        <Route path="track" element={<TrackOrder />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="banners" element={<Banners />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="orders" element={<Orders />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
