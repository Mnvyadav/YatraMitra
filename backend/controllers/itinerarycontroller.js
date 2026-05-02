const supabase = require("../supabaseClient");
const { calculateScore, getFatigue, getDistance } = require("../utils/scoring");

const PLACES_PER_DAY  = 3;
const MAX_DAY_FATIGUE = 5;    // max fatigue per day (1 trek + 1 nature + 1 temple = 6, blocked)
const TIGHT_RADIUS_KM = 25;   // strict: places must be within 25km of each other
const LOOSE_RADIUS_KM = 45;   // fallback radius if not enough places in tight radius

exports.generateItinerary = async (req, res) => {
  try {
    let { city, cities, days, interests } = req.body;

    // Support city / cities input
    let selectedCities = [];
    if (Array.isArray(cities) && cities.length > 0) selectedCities = cities.flat();
    else if (Array.isArray(city) && city.length > 0) selectedCities = city.flat();
    else if (typeof city === "string") selectedCities = [city];

    if (!selectedCities.length || !days) {
      return res.status(400).json({ error: "Invalid inputs" });
    }

    if (!Array.isArray(interests)) interests = [];

    // ── Fetch all places ──
    const { data: places, error } = await supabase.from("Places").select("*");
    if (error) return res.status(500).json({ error: "Database error" });

    console.log("CITIES:", selectedCities);
    console.log("INTERESTS:", interests);
    console.log("TOTAL PLACES:", places.length);

    // ── Filter by city + interest ──
    let filtered = places.filter(p => {
      const cityMatch = selectedCities.some(
        c => typeof c === "string" && p.city &&
             c.toLowerCase() === p.city.toLowerCase()
      );
      const interestMatch =
        interests.length === 0 ||
        interests.some(i => p.interest && i.toLowerCase() === p.interest.toLowerCase());
      return cityMatch && interestMatch;
    });

    console.log("FILTERED:", filtered.length);

    // ── Score + tag fatigue ──
    filtered = filtered
      .map(p => ({ ...p, score: calculateScore(p), fatigue: getFatigue(p) }))
      .sort((a, b) => b.score - a.score);

    // ── Build geo-clusters ──
    // Strategy:
    // 1. Pick best unvisited place as anchor
    // 2. Find all places within TIGHT_RADIUS_KM of anchor
    // 3. Within those, pick best ones that fit fatigue budget + activity diversity
    // 4. If not enough, expand to LOOSE_RADIUS_KM
    // 5. Repeat for each day

    const used     = new Set();
    const itinerary = [];

    for (let d = 1; d <= days; d++) {
      // Pick best unused anchor
      const anchor = filtered.find(p => !used.has(p.id));
      if (!anchor) {
        itinerary.push({ day: d, places: [] });
        continue;
      }

      used.add(anchor.id);
      const dayPlaces  = [anchor];
      let   dayFatigue = anchor.fatigue;

      // Helper: try to fill day with radius constraint
      const fillDay = (radiusKm) => {
        // Get candidates within radius, sorted by score
        const nearby = filtered.filter(p => {
          if (used.has(p.id)) return false;
          // Must be close to ALL current day places (not just anchor)
          // Use max distance from any current place
          const maxDist = Math.max(...dayPlaces.map(dp => getDistance(dp, p)));
          return maxDist <= radiusKm;
        });

        for (const candidate of nearby) {
          if (dayPlaces.length >= PLACES_PER_DAY) break;
          if (used.has(candidate.id)) continue;

          // Fatigue check
          if (dayFatigue + candidate.fatigue > MAX_DAY_FATIGUE) continue;

          // No same strenuous activity type twice (no 2 adventure in one day)
          const sameStrenuousExists = dayPlaces.some(
            p => p.fatigue >= 3 && p.interest === candidate.interest
          );
          if (sameStrenuousExists) continue;

          used.add(candidate.id);
          dayPlaces.push(candidate);
          dayFatigue += candidate.fatigue;
        }
      };

      // Try tight radius first
      fillDay(TIGHT_RADIUS_KM);

      // If still need more places, try loose radius
      if (dayPlaces.length < PLACES_PER_DAY) {
        fillDay(LOOSE_RADIUS_KM);
      }

      // Last resort: ignore distance but keep fatigue constraint
      if (dayPlaces.length < PLACES_PER_DAY) {
        for (const candidate of filtered) {
          if (dayPlaces.length >= PLACES_PER_DAY) break;
          if (used.has(candidate.id)) continue;
          if (dayFatigue + candidate.fatigue > MAX_DAY_FATIGUE) continue;
          used.add(candidate.id);
          dayPlaces.push(candidate);
          dayFatigue += candidate.fatigue;
        }
      }

      itinerary.push({ day: d, places: dayPlaces });

      console.log(
        `Day ${d}: [fatigue=${dayFatigue}]`,
        dayPlaces.map(p => `${p.name} (${p.city}, ${p.interest}, fatigue=${p.fatigue})`).join(" | ")
      );
    }

    res.json({ itinerary });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server crash" });
  }
};