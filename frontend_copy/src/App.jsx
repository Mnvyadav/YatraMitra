import { useState, useEffect } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [cities, setCities] = useState([]);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [interests, setInterests] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignup() {
    setAuthError("");
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    });
    if (error) { setAuthError(error.message); return; }
    setShowSignup(false);
    setShowLogin(true);
    setAuthError("✅ Account created! Please sign in.");
  }

  async function handleLogin() {
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthError(error.message); return; }
    setShowLogin(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function generateItinerary() {
    if (cities.length === 0) {
      alert("Please select at least one city");
      return;
    }
    let days = 1;
    if (departureDate && returnDate) {
      const start = new Date(departureDate);
      const end = new Date(returnDate);
      days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      if (days < 1) days = 1;
    }
    setGenerating(true);
    try {
      const response = await fetch("http://localhost:5000/api/itinerary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cities, days, interests, budget: 2 })
      });
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      if (!data.itinerary) { alert("No itinerary returned"); return; }
      navigate("/itinerary", { state: { itinerary: data.itinerary } });
    } catch (err) {
      console.error(err);
      alert("Backend connection failed. Make sure your server is running.");
    } finally {
      setGenerating(false);
    }
  }

  const toggleCity = (city) =>
    setCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);

  const toggleInterest = (tag) =>
    setInterests(prev => prev.includes(tag) ? prev.filter(i => i !== tag) : [...prev, tag]);

  const cityList = [
    { name: "Mumbai",                    emoji: "🌆" },
    { name: "Pune",                      emoji: "🏙️" },
    { name: "Nashik",                    emoji: "🍇" },
    { name: "Shirdi",                    emoji: "🕌" },
    { name: "Mahabaleshwar",             emoji: "🌿" },
    { name: "Lonavala",                  emoji: "⛰️" },
    { name: "Alibag",                    emoji: "🏖️" },
    { name: "Kolhapur",                  emoji: "👑" },
    { name: "Satara",                    emoji: "🏔️" },
    { name: "Ratnagiri",                 emoji: "🥭" },
    { name: "Chandrapur",                emoji: "🐅" },
    { name: "Buldhana",                  emoji: "🏛️" },
    { name: "Chhatrapati SambhajiNagar", emoji: "⚔️" },
    { name: "Nagpur",                    emoji: "🦁" },
  ];

  const interestList = [
    { tag: "religious", emoji: "🕌" },
    { tag: "nature",    emoji: "🌿" },
    { tag: "adventure", emoji: "🧗" },
    { tag: "history",   emoji: "📜" },
    { tag: "culture",   emoji: "🎭" },
    { tag: "food",      emoji: "🍛" },
    { tag: "family",    emoji: "👨‍👩‍👧" },
    { tag: "village",   emoji: "🌾" },
    { tag: "shopping",  emoji: "🛍️" },
    { tag: "hidden",    emoji: "🔍" },
    { tag: "nightlife", emoji: "🌙" },
  ];

  const destinations = [
    { name: "Shirdi",          desc: "Sai Baba Temple",       emoji: "🕌", tag: "Religious" },
    { name: "Ajanta & Ellora", desc: "UNESCO World Heritage",  emoji: "🏛️", tag: "Heritage"  },
    { name: "Mahabaleshwar",   desc: "Hill Station Paradise",  emoji: "🌿", tag: "Nature"    },
    { name: "Mumbai",          desc: "City of Dreams",         emoji: "🌆", tag: "Culture"   },
    { name: "Lonavala",        desc: "Monsoon Getaway",        emoji: "⛰️", tag: "Adventure" },
    { name: "Alibag",          desc: "Coastal Retreat",        emoji: "🏖️", tag: "Beach"     },
    { name: "Chandrapur",      desc: "Wildlife Sanctuary",     emoji: "🐅", tag: "Nature"    },
  ];

  return (
    <>
      {/* ══ NAVBAR ══ */}
      <nav className="navbar">
        <div className="nav-left">
          <span className="nav-logo-icon">🗺️</span>
          <span className="nav-logo-text">Yatra<span>Mitra</span></span>
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <span className="nav-user">
                <span className="nav-user-dot" />
                {user.email.split("@")[0]}
              </span>
              <button className="nav-btn-outline" onClick={() => navigate("/saved")}>
                📂 My Trips
              </button>
              <button className="nav-btn-ghost" onClick={handleLogout}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button className="nav-btn-ghost" onClick={() => { setAuthError(""); setShowLogin(true); }}>
                Sign In
              </button>
              <button className="nav-btn-primary" onClick={() => { setAuthError(""); setShowSignup(true); }}>
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge">🏆 Maharashtra's Smart Trip Planner</div>
          <h1 className="hero-title">
            Discover the Soul of
            <span className="hero-accent"> Maharashtra</span>
          </h1>
          <p className="hero-sub">
            From ancient temples to misty hill stations — plan your perfect journey in seconds.
          </p>

          {/* PLANNER CARD */}
          <div className="planner-card">

            <div className="planner-section">
              <label className="planner-label">📍 Select Cities</label>
              <div className="city-chips">
                {cityList.map(({ name, emoji }) => (
                  <button
                    key={name}
                    className={`city-chip ${cities.includes(name) ? "active" : ""}`}
                    onClick={() => toggleCity(name)}
                  >
                    {emoji} {name}
                  </button>
                ))}
              </div>
              {cities.length > 0 && (
                <p className="planner-selected">
                  ✓ {cities.length} {cities.length === 1 ? "city" : "cities"} selected
                </p>
              )}
            </div>

            <div className="planner-divider" />

            <div className="planner-section">
              <label className="planner-label">📅 Travel Dates</label>
              <div className="date-row">
                <div className="date-field">
                  <span className="date-field-label">Departure</span>
                  <input type="date" value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)} />
                </div>
                <span className="date-arrow">→</span>
                <div className="date-field">
                  <span className="date-field-label">Return</span>
                  <input type="date" value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="planner-divider" />

            <div className="planner-section">
              <label className="planner-label">✨ Your Interests</label>
              <div className="interest-chips">
                {interestList.map(({ tag, emoji }) => (
                  <button
                    key={tag}
                    className={`chip ${interests.includes(tag) ? "active" : ""}`}
                    onClick={() => toggleInterest(tag)}
                  >
                    {emoji} {tag}
                  </button>
                ))}
              </div>
            </div>

            <button className="generate-btn" onClick={generateItinerary} disabled={generating}>
              {generating ? (
                <span className="gen-loading">
                  <span className="gen-dot" /><span className="gen-dot" /><span className="gen-dot" />
                  Generating your trip...
                </span>
              ) : "✦ Generate My Itinerary"}
            </button>

          </div>
        </div>
      </section>

      {/* ══ DESTINATIONS ══ */}
      <section className="destinations">
        <div className="section-head">
          <span className="section-badge">Popular Picks</span>
          <h2 className="section-title">Explore Maharashtra</h2>
          <p className="section-sub">Hand-picked destinations loved by thousands of travellers</p>
        </div>
        <div className="dest-grid">
          {destinations.map((d) => (
            <div key={d.name} className="dest-card"
              onClick={() => { setCities([d.name]); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <div className="dest-emoji">{d.emoji}</div>
              <span className="dest-tag">{d.tag}</span>
              <h3 className="dest-name">{d.name}</h3>
              <p className="dest-desc">{d.desc}</p>
              <span className="dest-cta">Plan this trip →</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="how-it-works">
        <div className="section-head">
          <span className="section-badge">Simple & Fast</span>
          <h2 className="section-title">Plan in 3 Steps</h2>
        </div>
        <div className="steps-row">
          {[
            { num: "01", icon: "📍", title: "Pick Cities",    desc: "Choose one or more cities across Maharashtra" },
            { num: "02", icon: "✨", title: "Set Interests",  desc: "Tell us what you love — nature, food, temples & more" },
            { num: "03", icon: "🗺️", title: "Get Itinerary", desc: "Instant day-by-day plan, ready to save and follow" },
          ].map((s) => (
            <div key={s.num} className="step-card">
              <div className="step-num">{s.num}</div>
              <div className="step-icon">{s.icon}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ LOGIN MODAL ══ */}
      {showLogin && (
        <div className="modal" onClick={() => setShowLogin(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLogin(false)}>✕</button>
            <div className="modal-icon">🗺️</div>
            <h2>Welcome Back</h2>
            <p className="modal-sub">Sign in to access your saved trips</p>
            {authError && <div className="modal-msg">{authError}</div>}
            <div className="modal-field">
              <label>Email</label>
              <input type="email" placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="modal-field">
              <label>Password</label>
              <input type="password" placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="modal-btn" onClick={handleLogin}>Sign In</button>
            <p className="modal-switch">
              Don't have an account?{" "}
              <span onClick={() => { setShowLogin(false); setShowSignup(true); setAuthError(""); }}>
                Sign Up
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ══ SIGNUP MODAL ══ */}
      {showSignup && (
        <div className="modal" onClick={() => setShowSignup(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSignup(false)}>✕</button>
            <div className="modal-icon">✨</div>
            <h2>Create Account</h2>
            <p className="modal-sub">Start planning your Maharashtra journey</p>
            {authError && <div className="modal-msg">{authError}</div>}
            <div className="modal-field">
              <label>Full Name</label>
              <input type="text" placeholder="Your name"
                onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="modal-field">
              <label>Email</label>
              <input type="email" placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="modal-field">
              <label>Password</label>
              <input type="password" placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button className="modal-btn" onClick={handleSignup}>Create Account</button>
            <p className="modal-switch">
              Already have an account?{" "}
              <span onClick={() => { setShowSignup(false); setShowLogin(true); setAuthError(""); }}>
                Sign In
              </span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default App;