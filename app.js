// MyOS Weather — current conditions + forecast via Open-Meteo (no API key).
const KEY = 'myos.weather.city';
const form = document.getElementById('wx-form');
const cityIn = document.getElementById('wx-city');
const out = document.getElementById('wx-result');

function wmo(code) {
  if (code === 0) return ['☀️', 'Clear'];
  if (code <= 3) return ['⛅', 'Partly cloudy'];
  if (code <= 48) return ['🌫️', 'Fog'];
  if (code <= 67) return ['🌧️', 'Rain'];
  if (code <= 77) return ['🌨️', 'Snow'];
  if (code <= 82) return ['🌦️', 'Showers'];
  if (code <= 86) return ['🌨️', 'Snow showers'];
  return ['⛈️', 'Thunderstorm'];
}
const cToF = (c) => Math.round(c * 9 / 5 + 32);
const esc = (s) => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

async function load(city) {
  out.innerHTML = '<div class="wx-msg">Loading…</div>';
  try {
    const g = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&name=' + encodeURIComponent(city)).then((r) => r.json());
    if (!g.results || !g.results.length) { out.innerHTML = '<div class="wx-msg">City not found.</div>'; return; }
    const p = g.results[0];
    const u = 'https://api.open-meteo.com/v1/forecast?latitude=' + p.latitude + '&longitude=' + p.longitude +
      '&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4';
    const w = await fetch(u).then((r) => r.json());
    const [emoji, cond] = wmo(w.current.weather_code);
    const t = Math.round(w.current.temperature_2m);
    let days = '';
    for (let i = 1; i < w.daily.time.length; i++) {
      const [de] = wmo(w.daily.weather_code[i]);
      const dn = new Date(w.daily.time[i]).toLocaleDateString([], { weekday: 'short' });
      days += '<div class="wx-day"><div class="d">' + esc(dn) + '</div><div class="e">' + de + '</div><div>' +
        Math.round(w.daily.temperature_2m_max[i]) + '° / ' + Math.round(w.daily.temperature_2m_min[i]) + '°</div></div>';
    }
    out.innerHTML =
      '<div class="wx-cur"><div class="wx-place">' + esc(p.name + (p.country ? ', ' + p.country : '')) + '</div>' +
      '<div class="wx-temp">' + emoji + ' ' + t + '°C</div>' +
      '<div class="wx-cond">' + cond + ' · ' + cToF(w.current.temperature_2m) + '°F</div></div>' +
      '<div class="wx-days">' + days + '</div>';
    try { localStorage.setItem(KEY, city); } catch (e) {}
  } catch (e) {
    out.innerHTML = '<div class="wx-msg">Could not load weather. Check your connection.</div>';
  }
}

if (form) {
  form.addEventListener('submit', (e) => { e.preventDefault(); const c = cityIn.value.trim(); if (c) load(c); });
  let saved = '';
  try { saved = localStorage.getItem(KEY) || ''; } catch (e) {}
  if (saved) { cityIn.value = saved; load(saved); }
  else out.innerHTML = '<div class="wx-msg">Enter a city to see the weather.</div>';
}
