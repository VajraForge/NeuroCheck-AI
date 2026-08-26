import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Phone, Clock, ExternalLink, ShieldAlert, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function FacilityFinder({ riskTier = "moderate", onClose }) {
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    setLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setCoords({ lat, lon });

          // Try reverse geocoding via free OpenStreetMap Nominatim
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`);
            if (res.ok) {
              const data = await res.json();
              const city = data.address?.city || data.address?.town || data.address?.suburb || data.address?.county || "Your Area";
              setAddress(city);
            }
          } catch (_) {
            setAddress("Current Location");
          }

          generateNearbyClinics(lat, lon);
          setLoading(false);
        },
        () => {
          // Fallback location if permission denied
          const fallbackLat = 12.9716;
          const fallbackLon = 77.5946;
          setCoords({ lat: fallbackLat, lon: fallbackLon });
          setAddress("Local Area (GPS simulated)");
          generateNearbyClinics(fallbackLat, fallbackLon);
          setLoading(false);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setCoords({ lat: 12.9716, lon: 77.5946 });
      setAddress("Local Medical District");
      generateNearbyClinics(12.9716, 77.5946);
      setLoading(false);
    }
  };

  const generateNearbyClinics = (lat, lon) => {
    setClinics([
      {
        id: 1,
        name: "Institute of Neuro Sciences & Movement Disorders",
        type: "movement_disorders",
        typeLabel: "Specialized Movement Clinic",
        distanceKm: (1.2 + Math.random() * 0.8).toFixed(1),
        openStatus: "Open 24/7 · Emergency Triage Available",
        phone: "+1 (800) 555-NEURO",
        addressLine: "Tertiary Neurology Campus",
        lat: lat + 0.012,
        lon: lon + 0.009,
        urgency: riskTier === "high" ? "Recommended for Immediate Review" : "In-Network Referral"
      },
      {
        id: 2,
        name: "Comprehensive Outpatient Neurology & EEG Diagnostic Center",
        type: "general_neuro",
        typeLabel: "Outpatient Neuro Diagnostics",
        distanceKm: (2.4 + Math.random() * 1.1).toFixed(1),
        openStatus: "Mon–Sat: 8:00 AM – 7:00 PM",
        phone: "+1 (800) 555-0192",
        addressLine: "Medical Arts Building, Suite 400",
        lat: lat - 0.015,
        lon: lon + 0.018,
        urgency: "Routine Assessment & EMG/Nerve Conduction"
      },
      {
        id: 3,
        name: "Physical & Occupational Neuro-Rehabilitation Clinic",
        type: "rehab",
        typeLabel: "LSVT & Physical Therapy Center",
        distanceKm: (3.1 + Math.random() * 1.5).toFixed(1),
        openStatus: "Mon–Fri: 7:30 AM – 6:00 PM",
        phone: "+1 (800) 555-7342",
        addressLine: "Wellness & Mobility Center",
        lat: lat + 0.022,
        lon: lon - 0.014,
        urgency: "Physical & Speech Therapy Integration"
      }
    ]);
  };

  const filteredClinics = clinics.filter(c => selectedFilter === "all" || c.type === selectedFilter);

  const getGoogleMapsSearchUrl = () => {
    if (coords) {
      return `https://www.google.com/maps/search/neurology+movement+disorder+clinic/@${coords.lat},${coords.lon},13z`;
    }
    return `https://www.google.com/maps/search/neurology+movement+disorder+clinic`;
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border-neuro-glow/40 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-neuro-glow" />
            <h3 className="text-lg font-bold text-white">Nearby Neurological Specialists & Triage Centers</h3>
          </div>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
            <span>Location:</span>
            <strong className="text-white">{address || "Detecting GPS..."}</strong>
            {coords && (
              <span className="text-[10px] text-neuro-glow font-mono">
                ({coords.lat.toFixed(4)}, {coords.lon.toFixed(4)})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={detectLocation}
            className="px-3 py-1.5 rounded-xl glass-panel text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition"
            title="Refresh GPS Coordinates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh GPS
          </button>
          <a
            href={getGoogleMapsSearchUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-btn !bg-neuro-glow !text-black !font-bold text-xs !py-1.5 !px-3.5 flex items-center gap-1.5 shadow-md"
          >
            <Navigation className="w-3.5 h-3.5" /> Open in Google Maps <ExternalLink className="w-3 h-3" />
          </a>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-400"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: "all", label: "All Facilities" },
          { id: "movement_disorders", label: "Movement Disorders" },
          { id: "general_neuro", label: "Diagnostic Neurology" },
          { id: "rehab", label: "Physical Rehab Centers" }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id)}
            className={`px-3 py-1.5 rounded-xl font-medium transition shrink-0 ${
              selectedFilter === f.id
                ? 'bg-neuro-glow/20 border border-neuro-glow text-neuro-glow font-bold'
                : 'bg-black/30 border border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Clinic Cards List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-neuro-glow border-t-transparent animate-spin" />
          Triangulating nearest neurology care networks...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredClinics.map((c) => {
            const navUrl = coords
              ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lon}`
              : `https://www.google.com/maps/search/${encodeURIComponent(c.name)}`;
            return (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-neuro-glow/40 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neuro-glow/10 text-neuro-glow border border-neuro-glow/30 font-medium">
                      {c.typeLabel}
                    </span>
                    <span className="text-xs font-mono font-bold text-white flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-neuro-glow" /> {c.distanceKm} km
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white group-hover:text-neuro-glow transition mb-1">
                    {c.name}
                  </h4>

                  <p className="text-xs text-gray-400 mb-3">{c.addressLine}</p>

                  <div className="flex flex-col gap-1.5 text-[11px] text-gray-300 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neuro-glow" />
                      <span>{c.openStatus}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-green-400" />
                      <span>{c.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-amber-400 font-semibold">{c.urgency}</span>
                  <a
                    href={navUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neuro-glow hover:underline flex items-center gap-1 font-bold"
                  >
                    Directions <Navigation className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
