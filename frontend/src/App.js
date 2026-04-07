import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SchedeList from "./pages/SchedeList";
import SchedaForm from "./pages/SchedaForm";
import SchedaDetail from "./pages/SchedaDetail";
import Clienti from "./pages/Clienti";
import Operazioni from "./pages/Operazioni";
import Report from "./pages/Report";
import Admin from "./pages/Admin";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/schede" element={
              <ProtectedRoute>
                <Layout><SchedeList /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/schede/nuova" element={
              <ProtectedRoute>
                <Layout><SchedaForm /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/schede/:id" element={
              <ProtectedRoute>
                <Layout><SchedaDetail /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/schede/:id/modifica" element={
              <ProtectedRoute>
                <Layout><SchedaForm /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/clienti" element={
              <ProtectedRoute>
                <Layout><Clienti /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/operazioni" element={
              <ProtectedRoute>
                <Layout><Operazioni /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/report" element={
              <ProtectedRoute>
                <Layout><Report /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <Layout><Admin /></Layout>
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" />
      </div>
    </AuthProvider>
  );
}

export default App;
