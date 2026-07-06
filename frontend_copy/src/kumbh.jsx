import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Kumbh.css";

// ── Shahi Snan dates ──
const SNAN_DATES = [
  {
    title: "Flag Hoisting",
    date: "October 31, 2026",
    timestamp: new Date("2026-10-31"),
    location: "Nashik & Trimbakeshwar",
    significance: "Official commencement of the Mela",
    icon: "🚩",
    color: "#e07b00",
  },
  {
    title: "First Shahi Snan",
    date: "August 2, 2027",
    timestamp: new Date("2027-08-02"),
    location: "Ramkund & Kushavarta",
    significance: "Ashadh Somvati Amavasya — first major royal bath",
    icon: "🛕",
    color: "#c2410c",
  },
  {
    title: "Second Shahi Snan",
    date: "August 31, 2027",
    timestamp: new Date("2027-08-31"),
    location: "Ramkund & Kushavarta",
    significance: "Shravan Amavasya — highly auspicious for Lord Shiva",
    icon: "🪔",
    color: "#92400e",
  },
  {
    title: "Third Shahi Snan",
    date: "September 11, 2027",
    timestamp: new Date("2027-09-11"),
    location: "Ramkund, Nashik",
    significance: "Bhadrapada Shukla Ekadashi (Vaishnava)",
    icon: "🌸",
    color: "#7c3aed",
  },
  {
    title: "Third Shahi Snan",
    date: "September 12, 2027",
    timestamp: new Date("2027-09-12"),
    location: "Kushavarta, Trimbakeshwar",
    significance: "Bhadrapada Shukla Ekadashi (Shaiva)",
    icon: "🔱",
    color: "#0f766e",
  },
];

// ── Ghats ──
const GHATS = [
  { name: "Ramkund", desc: "Main bathing ghat on Godavari river. Most sacred — ashes of the dead dissolve here.", icon: "🛕", lat: 19.9975, lng: 73.7898 },
  { name: "Kushavarta", desc: "Sacred tank at Trimbakeshwar — source of Godavari river. Second Shahi Snan site.", icon: "💧", lat: 19.9350, lng: 73.5303 },
  { name: "Tapovan Ghat", desc: "Ancient ghat near Tapovan temple, peaceful and less crowded.", icon: "🌿", lat: 19.9991, lng: 73.7875 },
  { name: "Holkar Bridge Ghat", desc: "Popular ghat with access to Panchavati area.", icon: "🌉", lat: 20.0020, lng: 73.7910 },
  { name: "Trimbakeshwar Temple", desc: "One of 12 Jyotirlingas — most important Shiva shrine for Kumbh.", icon: "🔱", lat: 19.9330, lng: 73.5300 },
  { name: "Kalaram Temple", desc: "Historic Ram temple in Panchavati — must visit during Kumbh.", icon: "🙏", lat: 19.9968, lng: 73.7893 },
];

// ── Packages ──
const PACKAGES = [
  {
    title: "Shahi Snan Day Trip",
    duration: "1 Day",
    from: "Mumbai / Pune",
    desc: "Witness the royal bath procession, Ramkund dip, Panchavati darshan",
    interests: ["religious"],
    days: 1,
    icon: "🛕",
    color: "#c2410c",
    highlight: "Most Popular",
  },
  {
    title: "Kumbh Pilgrim Package",
    duration: "3 Days",
    from: "Nashik stay",
    desc: "Ramkund, Kushavarta, Trimbakeshwar Jyotirlinga, Kalaram Temple, Godavari Aarti",
    interests: ["religious", "heritage"],
    days: 3,
    icon: "🪔",
    color: "#92400e",
    highlight: "Recommended",
  },
  {
    title: "Kumbh + Nashik Explorer",
    duration: "5 Days",
    from: "Nashik stay",
    desc: "Kumbh rituals + Nashik vineyards, forts, nature & local food experiences",
    interests: ["religious", "nature", "adventure", "food"],
    days: 5,
    icon: "🗺️",
    color: "#0f766e",
    highlight: "Best Value",
  },
  {
    title: "Grand Kumbh Yatra",
    duration: "7 Days",
    from: "Nashik + Shirdi",
    desc: "Full Kumbh experience + Shirdi Sai Baba darshan + Trimbakeshwar + Vani",
    interests: ["religious", "heritage", "culture"],
    days: 7,
    icon: "✨",
    color: "#7c3aed",
    highlight: "Complete",
  },
];

const PLAN_STEPS = [
  { num: "01", title: "Pick your Snan date", text: "Use the schedule below to choose the bathing day and ghat." },
  { num: "02", title: "Book stay early", text: "Nashik and Trimbakeshwar rooms fill up months before major dates." },
  { num: "03", title: "Generate your route", text: "Choose a package and YatraMitra will prefill the trip planner." },
];

// ── Countdown ──
function useCountdown(target) {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000)  / 60000),
        seconds: Math.floor((diff % 60000)    / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return timeLeft;
}

export default function Kumbh() {
  const navigate   = useNavigate();
  const countdown  = useCountdown(new Date("2027-08-02").getTime());
  const [activeTab, setActiveTab] = useState("dates");

  const handlePlanTrip = (pkg) => {
    navigate("/", {
      state: {
        prefillCities:    ["Nashik"],
        prefillInterests: pkg.interests,
        prefillDays:      pkg.days,
      }
    });
  };

  return (
    <div className="kb-root">

      {/* ── HERO ── */}
      <section className="kb-hero">
        <div className="kb-hero-overlay" />
        <div className="kb-hero-pattern" />

        <div className="kb-hero-content">
          <button className="kb-back" onClick={() => navigate("/")}>← Home</button>

          <div className="kb-hero-badge">🔱 Simhastha Kumbh Mela 2027</div>

          <h1 className="kb-hero-title">
            नाशिक कुंभ
            <span className="kb-hero-title-en">Nashik Kumbh</span>
          </h1>

          <p className="kb-hero-sub">
            Plan the sacred Godavari journey with dates, ghats, stays, safety tips,
            and a ready itinerary for Nashik and Trimbakeshwar.
          </p>

          {/* Countdown */}
          <div className="kb-countdown">
            <div className="kb-countdown-label">First Shahi Snan — August 2, 2027</div>
            <div className="kb-countdown-boxes">
              {[
                { val: countdown.days,    label: "Days"    },
                { val: countdown.hours,   label: "Hours"   },
                { val: countdown.minutes, label: "Minutes" },
                { val: countdown.seconds, label: "Seconds" },
              ].map(({ val, label }) => (
                <div key={label} className="kb-count-box">
                  <span className="kb-count-num">{String(val ?? "0").padStart(2, "0")}</span>
                  <span className="kb-count-label">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="kb-hero-btns">
            <button className="kb-btn-primary" onClick={() => document.getElementById("kb-packages").scrollIntoView({ behavior: "smooth" })}>
              🗺️ Plan My Kumbh Trip
            </button>
            <button className="kb-btn-outline" onClick={() => document.getElementById("kb-dates").scrollIntoView({ behavior: "smooth" })}>
              📅 View Shahi Snan Dates
            </button>
          </div>
        </div>

        <div className="kb-hero-card" aria-label="Kumbh route overview">
          <div className="kb-route-card">
            <span className="kb-route-label">Main route</span>
            <div className="kb-route-line">
              <span>Ramkund</span>
              <i />
              <span>Trimbakeshwar</span>
            </div>
            <p>45 km between the two primary bathing centers. Plan separate time blocks for each.</p>
          </div>
          <div className="kb-visual">
            <div className="kb-sun" />
            <div className="kb-temple">
              <span />
              <span />
              <span />
            </div>
            <div className="kb-river" />
          </div>
        </div>
      </section>

      {/* ── QUICK PLANNER ── */}
      <section className="kb-quick-plan">
        <div className="kb-quick-inner">
          {PLAN_STEPS.map((step) => (
            <div key={step.num} className="kb-quick-step">
              <span className="kb-quick-num">{step.num}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT KUMBH ── */}
      <section className="kb-about">
        <div className="kb-about-grid">
          <div className="kb-about-text">
            <span className="kb-section-badge">About Nashik Kumbh</span>
            <h2 className="kb-section-title">Every 12 Years, the Divine Descends</h2>
            <p>Nashik Simhastha Kumbh Mela is one of the four sacred Kumbh Mela sites in India. Held on the banks of the holy Godavari river, it draws over <strong>30 million pilgrims</strong> from across the world.</p>
            <p>The Kumbh is held when Jupiter enters Leo (Simha) — hence the name Simhastha. The sacred bathing ghats of Ramkund in Nashik and Kushavarta in Trimbakeshwar are the two primary pilgrimage centers.</p>
            <div className="kb-stats">
              {[
                { num: "30M+", label: "Pilgrims Expected" },
                { num: "45", label: "Days of Mela" },
                { num: "5", label: "Shahi Snan Dates" },
                { num: "12", label: "Years Between Kumbhs" },
              ].map(s => (
                <div key={s.label} className="kb-stat">
                  <span className="kb-stat-num">{s.num}</span>
                  <span className="kb-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="kb-about-panel" aria-label="Nashik Kumbh overview">
            <div className="kb-panel-top">
              <span className="kb-panel-icon">🔱</span>
              <div>
                <span className="kb-panel-label">Pilgrim focus</span>
                <h3>Ramkund + Kushavarta</h3>
              </div>
            </div>
            <div className="kb-panel-map">
              <div className="kb-map-node kb-map-node-a">Ramkund</div>
              <div className="kb-map-path" />
              <div className="kb-map-node kb-map-node-b">Trimbakeshwar</div>
            </div>
            <div className="kb-panel-list">
              <span>🛕 Main bathing ghats</span>
              <span>🚕 Advance local transport</span>
              <span>🏨 Early accommodation booking</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── TABS: DATES / GHATS ── */}
      <section className="kb-tabs-section" id="kb-dates">
        <div className="kb-tabs">
          <button className={`kb-tab ${activeTab === "dates" ? "active" : ""}`} onClick={() => setActiveTab("dates")}>📅 Shahi Snan Schedule</button>
          <button className={`kb-tab ${activeTab === "ghats" ? "active" : ""}`} onClick={() => setActiveTab("ghats")}>🛕 Sacred Ghats</button>
        </div>

        {/* Dates */}
        {activeTab === "dates" && (
          <div className="kb-dates">
            {SNAN_DATES.map((d, i) => (
              <div key={i} className="kb-date-card" style={{ "--accent": d.color }}>
                <div className="kb-date-icon">{d.icon}</div>
                <div className="kb-date-info">
                  <span className="kb-date-index">Event {i + 1}</span>
                  <div className="kb-date-title">{d.title}</div>
                  <div className="kb-date-date">{d.date}</div>
                  <div className="kb-date-location">📍 {d.location}</div>
                  <div className="kb-date-sig">{d.significance}</div>
                </div>
                {i === 0 && <span className="kb-date-badge" style={{ background: d.color }}>Commencement</span>}
                {i === 1 && <span className="kb-date-badge" style={{ background: d.color }}>First Snan</span>}
                {i === 2 && <span className="kb-date-badge" style={{ background: d.color }}>Most Auspicious</span>}
              </div>
            ))}
            <div className="kb-dates-note">
              🔔 <strong>Book accommodation 6+ months in advance</strong> — hotels in Nashik fill up extremely fast around Shahi Snan dates.
            </div>
          </div>
        )}

        {/* Ghats */}
        {activeTab === "ghats" && (
          <div className="kb-ghats">
            {GHATS.map((g, i) => (
              <div key={i} className="kb-ghat-card">
                <span className="kb-ghat-icon">{g.icon}</span>
                <div className="kb-ghat-info">
                  <h3 className="kb-ghat-name">{g.name}</h3>
                  <p className="kb-ghat-desc">{g.desc}</p>
                </div>
              </div>
            ))}
            <div className="kb-ghats-note">
              💡 <strong>Tip:</strong> Ramkund and Kushavarta are in different cities — Nashik and Trimbakeshwar respectively (45 km apart). Plan transport in advance.
            </div>
          </div>
        )}
      </section>

      {/* ── PACKAGES ── */}
      <section className="kb-packages" id="kb-packages">
        <div className="kb-section-head">
          <span className="kb-section-badge">Plan Your Visit</span>
          <h2 className="kb-section-title">Choose Your Kumbh Package</h2>
          <p className="kb-section-sub">Select a package and YatraMitra will generate your personalized itinerary instantly</p>
        </div>
        <div className="kb-packages-grid">
          {PACKAGES.map((pkg, i) => (
            <div key={i} className="kb-pkg-card" style={{ "--pkg-color": pkg.color }}>
              {pkg.highlight && (
                <div className="kb-pkg-highlight" style={{ background: pkg.color }}>{pkg.highlight}</div>
              )}
              <div className="kb-pkg-icon">{pkg.icon}</div>
              <h3 className="kb-pkg-title">{pkg.title}</h3>
              <div className="kb-pkg-meta">
                <span>⏱ {pkg.duration}</span>
                <span>📍 {pkg.from}</span>
              </div>
              <p className="kb-pkg-desc">{pkg.desc}</p>
              <div className="kb-pkg-interests">
                {pkg.interests.map(i => (
                  <span key={i} className="kb-interest-tag">{i}</span>
                ))}
              </div>
              <button className="kb-pkg-btn" style={{ background: pkg.color }} onClick={() => handlePlanTrip(pkg)}>
                Generate Itinerary →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACCOMMODATION WARNING ── */}
      <section className="kb-booking">
        <div className="kb-booking-inner">
          <div className="kb-booking-text">
            <h2>🏨 Book Hotels Early for Kumbh 2027</h2>
            <p>Nashik hotels book out <strong>6-12 months in advance</strong> during Kumbh. Prices rise 3-5x near Shahi Snan dates. Book now to secure the best rates.</p>
            <div className="kb-booking-tips">
              <span>✅ Book by October 2026 for best rates</span>
              <span>✅ Consider Trimbakeshwar for quieter stay</span>
              <span>✅ Dharamshalas available near Ramkund</span>
            </div>
          </div>
          <div className="kb-booking-btns">
            <a href="https://www.booking.com/search.html?ss=Nashik%2C+Maharashtra%2C+India&checkin=2027-08-01&checkout=2027-08-04"
               target="_blank" rel="noopener noreferrer" className="kb-book-btn">
              🏨 Book Nashik Hotels
            </a>
            <a href="https://www.booking.com/search.html?ss=Trimbakeshwar%2C+Maharashtra%2C+India&checkin=2027-08-01&checkout=2027-08-04"
               target="_blank" rel="noopener noreferrer" className="kb-book-btn kb-book-btn--outline">
              🛕 Book Trimbakeshwar Hotels
            </a>
          </div>
        </div>
      </section>

      {/* ── TIPS ── */}
      <section className="kb-tips">
        <div className="kb-section-head">
          <span className="kb-section-badge">Travel Smart</span>
          <h2 className="kb-section-title">Essential Kumbh Tips</h2>
        </div>
        <div className="kb-tips-grid">
          {[
            { icon: "🌅", title: "Arrive Early", tip: "Reach ghats before 5 AM on Shahi Snan days. Crowds peak between 6-10 AM." },
            { icon: "👟", title: "Wear Simple Clothes", tip: "White or saffron cotton clothes. Remove footwear before entering ghats." },
            { icon: "💧", title: "Stay Hydrated", tip: "Carry water. Nashik August is hot and humid. Avoid dehydration in crowds." },
            { icon: "📵", title: "Phone Safety", tip: "Keep phone in a waterproof pouch. Pickpocketing is common in large crowds." },
            { icon: "🗺️", title: "Plan Routes", tip: "Nashik (Ramkund) and Trimbakeshwar (Kushavarta) are 45 km apart. Plan separate days." },
            { icon: "🚗", title: "Book Transport", tip: "Hire a private taxi in advance. Auto-rickshaws and cabs are scarce on Snan days." },
          ].map((t, i) => (
            <div key={i} className="kb-tip-card">
              <span className="kb-tip-icon">{t.icon}</span>
              <h4 className="kb-tip-title">{t.title}</h4>
              <p className="kb-tip-text">{t.tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="kb-cta">
        <div className="kb-cta-inner">
          <h2>Ready to Plan Your Kumbh Yatra?</h2>
          <p>Let YatraMitra create your personalized Nashik Kumbh itinerary in seconds</p>
          <button className="kb-btn-primary kb-btn-large" onClick={() => navigate("/", { state: { prefillCities: ["Nashik"], prefillInterests: ["religious"] } })}>
            🗺️ Start Planning Now
          </button>
        </div>
      </section>

    </div>
  );
}
