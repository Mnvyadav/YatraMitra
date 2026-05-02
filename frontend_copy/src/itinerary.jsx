import "./itinerary.css";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient.js";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const interestConfig = {
  nature:    { emoji: "🌿", color: "#166534", bg: "#dcfce7" },
  religious: { emoji: "🕌", color: "#92400e", bg: "#fef3c7" },
  adventure: { emoji: "🧗", color: "#1e3a8a", bg: "#dbeafe" },
  culture:   { emoji: "🎭", color: "#6b21a8", bg: "#f3e8ff" },
  food:      { emoji: "🍛", color: "#9a3412", bg: "#ffedd5" },
  heritage:  { emoji: "🏛️", color: "#374151", bg: "#f3f4f6" },
  beach:     { emoji: "🏖️", color: "#0e7490", bg: "#cffafe" },
  wildlife:  { emoji: "🐆", color: "#065f46", bg: "#d1fae5" },
  history:   { emoji: "📜", color: "#78350f", bg: "#fef9c3" },
  family:    { emoji: "👨‍👩‍👧", color: "#be185d", bg: "#fce7f3" },
  shopping:  { emoji: "🛍️", color: "#7c3aed", bg: "#ede9fe" },
  village:   { emoji: "🌾", color: "#3f6212", bg: "#ecfccb" },
  hidden:    { emoji: "🔍", color: "#1e3a5f", bg: "#dbeafe" },
  nightlife: { emoji: "🌙", color: "#1e1b4b", bg: "#e0e7ff" },
};

// Day colors — each day gets a distinct color
const DAY_COLORS = [
  "#C2410C", "#0F766E", "#7C3AED", "#B45309", "#0E7490",
  "#BE185D", "#166534", "#1E3A8A", "#92400E", "#4C1D95",
];
const getDayColor = (day) => DAY_COLORS[(day - 1) % DAY_COLORS.length];

// Numbered marker with day color
function makeIcon(color, label) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;color:white;
      font-family:sans-serif;
    ">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

// Auto-fit map bounds when places change
function MapBounds({ places }) {
  const map = useMap();
  useEffect(() => {
    if (places.length === 0) return;
    const valid = places.filter(p => p.latitude && p.longitude);
    if (valid.length === 0) return;
    const bounds = L.latLngBounds(valid.map(p => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [places, map]);
  return null;
}

function Itinerary() {
  const location = useLocation();
  const navigate = useNavigate();

  const itinerary = location.state?.itinerary || [];

  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeDay, setActiveDay] = useState(null);

  // AI popup
  const [popup, setPopup]           = useState(null);
  const [aiInfo, setAiInfo]         = useState("");
  const [aiLoading, setAiLoading]   = useState(false);
  const [placeImage, setPlaceImage] = useState(null);
  const [imageCredit, setImageCredit] = useState(null);

  const openPlaceInfo = async (place) => {
    setPopup(place);
    setAiInfo("");
    setPlaceImage(null);
    setImageCredit(null);
    setAiLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/itinerary/place-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: place.name, city: place.city })
      });
      const data = await response.json();
      setAiInfo(data.info || "No information available.");
      setPlaceImage(data.imageUrl || null);
      setImageCredit(data.imageCredit || null);
    } catch (err) {
      console.error(err);
      setAiInfo("Sorry, couldn't load place information. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const closePopup = () => {
    setPopup(null); setAiInfo(""); setPlaceImage(null); setImageCredit(null);
  };

  const saveTrip = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/"); return; }
    setSaving(true); setSaveError("");
    const { error } = await supabase.from("saved_trips").insert({ user_id: user.id, itinerary });
    setSaving(false);
    if (error) { console.error(error); setSaveError("Failed to save. Please try again."); }
    else setSaved(true);
  };

  const totalPlaces = itinerary.reduce((acc, d) => acc + (d.places?.length || 0), 0);
  const allCities   = [...new Set(itinerary.flatMap(d => d.places?.map(p => p.city) || []))];

  // Places to show on map (filtered by active day)
  const mapPlaces = (activeDay === null
    ? itinerary.flatMap(d => (d.places || []).map(p => ({ ...p, _day: d.day })))
    : (itinerary.find(d => d.day === activeDay)?.places || []).map(p => ({ ...p, _day: activeDay }))
  ).filter(p => p.latitude && p.longitude);

  // Map center: average of all places
  const mapCenter = mapPlaces.length > 0
    ? [
        mapPlaces.reduce((s, p) => s + p.latitude, 0)  / mapPlaces.length,
        mapPlaces.reduce((s, p) => s + p.longitude, 0) / mapPlaces.length,
      ]
    : [19.7515, 75.7139]; // Maharashtra center

  if (itinerary.length === 0) {
    return (
      <div className="itn-root">
        <div className="itn-empty">
          <span className="itn-empty-icon">🗺️</span>
          <h2>No itinerary found</h2>
          <p>Go back and generate a trip first.</p>
          <button className="itn-btn-back" onClick={() => navigate("/")}>← Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="itn-root">

      {/* ── TOP NAV ── */}
      <div className="itn-topbar">
        <button className="itn-btn-back" onClick={() => navigate("/")}>← Home</button>
        <button className="itn-btn-saved" onClick={() => navigate("/saved")}>📂 My Trips</button>
      </div>

      {/* ── HERO ── */}
      <div className="itn-hero">
        <div className="itn-hero-badge">Your Personalised Itinerary</div>
        <h1 className="itn-hero-title">
          {allCities.length > 0 ? allCities.join(" · ") : "Maharashtra Journey"}
        </h1>
        <div className="itn-hero-stats">
          <div className="itn-stat">
            <span className="itn-stat-num">{itinerary.length}</span>
            <span className="itn-stat-label">{itinerary.length === 1 ? "Day" : "Days"}</span>
          </div>
          <div className="itn-stat-divider" />
          <div className="itn-stat">
            <span className="itn-stat-num">{totalPlaces}</span>
            <span className="itn-stat-label">Places</span>
          </div>
          <div className="itn-stat-divider" />
          <div className="itn-stat">
            <span className="itn-stat-num">{allCities.length}</span>
            <span className="itn-stat-label">{allCities.length === 1 ? "City" : "Cities"}</span>
          </div>
        </div>

        <div className="itn-day-pills">
          <button
            className={`itn-day-pill ${activeDay === null ? "active" : ""}`}
            onClick={() => setActiveDay(null)}
          >All Days</button>
          {itinerary.map((d) => (
            <button
              key={d.day}
              className={`itn-day-pill ${activeDay === d.day ? "active" : ""}`}
              onClick={() => setActiveDay(d.day)}
            >Day {d.day}</button>
          ))}
        </div>
      </div>

      {/* ── MAIN LAYOUT: Itinerary + Map side by side ── */}
      <div className="itn-layout">

        {/* LEFT: Itinerary */}
        <div className="itn-body">
          {itinerary
            .filter((d) => activeDay === null || d.day === activeDay)
            .map((dayPlan, i) => (
              <div key={i} className="itn-day-block" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="itn-day-header">
                  <div className="itn-day-label">
                    <span className="itn-day-num">Day {dayPlan.day}</span>
                    <span className="itn-day-count">{dayPlan.places?.length || 0} places</span>
                  </div>
                  <div className="itn-day-line" />
                </div>

                {dayPlan.places?.length > 0 ? (
                  <div className="itn-places-grid">
                    {dayPlan.places.map((place, idx) => {
                      const cfg = interestConfig[place.interest] || { emoji: "📌", color: "#374151", bg: "#f3f4f6" };
                      return (
                        <div
                          key={idx}
                          className="itn-place-card"
                          style={{ animationDelay: `${i * 0.08 + idx * 0.05}s` }}
                          onClick={() => openPlaceInfo(place)}
                          title="Click for AI info"
                        >
                          <div className="itn-card-accent" style={{ background: cfg.color }} />
                          <div className="itn-card-top">
                            <span className="itn-interest-tag" style={{ color: cfg.color, background: cfg.bg }}>
                              {cfg.emoji} {place.interest}
                            </span>
                            <span className="itn-card-rating">⭐ {place.rating}</span>
                          </div>
                          <h3 className="itn-place-name">{place.name}</h3>
                          <div className="itn-card-footer">
                            <span className="itn-place-city">📍 {place.city}</span>
                            <span className="itn-card-hint">Tap for info →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="itn-empty-day">
                    <span>🌅</span>
                    <p>Not enough places for this day — try selecting more cities or interests.</p>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* RIGHT: Map */}
        <div className="itn-map-panel">
          <div className="itn-map-header">
            <span className="itn-map-title">📍 Places on Map</span>
            <span className="itn-map-count">{mapPlaces.length} locations</span>
          </div>

          {/* Day Legend */}
          <div className="itn-map-legend">
            {itinerary
              .filter(d => d.places?.length > 0)
              .filter(d => activeDay === null || d.day === activeDay)
              .map(d => (
                <div
                  key={d.day}
                  className={`itn-legend-item ${activeDay === d.day ? "active" : ""}`}
                  onClick={() => setActiveDay(activeDay === d.day ? null : d.day)}
                >
                  <span className="itn-legend-dot" style={{ background: getDayColor(d.day) }}>
                    {d.day}
                  </span>
                  <span className="itn-legend-label">Day {d.day}</span>
                  <span className="itn-legend-count">{d.places?.length} places</span>
                </div>
              ))}
          </div>

          <div className="itn-map-wrap">
            <MapContainer
              center={mapCenter}
              zoom={8}
              style={{ width: "100%", height: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapBounds places={mapPlaces} />
              {mapPlaces.map((place, idx) => {
                const color = getDayColor(place._day);
                return (
                  <Marker
                    key={idx}
                    position={[place.latitude, place.longitude]}
                    icon={makeIcon(color, place._day)}
                  >
                    <Popup>
                      <div className="itn-map-popup">
                        <span className="itn-map-popup-day" style={{ background: color }}>
                          Day {place._day}
                        </span>
                        <strong>{place.name}</strong>
                        <span>{place.city}</span>
                        <span>⭐ {place.rating} · {place.interest}</span>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>

      </div>

      {/* ── ACTION BAR ── */}
      <div className="itn-action-bar">
        <div className="itn-action-inner">
          {saved && (
            <div className="itn-success-banner">
              ✅ Trip saved!{" "}
              <span className="itn-success-link" onClick={() => navigate("/saved")}>
                View in My Trips →
              </span>
            </div>
          )}
          {saveError && <div className="itn-error-banner">{saveError}</div>}
          <div className="itn-action-btns">
            {!saved && (
              <button className="itn-btn-save" onClick={saveTrip} disabled={saving}>
                {saving ? "Saving..." : "💾 Save Trip"}
              </button>
            )}
            <button className="itn-btn-view" onClick={() => navigate("/saved")}>
              📂 View Saved Trips
            </button>
          </div>
        </div>
      </div>

      {/* ── AI POPUP ── */}
      {popup && (
        <div className="pi-overlay" onClick={closePopup}>
          <div className="pi-modal" onClick={(e) => e.stopPropagation()}>

            {!aiLoading && placeImage && (
              <div className="pi-image">
                <img src={placeImage} alt={popup.name} />
                <div className="pi-image-overlay">
                  <h2 className="pi-image-title">{popup.name}</h2>
                  <span className="pi-image-city">📍 {popup.city}, Maharashtra</span>
                </div>
                {imageCredit && (
                  <span className="pi-image-credit">Photo by {imageCredit} · Unsplash</span>
                )}
              </div>
            )}

            {(aiLoading || !placeImage) && (
              <div className="pi-header">
                <div className="pi-header-left">
                  <span className="pi-badge">🤖 AI Travel Guide</span>
                  <h2 className="pi-title">{popup.name}</h2>
                  <span className="pi-city">📍 {popup.city}, Maharashtra</span>
                </div>
                <button className="pi-close" onClick={closePopup}>✕</button>
              </div>
            )}

            {!aiLoading && placeImage && (
              <button className="pi-close-over-image" onClick={closePopup}>✕</button>
            )}

            <div className="pi-body">
              {aiLoading ? (
                <div className="pi-loading">
                  <div className="pi-spinner"><span /><span /><span /></div>
                  <p>Fetching travel info for {popup.name}…</p>
                </div>
              ) : (
                <div className="pi-content">
                  {aiInfo.split("\n").map((line, i) => {
                    if (!line.trim()) return <br key={i} />;
                    if (/^---/.test(line)) return null;
                    const clean = line.replace(/\*\*/g, "").replace(/^\*\s?/, "• ");
                    const isHeading = /^[🏛️⏰🎯💡📍]/.test(clean);
                    return isHeading
                      ? <p key={i} className="pi-heading">{clean}</p>
                      : <p key={i} className="pi-text">{clean}</p>;
                  })}
                </div>
              )}
            </div>

            <div className="pi-footer">
              <span>Powered by Gemini AI</span>
              <button className="pi-close-btn" onClick={closePopup}>Close</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Itinerary;