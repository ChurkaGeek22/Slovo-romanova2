import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Payment from "./pages/Payment";
import { useEffect, useState } from "react";
import { useStore } from "./store/useStore";
import { useTracking } from "./hooks/useTracking";

export default function App() {
  const { settings, fetchSettings, fetchSchedule, fetchServices, fetchApplications, fetchChats, fetchBlockedIps } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  useTracking();

  useEffect(() => {
    fetchSettings();
    fetchSchedule();
    fetchServices();
    fetchApplications();
    fetchChats();
    fetchBlockedIps();
    
    // Check auth status
    fetch("/api/check-auth")
      .then(res => res.json())
      .then(data => setIsAuthenticated(data.authenticated))
      .catch(() => setIsAuthenticated(false));

    // Setup WebSocket for real-time updates
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "SETTINGS_UPDATED") {
        useStore.setState({ settings: message.data });
      }
      if (message.type === "SERVICES_UPDATED") {
        useStore.setState({ services: message.data });
      }
      if (message.type === "SCHEDULE_UPDATED") {
        useStore.setState({ schedule: message.data });
      }
      if (message.type === "NEW_APPLICATION" || message.type === "APPLICATION_UPDATED") {
        fetchApplications();
      }
      if (message.type === "CHAT_UPDATED") {
        fetchChats();
      }
    };

    return () => ws.close();
  }, []);

  // Dynamic Metadata
  useEffect(() => {
    if (settings) {
      document.title = settings.title || "Sun_Shine";
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', settings.description || "");

      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      if (settings.keywords && settings.keywords.length > 0) {
        metaKeywords.setAttribute('content', settings.keywords.join(", "));
      }
    }
  }, [settings]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/admin" 
          element={
            isAuthenticated === null ? (
              <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center text-white/20">Загрузка...</div>
            ) : isAuthenticated ? (
              <Admin />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route path="/payment" element={<Payment />} />
      </Routes>
    </Router>
  );
}
