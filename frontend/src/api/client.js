// src/api/client.js
// Point to your Render backend URL after deployment
// During local dev: http://localhost:8000

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function fetchDOE() {
  const res = await fetch(`${BASE_URL}/doe`)
  if (!res.ok) throw new Error('DOE fetch failed')
  return res.json()
}

export async function predictStrength(temperature, pressure, time) {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ temperature, pressure, time }),
  })
  if (!res.ok) throw new Error('Prediction failed')
  return res.json()
}
