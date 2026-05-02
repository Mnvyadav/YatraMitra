const FATIGUE = {
  adventure:  3,
  nature:     2,
  religious:  1,
  heritage:   1,
  culture:    1,
  history:    1,
  food:       1,
  shopping:   1,
  family:     1,
  village:    2,
  hidden:     2,
  nightlife:  1,
  beach:      1,
  wildlife:   2,
};

function calculateScore(place) {
  const rating     = place.rating     || 0;
  const popularity = place.popularity || 0;
  const crowd      = place.crowd_level || 5;
  return (rating * 2) + (popularity * 0.5) - (crowd * 0.3);
}

function getFatigue(place) {
  return FATIGUE[place.interest?.toLowerCase()] || 1;
}

// Haversine distance in km
function getDistance(p1, p2) {
  if (!p1.latitude || !p1.longitude || !p2.latitude || !p2.longitude) return 9999;
  const R    = 6371;
  const dLat = ((p2.latitude  - p1.latitude)  * Math.PI) / 180;
  const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.latitude  * Math.PI) / 180) *
    Math.cos((p2.latitude  * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { calculateScore, getFatigue, getDistance };