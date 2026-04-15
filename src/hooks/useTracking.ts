import { useEffect } from "react";
import { useStore } from "../store/useStore";

export function useTracking() {
  const { setTrackingData } = useStore();

  useEffect(() => {
    const initTracking = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const referrer = document.referrer;
      
      let utm_source = urlParams.get("utm_source") || referrer || "direct";
      let utm_campaign = urlParams.get("utm_campaign") || (referrer.includes("yandex") ? "search" : referrer.includes("ozon") ? "reflink" : "direct");
      let utm_term = urlParams.get("utm_term") || "clicklink";
      
      // Fetch IP and Geo info with fallback
      let geoData: any = {};
      const geoServices = [
        "https://ipapi.co/json/",
        "https://ip-api.com/json/",
        "https://api.ipify.org?format=json"
      ];

      for (const service of geoServices) {
        try {
          const res = await fetch(service);
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const data = await res.json();
          
          // Normalize data from different services
          geoData = {
            country_code: data.country_code || data.countryCode || "RU",
            ip: data.ip || data.query || "unknown",
            org: data.org || data.as || ""
          };
          break; // Success, stop trying other services
        } catch (e) {
          console.warn(`Failed to fetch from ${service}, trying next...`, e);
        }
      }

      // VPN/Proxy detection logic (simplified for demo)
      // In a real app, you'd use a specialized service like vpnapi.io
      let cn: "line" | "proxy" | "vpn" = "line";
      if (geoData.org && (geoData.org.toLowerCase().includes("vpn") || geoData.org.toLowerCase().includes("proxy") || geoData.org.toLowerCase().includes("hosting"))) {
        cn = "vpn";
      }
      
      const tracking = {
        utm_source,
        utm_campaign,
        utm_term,
        cn,
        country: geoData.country_code || "RU",
        realIp: geoData.ip || "unknown",
      };

      setTrackingData(tracking);

      // Update URL parameters without refresh
      const newParams = new URLSearchParams(window.location.search);
      if (!newParams.has("utm_source")) newParams.set("utm_source", utm_source);
      if (!newParams.has("utm_campaign")) newParams.set("utm_campaign", utm_campaign);
      if (!newParams.has("utm_term")) newParams.set("utm_term", utm_term);
      if (!newParams.has("cn")) newParams.set("cn", cn);

      const newUrl = `${window.location.pathname}?${newParams.toString()}`;
      window.history.replaceState({}, "", newUrl);
    };

    initTracking();
  }, []);
}
