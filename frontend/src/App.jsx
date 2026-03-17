import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
import { fetchDOE, predictStrength } from './api/client'

// ── Tokens ───────────────────────────────────────────────────
const C = {
  accent: '#0071e3', green: '#30d158', red: '#ff453a',
  orange: '#ff9f0a', text: '#f5f5f7', text2: '#a1a1a6',
  bg2: '#111111', bg3: '#1a1a1a', border: '#2a2a2a',
}

// ── Tiny Components ───────────────────────────────────────────
function Tag({ children, color = C.accent }) {
  return (
    <span style={{
      fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500,
      color, background: color + '18', border: `1px solid ${color}30`,
      borderRadius: 4, padding: '2px 8px', letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>{children}</span>
  )
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: 16, padding: '28px 32px', ...style
    }}>{children}</div>
  )
}

function Metric({ label, value, sub, color = C.text, mono = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 12, color: C.text2, fontWeight: 400, letterSpacing: '0.03em' }}>{label}</div>
      <div style={{
        fontSize: 28, fontWeight: 600, color,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        letterSpacing: mono ? '-0.02em' : '-0.03em',
      }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.text2 }}>{sub}</div>}
    </div>
  )
}

function Loader() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, border: `2px solid ${C.border}`,
        borderTop: `2px solid ${C.accent}`, borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: C.text2, fontSize: 14, fontFamily: 'var(--font-mono)' }}>
        Loading DOE analysis…
      </p>
    </div>
  )
}

// ── Custom Tooltip ────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1a1a1a', border: `1px solid ${C.border}`,
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ color: C.text2, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.text, fontFamily: 'var(--font-mono)' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  )
}

// ── Section: Hero ─────────────────────────────────────────────
function Hero() {
  return (
    <div style={{
      padding: '80px 0 60px',
      borderBottom: `1px solid ${C.border}`,
      animation: 'fadeUp 0.7s ease forwards',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        
        <Tag color={C.text2}>Apple PQE Portfolio</Tag>
        <Tag color={C.green}>2³ Factorial Design</Tag>
      </div>
      <h1 style={{
        fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 600,
        letterSpacing: '-0.04em', lineHeight: 1.1,
        color: C.text, maxWidth: 700, marginBottom: 16,
      }}>
        DOE Study<br />
        <span style={{ color: C.text2, fontWeight: 300 }}>PCB Soldering Process</span>
      </h1>
      <p style={{
        fontSize: 17, color: C.text2, maxWidth: 560, lineHeight: 1.7,
        fontWeight: 300,
      }}>
        Identifying optimal soldering parameters using a full 2³ factorial design.
        Three factors, eight experiments, one optimal configuration.
      </p>
    </div>
  )
}

// ── Section: Design Matrix ────────────────────────────────────
function DesignMatrix({ matrix }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Design Matrix</h2>
        <Tag color={C.text2}>8 runs · full factorial</Tag>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Run', 'Temp (°C)', 'Pressure (MPa)', 'Time (s)', 'Joint Strength (MPa)'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '8px 16px 12px',
                  color: C.text2, fontWeight: 500, fontSize: 11,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => {
              const isOptimal = row.temperature === 260 && row.pressure === 1.5 && row.time === 7
              return (
                <tr key={i} style={{
                  borderBottom: `1px solid ${C.border}20`,
                  background: isOptimal ? `${C.green}08` : 'transparent',
                  transition: 'background 0.15s',
                }}>
                  <td style={{ padding: '10px 16px', color: C.text2 }}>{row.run}</td>
                  <td style={{ padding: '10px 16px', color: row.temp_coded === 1 ? C.orange : C.text }}>{row.temperature}</td>
                  <td style={{ padding: '10px 16px', color: row.pres_coded === 1 ? C.orange : C.text }}>{row.pressure}</td>
                  <td style={{ padding: '10px 16px', color: row.time_coded === 1 ? C.orange : C.text }}>{row.time}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      color: row.joint_strength >= 50 ? C.green : C.red,
                      fontWeight: 500,
                    }}>{row.joint_strength}</span>
                    {isOptimal && <Tag color={C.green} style={{ marginLeft: 8 }}>optimal</Tag>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 14, fontSize: 12, color: C.text2 }}>
        <span style={{ color: C.orange }}>●</span> High level &nbsp;
        <span style={{ color: C.green }}>●</span> Strength ≥ 50 MPa spec &nbsp;
        <span style={{ color: C.red }}>●</span> Below spec
      </div>
    </Card>
  )
}

// ── Section: Main Effects Charts ──────────────────────────────
function MainEffectsCharts({ chartData, grandMean, mainEffects }) {
  const configs = [
    { key: 'Temperature', color: C.orange,  unit: '°C'  },
    { key: 'Pressure',    color: C.accent,  unit: 'MPa' },
    { key: 'Time',        color: C.green,   unit: 's'   },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Main Effects Chart</h2>
        <p style={{ fontSize: 14, color: C.text2, marginTop: 4 }}>
          Slope steepness = factor influence. Flat line = negligible effect.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {configs.map(({ key, color, unit }) => {
          const data = chartData[key]
          const points = data.x.map((x, i) => ({ x, y: data.y[i], label: `${x}${unit}` }))
          const effect = mainEffects[key]
          return (
            <Card key={key} style={{ padding: '24px 24px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color }}>{key}</div>
                  <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>Effect: {effect > 0 ? '+' : ''}{effect} MPa</div>
                </div>
                <Tag color={color}>{unit}</Tag>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={points} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="label" tick={{ fill: C.text2, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[30, 70]} tick={{ fill: C.text2, fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={grandMean} stroke={C.text2} strokeDasharray="4 4" strokeOpacity={0.5} />
                  <Line
                    type="linear" dataKey="y" name="Strength (MPa)"
                    stroke={color} strokeWidth={2.5}
                    dot={{ fill: '#fff', stroke: color, strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── Section: Pareto ───────────────────────────────────────────
function ParetoChart({ allEffects }) {
  const sorted = Object.entries(allEffects)
    .map(([name, val]) => ({ name, value: Math.abs(val), raw: val }))
    .sort((a, b) => b.value - a.value)

  const max = sorted[0]?.value || 1

  return (
    <Card>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Pareto of Effects</h2>
        <p style={{ fontSize: 14, color: C.text2, marginTop: 4 }}>Ranked by absolute influence on joint strength</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={sorted} margin={{ top: 5, right: 20, bottom: 30, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: C.text2, fontSize: 11 }}
            axisLine={false} tickLine={false}
            angle={-15} textAnchor="end"
          />
          <YAxis
            tick={{ fill: C.text2, fontSize: 11 }}
            axisLine={false} tickLine={false}
            label={{ value: '|Effect| MPa', angle: -90, position: 'insideLeft', fill: C.text2, fontSize: 11, dx: -8 }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" name="|Effect| MPa" radius={[4, 4, 0, 0]}>
            {sorted.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.value === max ? C.orange :
                  entry.value > 5     ? C.accent :
                  C.border
                }
                fillOpacity={0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <span style={{ fontSize: 12, color: C.text2 }}><span style={{ color: C.orange }}>■</span> Dominant</span>
        <span style={{ fontSize: 12, color: C.text2 }}><span style={{ color: C.accent }}>■</span> Significant</span>
        <span style={{ fontSize: 12, color: C.text2 }}><span style={{ color: C.border }}>■</span> Minor</span>
      </div>
    </Card>
  )
}

// ── Section: Interactive Predictor ───────────────────────────
function Predictor() {
  const [temp, setTemp] = useState(240)
  const [pres, setPres] = useState(1.0)
  const [time, setTime] = useState(5)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const predict = useCallback(async () => {
    setLoading(true)
    try {
      const r = await predictStrength(temp, pres, time)
      setResult(r)
    } catch {
      setResult({ predicted_strength: null, error: true })
    } finally {
      setLoading(false)
    }
  }, [temp, pres, time])

  useEffect(() => { predict() }, [predict])

  const SliderInput = ({ label, value, min, max, step, unit, onChange, color }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: C.text2 }}>{label}</span>
        <span style={{ fontSize: 15, fontFamily: 'var(--font-mono)', fontWeight: 500, color }}>
          {value}{unit}
        </span>
      </div>
      <div style={{ position: 'relative', height: 4 }}>
        <div style={{ position: 'absolute', inset: 0, background: C.border, borderRadius: 2 }} />
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 2,
          background: color, width: `${(value - min) / (max - min) * 100}%`
        }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute', inset: 0, width: '100%', opacity: 0,
            cursor: 'pointer', height: 20, top: -8,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.text2 }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  )

  const strength = result?.predicted_strength
  const passes   = result?.passes_spec
  const margin   = result?.safety_margin

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Live Predictor</h2>
          <p style={{ fontSize: 14, color: C.text2, marginTop: 4 }}>Adjust factors — see strength update in real time</p>
        </div>
        <Tag color={C.green}>Interactive</Tag>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <SliderInput label="Soldering Temperature" value={temp} min={180} max={300} step={5} unit="°C" onChange={setTemp} color={C.orange} />
          <SliderInput label="Applied Pressure" value={pres} min={0.1} max={3.0} step={0.1} unit=" MPa" onChange={setPres} color={C.accent} />
          <SliderInput label="Soldering Time" value={time} min={1} max={15} step={0.5} unit="s" onChange={setTime} color={C.green} />
        </div>

        {/* Result */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', gap: 12,
          background: C.bg3, borderRadius: 12, padding: '32px 24px',
          border: `1px solid ${passes ? C.green : C.red}30`,
        }}>
          {loading ? (
            <div style={{ color: C.text2, fontSize: 13, animation: 'pulse 1s infinite' }}>Computing…</div>
          ) : strength !== null && strength !== undefined ? (
            <>
              <div style={{ fontSize: 11, color: C.text2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Predicted Strength</div>
              <div style={{
                fontSize: 52, fontWeight: 700, fontFamily: 'var(--font-mono)',
                color: passes ? C.green : C.red,
                letterSpacing: '-0.04em',
              }}>
                {strength.toFixed(1)}
                <span style={{ fontSize: 20, fontWeight: 400, color: C.text2 }}> MPa</span>
              </div>
              <div style={{
                fontSize: 13, color: passes ? C.green : C.red,
                fontFamily: 'var(--font-mono)',
              }}>
                {passes ? '✓ Passes spec' : '✗ Below spec'} &nbsp;|&nbsp; margin: {margin > 0 ? '+' : ''}{margin?.toFixed(1)} MPa
              </div>
              <div style={{
                marginTop: 8, fontSize: 12, color: C.text2, textAlign: 'center',
                padding: '8px 12px', background: C.border + '40', borderRadius: 8,
              }}>
                Spec limit: 50.0 MPa &nbsp;(IPC-7095)
              </div>
            </>
          ) : (
            <div style={{ color: C.red, fontSize: 13 }}>Backend offline — run locally</div>
          )}
        </div>
      </div>
    </Card>
  )
}

// ── Section: Optimal Settings ─────────────────────────────────
function OptimalSettings({ optimal, dominant }) {
  return (
    <Card style={{ borderColor: `${C.green}40` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Optimal Configuration</h2>
        <Tag color={C.green}>Recommended</Tag>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
        <Metric label="Temperature" value="260°C" sub="High level" color={C.orange} mono />
        <Metric label="Pressure" value="1.5 MPa" sub="High level" color={C.accent} mono />
        <Metric label="Time" value="7s" sub="High level" color={C.green} mono />
        <Metric
          label="Predicted Strength"
          value={`${optimal.predicted_strength} MPa`}
          sub={`+${optimal.safety_margin} MPa above spec`}
          color={C.green} mono
        />
      </div>
      <div style={{
        marginTop: 24, padding: '16px 20px',
        background: C.bg3, borderRadius: 10,
        borderLeft: `3px solid ${C.text2}`,
        fontSize: 13, color: C.text2, lineHeight: 1.8,
      }}>
        <strong style={{ color: C.text }}>Validation plan:</strong>{' '}
        30-sample Cpk study at optimal settings (target ≥ 1.67) ·
        SEM cross-section to verify IMC thickness 1–4 µm ·
        X-ray per IPC-7095 to confirm void% &lt; 5%
        <br />
        <strong style={{ color: C.text }}>Dominant factor:</strong>{' '}
        {dominant} — tightest tolerance control required on this parameter.
      </div>
    </Card>
  )
}

// ── Section: Cost of Quality ──────────────────────────────────
function CoQSection({ coq }) {
  const { baseline, optimized, monthly_savings, annual_savings, defect_reduction_pct } = coq

  const chartData = [
    { name: 'Internal\nFailure', baseline: baseline.internal_failure / 1000, optimized: optimized.internal_failure / 1000 },
    { name: 'Appraisal',         baseline: baseline.appraisal / 1000,        optimized: optimized.appraisal / 1000 },
    { name: 'Prevention',        baseline: baseline.prevention / 1000,       optimized: optimized.prevention / 1000 },
    { name: 'TOTAL',             baseline: baseline.total / 1000,            optimized: optimized.total / 1000 },
  ]

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Cost of Quality</h2>
        <Tag color={C.orange}>Finance Layer</Tag>
      </div>
      <p style={{ fontSize: 14, color: C.text2, marginBottom: 24 }}>
        Prevention + Appraisal + Failure costs. DOE isn't just technical — it's financial.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 28 }}>
        <Metric label="Monthly Savings" value={`$${(monthly_savings/1000).toFixed(1)}K`} color={C.green} mono />
        <Metric label="Annual Savings" value={`$${(annual_savings/1000).toFixed(0)}K`} color={C.green} mono />
        <Metric label="Defect Reduction" value={`${defect_reduction_pct}%`} sub="4.2% → 0.8%" color={C.orange} mono />
        <Metric label="Payback Period" value="< 1 mo" sub="DOE cost ~$15K" color={C.accent} mono />
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: C.text2, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: C.text2, fontSize: 11 }} axisLine={false} tickLine={false}
            label={{ value: 'Cost ($K/month)', angle: -90, position: 'insideLeft', fill: C.text2, fontSize: 11, dx: -6 }} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="baseline" name="Baseline ($K)" fill={C.red} fillOpacity={0.8} radius={[3, 3, 0, 0]} />
          <Bar dataKey="optimized" name="DOE Optimized ($K)" fill={C.accent} fillOpacity={0.8} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

// ── Section: Footer ───────────────────────────────────────────
function Footer() {
  return (
    <div style={{
      borderTop: `1px solid ${C.border}`, marginTop: 80,
      padding: '40px 0 60px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Project 2 — DOE Study</div>
        <div style={{ fontSize: 12, color: C.text2, marginTop: 2 }}>Apple PQE Internship Portfolio · Pohang, Korea</div>
      </div>
      
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────
export default function App() {
  const [data, setData]     = useState(null)
  const [error, setError]   = useState(false)

  useEffect(() => {
    fetchDOE()
      .then(setData)
      .catch(() => setError(true))
  }, [])

  const layout = {
    maxWidth: 1100, margin: '0 auto',
    padding: '0 clamp(20px, 5vw, 60px)',
  }

  if (!data && !error) return <Loader />

  // Fallback static data if backend is offline
  const doe = data || {
    design_matrix: [],
    main_effects: { Temperature: 16.0, Pressure: 9.0, Time: 6.0 },
    interaction_effects: { 'Temp × Pressure': 3.0, 'Temp × Time': 5.0, 'Pressure × Time': 1.2 },
    all_effects_sorted: { Temperature: 16.0, 'Temp × Time': 5.0, Pressure: 9.0, Time: 6.0, 'Temp × Pressure': 3.0, 'Pressure × Time': 1.2 },
    dominant_factor: 'Temperature',
    grand_mean: 45.0,
    main_effects_chart: {
      Temperature: { x: [220, 260], y: [37, 53] },
      Pressure:    { x: [0.5, 1.5], y: [40.5, 49.5] },
      Time:        { x: [3, 7],     y: [42, 48] },
    },
    optimal: { temperature: 260, pressure: 1.5, time: 7, predicted_strength: 64.5, lsl: 50, safety_margin: 14.5, passes_spec: true },
    coq: {
      baseline:  { defects: 2100, internal_failure: 63000, appraisal: 8000, prevention: 2000, total: 73000 },
      optimized: { defects: 400,  internal_failure: 9000,  appraisal: 9500, prevention: 5000, total: 23500 },
      monthly_savings: 49500, annual_savings: 594000, defect_reduction_pct: 81,
    }
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      <div style={layout}>
        <Hero />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingTop: 48 }}>
          {doe.design_matrix?.length > 0 && <DesignMatrix matrix={doe.design_matrix} />}
          <MainEffectsCharts
            chartData={doe.main_effects_chart}
            grandMean={doe.grand_mean}
            mainEffects={doe.main_effects}
          />
          <ParetoChart allEffects={doe.all_effects_sorted} />
          <OptimalSettings optimal={doe.optimal} dominant={doe.dominant_factor} />
          <Predictor />
          <CoQSection coq={doe.coq} />
        </div>
        <Footer />
      </div>
    </div>
  )
}
