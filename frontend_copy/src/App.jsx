import { useState, useEffect } from "react";
import "./App.css";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [cities, setCities] = useState([]);
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [interests, setInterests] = useState([]);
  const [travelStyle, setTravelStyle] = useState("pilgrim");
  const [pace, setPace] = useState("balanced");
  const [budgetLevel, setBudgetLevel] = useState("comfort");
  const [ticketStep, setTicketStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [authError, setAuthError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
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

  useEffect(() => {
    const prefill = location.state;
    if (!prefill) return;

    if (Array.isArray(prefill.prefillCities)) {
      setCities(prefill.prefillCities);
    }
    if (Array.isArray(prefill.prefillInterests)) {
      setInterests(prefill.prefillInterests);
    }
    if (prefill.prefillStyle) {
      setTravelStyle(prefill.prefillStyle);
    }
    if (prefill.prefillPace) {
      setPace(prefill.prefillPace);
    }
    if (prefill.prefillBudget) {
      setBudgetLevel(prefill.prefillBudget);
    }
    if (prefill.prefillDays) {
      const start = new Date();
      const end = new Date(start);
      end.setDate(start.getDate() + Number(prefill.prefillDays) - 1);
      setDepartureDate(start.toISOString().slice(0, 10));
      setReturnDate(end.toISOString().slice(0, 10));
    }

    window.history.replaceState({}, document.title);
  }, [location.state]);

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
      const response = await fetch("https://yatramitra-1.onrender.com/api/itinerary/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cities, days, interests, budget: budgetLevel, travelStyle, pace })
      });
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      if (!data.itinerary) { alert("No itinerary returned"); return; }
      navigate("/itinerary", { state: { itinerary: data.itinerary, departureDate, returnDate, travelStyle, pace, budgetLevel } });
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

  const applyPreset = (preset) => {
    setCities(preset.cities);
    setInterests(preset.interests);
    setTravelStyle(preset.style);
    setPace(preset.pace);
    setBudgetLevel(preset.budget);
    const start = new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + preset.days - 1);
    setDepartureDate(start.toISOString().slice(0, 10));
    setReturnDate(end.toISOString().slice(0, 10));
    setTicketStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    { name: "Chhatrapati SambhajiNagar", emoji: "🦁" },
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
  
  ];

  const travelStyles = [
    { id: "pilgrim", label: "Pilgrim", icon: "🙏", note: "Temples, aarti, easier mornings" },
    { id: "family", label: "Family", icon: "👨‍👩‍👧", note: "Comfortable stops and safer pace" },
    { id: "youth", label: "Youth", icon: "🎒", note: "Food, views, hidden spots" },
  ];

  const paceOptions = [
    { id: "easy", label: "Easy", icon: "🌿" },
    { id: "balanced", label: "Balanced", icon: "⚖️" },
    { id: "packed", label: "Packed", icon: "⚡" },
  ];

  const budgetOptions = [
    { id: "budget", label: "Budget", icon: "₹" },
    { id: "comfort", label: "Comfort", icon: "🏨" },
    { id: "premium", label: "Premium", icon: "✨" },
  ];

  const journeyPresets = [
    {
      title: "Sai Darshan Weekend",
      desc: "Shirdi, Nashik temples, calm family-friendly pace.",
      icon: "🙏",
      cities: ["Shirdi", "Nashik"],
      interests: ["religious", "family", "food"],
      days: 2,
      style: "pilgrim",
      pace: "easy",
      budget: "comfort",
    },
    {
      title: "Monsoon Youth Escape",
      desc: "Lonavala and Pune with viewpoints, cafes, and adventure.",
      icon: "🎒",
      cities: ["Lonavala", "Pune"],
      interests: ["nature", "adventure", "food", "hidden"],
      days: 3,
      style: "youth",
      pace: "packed",
      budget: "budget",
    },
    {
      title: "Heritage Family Yatra",
      desc: "Ajanta-Ellora side of Maharashtra with history and comfort.",
      icon: "🏛️",
      cities: ["Chhatrapati SambhajiNagar"],
      interests: ["history", "culture", "family"],
      days: 3,
      style: "family",
      pace: "balanced",
      budget: "comfort",
    },
    {
      title: "Kumbh 2027 Starter",
      desc: "Nashik pilgrim route with ghats, darshan, and stay planning.",
      icon: "🔱",
      cities: ["Nashik"],
      interests: ["religious", "culture", "family"],
      days: 3,
      style: "pilgrim",
      pace: "easy",
      budget: "comfort",
    },
  ];

  const ticketSteps = [
    { label: "Cities", icon: "📍", hint: cities.length ? `${cities.length} selected` : "Pick places" },
    { label: "Dates", icon: "📅", hint: departureDate && returnDate ? "Dates set" : "Choose dates" },
    { label: "Interests", icon: "✨", hint: interests.length ? `${interests.length} selected` : "Choose vibe" },
    { label: "Mood", icon: "🧭", hint: travelStyles.find(s => s.id === travelStyle)?.label || "Style" },
    { label: "Pace", icon: "🎟️", hint: `${pace} · ${budgetLevel}` },
  ];

  const isLastTicketStep = ticketStep === ticketSteps.length - 1;
  const goToNextTicketStep = () => setTicketStep((step) => Math.min(step + 1, ticketSteps.length - 1));
  const goToPreviousTicketStep = () => setTicketStep((step) => Math.max(step - 1, 0));

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
              <button className="nav-btn-outline" onClick={() => navigate("/kumbh")}>
                🔱 Kumbh 2027
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
              <button className="nav-btn-outline" onClick={() => navigate("/kumbh")}>
                🔱 Kumbh 2027
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

            <div className="ticket-head">
              <div>
                <span className="ticket-kicker">Yatra Ticket</span>
                <h2 className="ticket-title">{ticketSteps[ticketStep].icon} {ticketSteps[ticketStep].label}</h2>
              </div>
              <span className="ticket-count">Step {ticketStep + 1} / {ticketSteps.length}</span>
            </div>

            <div className="ticket-rail">
              {ticketSteps.map((step, index) => (
                <button
                  key={step.label}
                  className={`ticket-stop ${ticketStep === index ? "active" : ""} ${ticketStep > index ? "done" : ""}`}
                  onClick={() => setTicketStep(index)}
                >
                  <span>{step.icon}</span>
                  <strong>{step.label}</strong>
                  <small>{step.hint}</small>
                </button>
              ))}
            </div>

            <div className="ticket-window">
              {ticketStep === 0 && (
                <div className="planner-section ticket-slide">
                  <label className="planner-label">📍 Select Cities</label>
                  <p className="ticket-help">Choose one or more cities for your Maharashtra journey.</p>
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
              )}

              {ticketStep === 1 && (
                <div className="planner-section ticket-slide">
                  <label className="planner-label">📅 Travel Dates</label>
                  <p className="ticket-help">Set the journey window so the planner can decide how many days to build.</p>
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
              )}

              {ticketStep === 2 && (
                <div className="planner-section ticket-slide">
                  <label className="planner-label">✨ Your Interests</label>
                  <p className="ticket-help">Pick what matters most: darshan, food, nature, culture, or hidden places.</p>
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
              )}

              {ticketStep === 3 && (
                <div className="planner-section ticket-slide">
                  <label className="planner-label">🧭 Travel Mood</label>
                  <p className="ticket-help">Choose the kind of route that feels right for your group.</p>
                  <div className="option-grid option-grid--three">
                    {travelStyles.map((style) => (
                      <button
                        key={style.id}
                        className={`option-card ${travelStyle === style.id ? "active" : ""}`}
                        onClick={() => setTravelStyle(style.id)}
                      >
                        <span className="option-icon">{style.icon}</span>
                        <span className="option-title">{style.label}</span>
                        <span className="option-note">{style.note}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {ticketStep === 4 && (
                <div className="planner-section planner-mini-grid ticket-slide">
                  <div>
                    <label className="planner-label">🚶 Pace</label>
                    <p className="ticket-help">How full should each day feel?</p>
                    <div className="segmented">
                      {paceOptions.map((item) => (
                        <button key={item.id} className={pace === item.id ? "active" : ""} onClick={() => setPace(item.id)}>
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="planner-label">💰 Budget</label>
                    <p className="ticket-help">Choose the comfort level for stay, transport, and bookings.</p>
                    <div className="segmented">
                      {budgetOptions.map((item) => (
                        <button key={item.id} className={budgetLevel === item.id ? "active" : ""} onClick={() => setBudgetLevel(item.id)}>
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="ticket-actions">
              <button className="ticket-btn ticket-btn--ghost" onClick={goToPreviousTicketStep} disabled={ticketStep === 0}>
                ← Previous
              </button>
              {!isLastTicketStep ? (
                <button className="ticket-btn ticket-btn--next" onClick={goToNextTicketStep}>
                  Next →
                </button>
              ) : (
                <button className="generate-btn" onClick={generateItinerary} disabled={generating}>
                  {generating ? (
                    <span className="gen-loading">
                      <span className="gen-dot" /><span className="gen-dot" /><span className="gen-dot" />
                      Generating your trip...
                    </span>
                  ) : "✦ Generate My Itinerary"}
                </button>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ══ JOURNEY PRESETS ══ */}
      <section className="journey-presets">
        <div className="section-head">
          <span className="section-badge">Start Faster</span>
          <h2 className="section-title">Ready-Made Indian Journeys</h2>
          <p className="section-sub">Pick a vibe and YatraMitra will set cities, interests, dates, pace, and budget.</p>
        </div>
        <div className="preset-grid">
          {journeyPresets.map((preset) => (
            <button key={preset.title} className="preset-card" onClick={() => applyPreset(preset)}>
              <span className="preset-icon">{preset.icon}</span>
              <span className="preset-title">{preset.title}</span>
              <span className="preset-desc">{preset.desc}</span>
              <span className="preset-meta">{preset.days} days · {preset.pace} pace · {preset.budget}</span>
            </button>
          ))}
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
