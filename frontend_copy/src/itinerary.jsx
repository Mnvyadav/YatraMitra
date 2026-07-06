import "./itinerary.css";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient.js";
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const DAY_COLORS = [
  "#C2410C", "#0F766E", "#7C3AED", "#B45309", "#0E7490",
  "#BE185D", "#166534", "#1E3A8A", "#92400E", "#4C1D95",
];
const getDayColor = (day) => DAY_COLORS[(day - 1) % DAY_COLORS.length];

const TIME_SLOTS = ["Morning", "Afternoon", "Evening"];

const tripProfiles = {
  pilgrim: {
    label: "Pilgrim friendly",
    icon: "🙏",
    note: "Start early for darshan, keep footwear/token counters in mind, and leave buffer for aarti or queue time.",
  },
  family: {
    label: "Family friendly",
    icon: "👨‍👩‍👧",
    note: "Keep lunch and rest breaks fixed, avoid late-night transfers, and prefer shorter city hops.",
  },
  youth: {
    label: "Youth friendly",
    icon: "🎒",
    note: "Add cafe stops, sunset viewpoints, local markets, and a little extra time for photos.",
  },
};

const paceNotes = {
  easy: "Easy pace: 2-3 meaningful stops with more rest time.",
  balanced: "Balanced pace: steady sightseeing without rushing every stop.",
  packed: "Packed pace: start early and keep transfers tight.",
};

const budgetNotes = {
  budget: "Budget: use public transport, dharamshalas/hostels, and local thalis where possible.",
  comfort: "Comfort: prefer reliable hotels, app cabs, and pre-booked activities.",
  premium: "Premium: choose private transfers, flexible stays, and guided experiences.",
};

function makeIcon(color, label) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;color:white;font-family:sans-serif;
    ">${label}</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -20],
  });
}

function MapBounds({ places }) {
  const map = useMap();
  useEffect(() => {
    if (places.length === 0) return;
    const valid = places.filter(p => p.latitude && p.longitude);
    if (valid.length === 0) return;
    map.fitBounds(L.latLngBounds(valid.map(p => [p.latitude, p.longitude])), { padding: [40, 40] });
  }, [places, map]);
  return null;
}

// ── Booking buttons — one per interest ──
function getBookingButtons(place, checkin, checkout) {
  const { name, city, interest } = place;
  const encodedName = encodeURIComponent(name);
  const encodedCity = encodeURIComponent(city);
  const citySlug    = city.toLowerCase().replace(/\s+/g, "-");

  const hotelParams = new URLSearchParams({
    ss: `${city}, Maharashtra, India`,
    ...(checkin  && { checkin }),
    ...(checkout && { checkout }),
  });

  const buttons = [
    { label: "🏨 Book Hotel", url: `https://www.booking.com/search.html?${hotelParams}`, color: "#0f766e" },
  ];

  const i = interest?.toLowerCase();

  if (i === "adventure")              buttons.push({ label: "🧗 Book Trek / Activity",  url: `https://www.thrillophilia.com/search?q=${encodedName}+${encodedCity}`, color: "#1e3a8a" });
  if (i === "religious")              buttons.push({ label: "🙏 Book Darshan",           url: `https://devasthan.maharashtra.gov.in`,                                color: "#92400e" });
  if (i === "heritage" || i === "history") buttons.push({ label: "🎟️ Book Entry Ticket", url: `https://asi.payumoney.com`,                                            color: "#374151" });
  if (i === "wildlife")               buttons.push({ label: "🐆 Book Safari",            url: `https://www.tadobaonline.com`,                                        color: "#065f46" });
  if (i === "nature")                 buttons.push({ label: "🌿 Book Nature Tour",       url: `https://www.thrillophilia.com/search?q=${encodedName}+${encodedCity}`, color: "#166534" });
  if (i === "food")                   buttons.push({ label: "🍽️ Find Restaurants",       url: `https://www.zomato.com/${citySlug}`,                                  color: "#e23744" });
  if (i === "beach")                  buttons.push({ label: "🏄 Book Water Sports",      url: `https://www.thrillophilia.com/search?q=water+sports+${encodedCity}`,  color: "#0e7490" });
  if (i === "culture")                buttons.push({ label: "🎭 Book Cultural Show",     url: `https://in.bookmyshow.com/explore/activities/${citySlug}`,            color: "#6b21a8" });
  if (i === "family")                 buttons.push({ label: "🎡 Book Family Activity",   url: `https://www.thrillophilia.com/search?q=family+${encodedCity}`,        color: "#be185d" });
  if (i === "shopping")               buttons.push({ label: "🛍️ Explore Markets",        url: `https://www.thrillophilia.com/search?q=shopping+${encodedCity}`,      color: "#7c3aed" });
  if (i === "village")                buttons.push({ label: "🌾 Book Village Stay",      url: `https://www.booking.com/search.html?ss=${encodedCity}+village+maharashtra`, color: "#3f6212" });

  return buttons;
}

// ── Main Component ──
function Itinerary() {
  const location = useLocation();
  const navigate = useNavigate();

  const itinerary     = location.state?.itinerary    || [];
  const departureDate = location.state?.departureDate || "";
  const returnDate    = location.state?.returnDate    || "";
  const travelStyle   = location.state?.travelStyle   || "pilgrim";
  const pace          = location.state?.pace          || "balanced";
  const budgetLevel   = location.state?.budgetLevel   || "comfort";

  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [saveError, setSaveError]     = useState("");
  const [activeDay, setActiveDay]     = useState(null);
  const [popup, setPopup]             = useState(null);
  const [aiInfo, setAiInfo]           = useState("");
  const [aiLoading, setAiLoading]     = useState(false);
  const [placeImage, setPlaceImage]   = useState(null);
  const [imageCredit, setImageCredit] = useState(null);

  const openPlaceInfo = async (place) => {
    setPopup(place);
    setAiInfo(""); setPlaceImage(null); setImageCredit(null);
    setAiLoading(true);
    try {
      const res  = await fetch("https://yatramitra-1.onrender.com/api/itinerary/place-info", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: place.name, city: place.city })
      });
      const data = await res.json();
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

  const mapPlaces = (activeDay === null
    ? itinerary.flatMap(d => (d.places || []).map(p => ({ ...p, _day: d.day })))
    : (itinerary.find(d => d.day === activeDay)?.places || []).map(p => ({ ...p, _day: activeDay }))
  ).filter(p => p.latitude && p.longitude);

  const mapCenter = mapPlaces.length > 0
    ? [mapPlaces.reduce((s, p) => s + p.latitude,  0) / mapPlaces.length,
       mapPlaces.reduce((s, p) => s + p.longitude, 0) / mapPlaces.length]
    : [19.7515, 75.7139];

  const profile = tripProfiles[travelStyle] || tripProfiles.pilgrim;

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
          <button className={`itn-day-pill ${activeDay === null ? "active" : ""}`} onClick={() => setActiveDay(null)}>All Days</button>
          {itinerary.map((d) => (
            <button key={d.day} className={`itn-day-pill ${activeDay === d.day ? "active" : ""}`} onClick={() => setActiveDay(d.day)}>Day {d.day}</button>
          ))}
        </div>
      </div>

      <div className="itn-smart-strip">
        <div className="itn-smart-card itn-smart-card--main">
          <span className="itn-smart-icon">{profile.icon}</span>
          <div>
            <span className="itn-smart-label">Trip style</span>
            <h3>{profile.label}</h3>
            <p>{profile.note}</p>
          </div>
        </div>
        <div className="itn-smart-card">
          <span className="itn-smart-icon">🚶</span>
          <div>
            <span className="itn-smart-label">Pace</span>
            <p>{paceNotes[pace] || paceNotes.balanced}</p>
          </div>
        </div>
        <div className="itn-smart-card">
          <span className="itn-smart-icon">₹</span>
          <div>
            <span className="itn-smart-label">Budget</span>
            <p>{budgetNotes[budgetLevel] || budgetNotes.comfort}</p>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
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
                  <div className="itn-timeline">
                    {dayPlan.places.map((place, idx) => {
                      const cfg = interestConfig[place.interest] || { emoji: "📌", color: "#374151", bg: "#f3f4f6" };
                      return (
                        <button
                          key={`${place.name}-${idx}`}
                          className="itn-time-slot"
                          onClick={() => openPlaceInfo(place)}
                          style={{ "--slot-color": cfg.color }}
                          title={`View details for ${place.name}`}
                        >
                          <span className="itn-time-badge">{TIME_SLOTS[idx] || `Stop ${idx + 1}`}</span>
                          <span className="itn-time-main">
                            <strong>{place.name}</strong>
                            <span>{cfg.emoji} {place.interest} · {place.city}</span>
                          </span>
                          <span className="itn-time-meta">
                            <span>⭐ {place.rating}</span>
                            <span>Details →</span>
                          </span>
                        </button>
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
          <div className="itn-map-legend">
            {itinerary
              .filter(d => d.places?.length > 0)
              .filter(d => activeDay === null || d.day === activeDay)
              .map(d => (
                <div key={d.day} className={`itn-legend-item ${activeDay === d.day ? "active" : ""}`}
                  onClick={() => setActiveDay(activeDay === d.day ? null : d.day)}>
                  <span className="itn-legend-dot" style={{ background: getDayColor(d.day) }}>{d.day}</span>
                  <span className="itn-legend-label">Day {d.day}</span>
                  <span className="itn-legend-count">{d.places?.length} places</span>
                </div>
              ))}
          </div>
          <div className="itn-map-wrap">
            <MapContainer center={mapCenter} zoom={8} style={{ width: "100%", height: "100%" }} scrollWheelZoom={true}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapBounds places={mapPlaces} />
              {mapPlaces.map((place, idx) => {
                const color = getDayColor(place._day);
                return (
                  <Marker key={idx} position={[place.latitude, place.longitude]} icon={makeIcon(color, place._day)}>
                    <Popup>
                      <div className="itn-map-popup">
                        <span className="itn-map-popup-day" style={{ background: color }}>Day {place._day}</span>
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
              <span className="itn-success-link" onClick={() => navigate("/saved")}>View in My Trips →</span>
            </div>
          )}
          {saveError && <div className="itn-error-banner">{saveError}</div>}
          <div className="itn-action-btns">
            {!saved && (
              <button className="itn-btn-save" onClick={saveTrip} disabled={saving}>
                {saving ? "Saving..." : "💾 Save Trip"}
              </button>
            )}
            <button className="itn-btn-view" onClick={() => navigate("/saved")}>📂 View Saved Trips</button>
          </div>
        </div>
      </div>

      {/* ── AI POPUP ── */}
      {popup && (
        <div className="pi-overlay" onClick={closePopup}>
          <div className="pi-modal" onClick={(e) => e.stopPropagation()}>

            {/* Photo header */}
            {!aiLoading && placeImage && (
              <div className="pi-image">
                <img src={placeImage} alt={popup.name} />
                <div className="pi-image-overlay">
                  <h2 className="pi-image-title">{popup.name}</h2>
                  <span className="pi-image-city">📍 {popup.city}, Maharashtra</span>
                </div>
                {imageCredit && <span className="pi-image-credit">Photo by {imageCredit} · Unsplash</span>}
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
            {!aiLoading && placeImage && <button className="pi-close-over-image" onClick={closePopup}>✕</button>}

            {/* AI guide content */}
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
                    // eslint-disable-next-line no-misleading-character-class
                    const isHeading = /^[🏛️⏰🎯💡📍]/u.test(clean);
                    return isHeading
                      ? <p key={i} className="pi-heading">{clean}</p>
                      : <p key={i} className="pi-text">{clean}</p>;
                  })}
                </div>
              )}
            </div>

            {/* Booking buttons */}
            {!aiLoading && (
              <div className="pi-booking">
                <p className="pi-booking-label">📌 Book for {popup.name}</p>
                <div className="pi-booking-btns">
                  {getBookingButtons(popup, departureDate, returnDate).map((btn, i) => (
                    <a key={i} href={btn.url} target="_blank" rel="noopener noreferrer"
                      className="pi-booking-btn" style={{ background: btn.color }}>
                      {btn.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

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
