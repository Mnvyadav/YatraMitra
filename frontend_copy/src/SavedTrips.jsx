import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import "./savedTrips.css";

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

function SavedTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }

      const { data, error } = await supabase
        .from("saved_trips")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setTrips(data);
      setLoading(false);
    };

    fetchTrips();
  }, [navigate]);

  const deleteTrip = async (id) => {
    if (!window.confirm("Delete this trip?")) return;
    setDeletingId(id);
    const { error } = await supabase.from("saved_trips").delete().eq("id", id);
    if (error) alert("Failed to delete");
    else {
      setTrips((prev) => prev.filter((t) => t.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
    setDeletingId(null);
  };

  const openTrip = (trip) => {
    navigate("/itinerary", { state: { itinerary: trip.itinerary } });
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  const getCities = (trip) => {
    try {
      const days = trip.itinerary || [];
      return [...new Set(days.flatMap((d) => d.places?.map((p) => p.city) || []))];
    } catch { return []; }
  };

  const filteredTrips = trips.filter((trip) => {
    if (!search.trim()) return true;
    return getCities(trip).join(" ").toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="st-root">
        <div className="st-loading">
          <div className="st-spinner"><span /><span /><span /></div>
          <p>Loading your journeys…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="st-root">

      {/* ── TOPBAR ── */}
      <div className="itn-topbar">
        <button className="itn-btn-back" onClick={() => navigate("/")}>
          ← Home
        </button>
        <button className="itn-btn-saved" onClick={() => navigate("/itinerary")}>
          🗺️ New Trip
        </button>
      </div>

      {/* ── HERO ── */}
      <div className="itn-hero">
        <div className="itn-hero-badge">Travel History</div>
        <h1 className="itn-hero-title">My Saved Trips</h1>
        <div className="itn-hero-stats">
          <div className="itn-stat">
            <span className="itn-stat-num">{trips.length}</span>
            <span className="itn-stat-label">{trips.length === 1 ? "Trip" : "Trips"}</span>
          </div>
          <div className="itn-stat-divider" />
          <div className="itn-stat">
            <span className="itn-stat-num">
              {trips.reduce((acc, t) => acc + (t.itinerary?.length || 0), 0)}
            </span>
            <span className="itn-stat-label">Total Days</span>
          </div>
          <div className="itn-stat-divider" />
          <div className="itn-stat">
            <span className="itn-stat-num">
              {[...new Set(trips.flatMap((t) => getCities(t)))].length}
            </span>
            <span className="itn-stat-label">Cities</span>
          </div>
        </div>

        {/* Search */}
        {trips.length > 0 && (
          <div className="st-search-wrap">
            <span>🔍</span>
            <input
              className="st-search"
              type="text"
              placeholder="Search by city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="st-search-clear" onClick={() => setSearch("")}>✕</button>
            )}
          </div>
        )}
      </div>

      {/* ── EMPTY STATE ── */}
      {trips.length === 0 && (
        <div className="itn-empty">
          <span className="itn-empty-icon">🗺️</span>
          <h2>No saved trips yet</h2>
          <p>Generate an itinerary and save it to see it here.</p>
          <button className="itn-btn-save" onClick={() => navigate("/")}>
            Plan a Trip
          </button>
        </div>
      )}

      {trips.length > 0 && filteredTrips.length === 0 && (
        <div className="itn-empty">
          <span className="itn-empty-icon">🔎</span>
          <h2>No trips match "{search}"</h2>
          <button className="itn-btn-view" onClick={() => setSearch("")}>Clear Search</button>
        </div>
      )}

      {/* ── TRIP BLOCKS ── */}
      <div className="itn-body">
        {filteredTrips.map((trip, i) => {
          const days = trip.itinerary || [];
          const cities = getCities(trip);
          const isExpanded = expandedId === trip.id;
          const preview = days[0]?.places?.slice(0, 3) || [];
          const totalPlaces = days.reduce((acc, d) => acc + (d.places?.length || 0), 0);

          return (
            <div
              key={trip.id}
              className="st-trip-block"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              {/* Trip header */}
              <div className="st-trip-header">
                <div className="st-trip-title-row">
                  <div>
                    <div className="itn-hero-badge" style={{ marginBottom: 8 }}>
                      {formatDate(trip.created_at)}
                    </div>
                    <h2 className="itn-day-num" style={{ fontSize: 26 }}>
                      {cities.length > 0 ? cities.join(" · ") : "Maharashtra Trip"}
                    </h2>
                  </div>
                  <button
                    className="st-delete-btn"
                    onClick={() => deleteTrip(trip.id)}
                    disabled={deletingId === trip.id}
                  >
                    {deletingId === trip.id ? "..." : "🗑️"}
                  </button>
                </div>

                <div className="itn-hero-stats" style={{ marginTop: 14, display: "inline-flex" }}>
                  <div className="itn-stat">
                    <span className="itn-stat-num">{days.length}</span>
                    <span className="itn-stat-label">{days.length === 1 ? "Day" : "Days"}</span>
                  </div>
                  <div className="itn-stat-divider" />
                  <div className="itn-stat">
                    <span className="itn-stat-num">{totalPlaces}</span>
                    <span className="itn-stat-label">Places</span>
                  </div>
                  <div className="itn-stat-divider" />
                  <div className="itn-stat">
                    <span className="itn-stat-num">{cities.length}</span>
                    <span className="itn-stat-label">{cities.length === 1 ? "City" : "Cities"}</span>
                  </div>
                </div>
              </div>

              {/* Preview — collapsed */}
              {!isExpanded && preview.length > 0 && (
                <div className="itn-places-grid" style={{ marginTop: 16 }}>
                  {preview.map((place, idx) => {
                    const cfg = interestConfig[place.interest] || { emoji: "📌", color: "#374151", bg: "#f3f4f6" };
                    return (
                      <div key={idx} className="itn-place-card">
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
                        </div>
                      </div>
                    );
                  })}
                  {days[0]?.places?.length > 3 && (
                    <div className="itn-place-card st-more-card">
                      <p>+{days[0].places.length - 3} more on Day 1</p>
                    </div>
                  )}
                </div>
              )}

              {/* Expanded — full itinerary */}
              {isExpanded && days.map((day) => (
                <div key={day.day} className="itn-day-block" style={{ marginTop: 24 }}>
                  <div className="itn-day-header">
                    <div className="itn-day-label">
                      <span className="itn-day-num">Day {day.day}</span>
                      <span className="itn-day-count">{day.places?.length || 0} places</span>
                    </div>
                    <div className="itn-day-line" />
                  </div>
                  <div className="itn-places-grid">
                    {day.places?.map((place, pi) => {
                      const cfg = interestConfig[place.interest] || { emoji: "📌", color: "#374151", bg: "#f3f4f6" };
                      return (
                        <div key={pi} className="itn-place-card">
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Actions */}
              <div className="itn-action-btns" style={{ marginTop: 24 }}>
                <button className="itn-btn-view" onClick={() => toggleExpand(trip.id)}>
                  {isExpanded ? "▲ Collapse" : "▼ Preview All Days"}
                </button>
                <button className="itn-btn-save" onClick={() => openTrip(trip)}>
                  Open Full Trip →
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

export default SavedTrips;