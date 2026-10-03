import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CompareProvider } from './context/CompareContext';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileNav } from './components/layout/MobileNav';
import { CartDrawer } from './components/cart/CartDrawer';
import { CompareDrawer } from './components/comparison/CompareDrawer';
import { AuthModal } from './components/auth/AuthModal';

import { HomePage } from './features/home/HomePage';
import { DiscoverPage } from './features/products/DiscoverPage';
import { ProductDetailPage } from './features/products/ProductDetailPage';
import { SearchResultsPage } from './features/search/SearchResultsPage';
import { CheckoutPage } from './features/checkout/CheckoutPage';
import { OrderTrackingPage } from './features/orders/OrderTrackingPage';
import { MySpacePage } from './features/account/MySpacePage';
import { AdminOperationsPage } from './features/admin/AdminOperationsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 mins
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <CompareProvider>
            <BrowserRouter>
              <div className="min-h-screen flex flex-col bg-background text-ink">
                <Navbar />
                
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/discover" element={<DiscoverPage />} />
                    <Route path="/search" element={<SearchResultsPage />} />
                    <Route path="/products/:idOrSlug" element={<ProductDetailPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/orders/:id" element={<OrderTrackingPage />} />
                    <Route path="/my-space" element={<MySpacePage />} />
                    <Route path="/admin" element={<AdminOperationsPage />} />
                  </Routes>
                </main>

                <Footer />
                <MobileNav />

                {/* Floating Drawers & Overlays */}
                <CartDrawer />
                <CompareDrawer />
                <AuthModal />
              </div>
            </BrowserRouter>
          </CompareProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
