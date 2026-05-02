const express = require("express");
const router = express.Router();
const { generateItinerary } = require("../controllers/itinerarycontroller");

// ── Generate itinerary ──
router.post("/generate", generateItinerary);

// ── AI Place Info using Gemini + Unsplash image ──
router.post("/place-info", async (req, res) => {
  const { name, city } = req.body;

  if (!name || !city) {
    return res.status(400).json({ error: "name and city are required" });
  }

  try {
    const geminiKey   = process.env.GEMINI_API_KEY;
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

    // ── Fetch AI info + place image + city fallback image in parallel ──
    const [geminiRes, placeImageRes, cityImageRes] = await Promise.all([

      // Gemini AI info
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Give me a helpful travel guide for "${name}" located in ${city}, Maharashtra, India.

Include these sections with emoji headings:
🏛️ About — 2-3 sentences about what this place is
⏰ Best Time to Visit — when to go
🎯 Must See / Do — 2-3 bullet points
💡 Travel Tips — 2 practical tips for visitors
📍 How to Reach — brief directions

Keep it concise, friendly, and useful for a tourist.`
              }]
            }]
          })
        }
      ),

      // Try specific place image first
      fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(name + " India")}&per_page=1&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } }
      ),

      // Fallback: city-level image
      fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(city + " Maharashtra India")}&per_page=1&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` } }
      ),
    ]);

    // ── Parse Gemini ──
    const rawText = await geminiRes.text();
    let info = "No information available.";
    try {
      const data = JSON.parse(rawText);
      if (data.error) {
        info = data.error.code === 429
          ? "AI is busy right now. Please try again in a moment."
          : "AI service error. Please try again.";
      } else {
        info = data.candidates?.[0]?.content?.parts?.[0]?.text || info;
      }
    } catch {
      console.error("Gemini parse error");
    }

    // ── Parse Unsplash — use place image if found, else city fallback ──
    let imageUrl    = null;
    let imageCredit = null;

    try {
      const placeData = await placeImageRes.json();
      const placePhoto = placeData.results?.[0];

      if (placePhoto) {
        // Specific place image found
        imageUrl    = placePhoto.urls?.regular || null;
        imageCredit = placePhoto.user?.name    || null;
        console.log(`✅ Specific image found for: ${name}`);
      } else {
        // Fall back to city image
        const cityData  = await cityImageRes.json();
        const cityPhoto = cityData.results?.[0];
        if (cityPhoto) {
          imageUrl    = cityPhoto.urls?.regular || null;
          imageCredit = cityPhoto.user?.name    || null;
          console.log(`📍 Using city fallback image for: ${city}`);
        }
      }
    } catch {
      console.error("Unsplash parse error");
    }

    res.json({ info, imageUrl, imageCredit });

  } catch (err) {
    console.error("Place info error:", err.message);
    res.status(500).json({ error: "Failed to fetch place info" });
  }
});

// ✅ Always at the bottom
module.exports = router;