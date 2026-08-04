import { useEffect, useState } from 'react';
import {
  fetchAcquisitionData,
  fetchConversionData,
  fetchDeviceIntentData,
  fetchPatientSplit
} from './analyticsQueries.js';
import { isSupabaseConfigured } from './supabaseConfig.js';
import './AdminCharts.css';

// Real data only — no sample/placeholder numbers. Each chart shows an honest
// empty state until enough real traffic has been logged.

function useChartData(fetcher) {
  const [state, setState] = useState({ data: null, loading: isSupabaseConfigured });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState({ data: null, loading: false });
      return undefined;
    }
    let cancelled = false;
    fetcher().then(real => {
      if (!cancelled) setState({ data: real, loading: false });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

function ChartCard({ title, subtitle, wide, status, children }) {
  return (
    <div className={`chart-card ${wide ? 'chart-card--wide' : ''}`}>
      <div className="chart-card-header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      {status ? <p className="chart-empty">{status}</p> : children}
    </div>
  );
}

function ConversionBarChart() {
  const { data, loading } = useChartData(fetchConversionData);
  const status = loading ? 'Loading…' : !data ? 'No traffic logged yet.' : null;
  const maxVisits = data ? Math.max(...data.map(d => d.visits), 1) : 1;

  return (
    <ChartCard title="Online Appointment Conversions" subtitle="Monthly website visits vs. completed bookings" wide status={status}>
      <div className="chart-bars">
        {data?.map(d => {
          const totalPct = (d.visits / maxVisits) * 100;
          const bookedPct = d.visits > 0 ? (d.bookings / d.visits) * 100 : 0;
          const conversionRate = d.visits > 0 ? Math.round((d.bookings / d.visits) * 100) : 0;
          return (
            <div className="chart-bar-col" key={d.month}>
              <span className="chart-bar-pct">{conversionRate}%</span>
              <div className="chart-bar-track">
                <div className="chart-bar-total" style={{ height: `${totalPct}%` }}>
                  <div className="chart-bar-booked" style={{ height: `${bookedPct}%` }} />
                </div>
              </div>
              <span className="chart-bar-label">{d.month}</span>
            </div>
          );
        })}
      </div>
      <div className="chart-legend">
        <span className="chart-legend-item">
          <i className="chart-swatch chart-swatch--total" /> Website visits
        </span>
        <span className="chart-legend-item">
          <i className="chart-swatch chart-swatch--booked" /> Completed bookings
        </span>
      </div>
    </ChartCard>
  );
}

function buildAreaPath(prevCum, currCum, width, height, maxTotal) {
  const stepX = width / (prevCum.length - 1);
  const scaleY = v => height - (v / maxTotal) * height;

  const top = currCum.map((v, i) => `${i * stepX},${scaleY(v)}`).join(' L');
  const bottom = prevCum
    .map((v, i) => `${i * stepX},${scaleY(v)}`)
    .reverse()
    .join(' L');

  return `M${top} L${bottom} Z`;
}

function AcquisitionAreaChart() {
  const { data, loading } = useChartData(fetchAcquisitionData);
  const status = loading ? 'Loading…' : !data ? 'No traffic logged yet.' : null;
  const width = 560;
  const height = 220;
  const keys = ['organic', 'maps', 'paid', 'direct'];
  const colors = {
    organic: '#4aa8ff',
    maps: '#34c9a3',
    paid: '#e0a339',
    direct: '#8f8fe0'
  };
  const labels = {
    organic: 'Organic Search',
    maps: 'Maps / Local',
    paid: 'Paid Ads',
    direct: 'Direct Traffic'
  };
  const getLabel = d => d.label ?? d.day;

  let cumulative = [];
  let maxTotal = 1;
  if (data) {
    cumulative = [new Array(data.length).fill(0)];
    keys.forEach((key, i) => {
      cumulative.push(cumulative[i].map((v, idx) => v + data[idx][key]));
    });
    maxTotal = Math.max(...cumulative[cumulative.length - 1], 1);
  }

  return (
    <ChartCard title="Growth of Patient Acquisition Channels" subtitle="Weekly sessions by traffic source" status={status}>
      <svg className="chart-area-svg" viewBox={`0 0 ${width} ${height + 24}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line
            key={f}
            className="chart-gridline"
            x1={0}
            x2={width}
            y1={height * (1 - f)}
            y2={height * (1 - f)}
          />
        ))}
        {data &&
          keys.map((key, i) => (
            <path
              key={key}
              d={buildAreaPath(cumulative[i], cumulative[i + 1], width, height, maxTotal)}
              fill={colors[key]}
              fillOpacity={0.55}
              stroke={colors[key]}
              strokeWidth={1.5}
            />
          ))}
        {data?.map((d, i) => (
          <text
            key={getLabel(d)}
            className="chart-axis-label"
            x={(width / (data.length - 1)) * i}
            y={height + 18}
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
          >
            {getLabel(d)}
          </text>
        ))}
      </svg>
      <div className="chart-legend">
        {keys.map(key => (
          <span className="chart-legend-item" key={key}>
            <i className="chart-swatch" style={{ background: colors[key] }} /> {labels[key]}
          </span>
        ))}
      </div>
    </ChartCard>
  );
}

function PatientDonutChart() {
  const { data, loading } = useChartData(fetchPatientSplit);
  const status = loading ? 'Loading…' : !data ? 'No traffic logged yet.' : null;
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const newLen = data ? (data.newPatients / 100) * circumference : 0;

  return (
    <ChartCard title="New vs. Returning Patient Engagement" subtitle="Share of monthly site visitors" status={status}>
      <div className="chart-donut-wrap">
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(13, 79, 124, 0.12)"
            strokeWidth={strokeWidth}
          />
          {data && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#4aa8ff"
              strokeWidth={strokeWidth}
              strokeDasharray={`${newLen} ${circumference - newLen}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
          {data && (
            <>
              <text x="50%" y="47%" textAnchor="middle" className="chart-donut-value">
                {data.newPatients}%
              </text>
              <text x="50%" y="63%" textAnchor="middle" className="chart-donut-caption">
                New patients
              </text>
            </>
          )}
        </svg>
        {data && (
          <div className="chart-legend chart-legend--column">
            <span className="chart-legend-item">
              <i className="chart-swatch" style={{ background: '#4aa8ff' }} /> New — {data.newPatients}%
            </span>
            <span className="chart-legend-item">
              <i className="chart-swatch" style={{ background: 'rgba(13, 79, 124, 0.25)' }} /> Returning —{' '}
              {data.returning}%
            </span>
          </div>
        )}
      </div>
    </ChartCard>
  );
}

function buildLinePoints(values, width, height, max) {
  const stepX = width / (values.length - 1);
  return values.map((v, i) => `${i * stepX},${height - (v / max) * height}`).join(' ');
}

function DeviceIntentLineChart() {
  const { data, loading } = useChartData(fetchDeviceIntentData);
  const status = loading ? 'Loading…' : !data ? 'No traffic logged yet.' : null;
  const width = 560;
  const height = 200;
  const maxMobile = data ? Math.max(...data.map(d => d.mobile), 1) : 1;
  const maxDesktop = data ? Math.max(...data.map(d => d.desktop), 1) : 1;

  return (
    <ChartCard title="Patient Scheduling Intent by Device" subtitle="Booking-page views: mobile vs. desktop" status={status}>
      <svg className="chart-area-svg" viewBox={`0 0 ${width} ${height + 24}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line
            key={f}
            className="chart-gridline"
            x1={0}
            x2={width}
            y1={height * (1 - f)}
            y2={height * (1 - f)}
          />
        ))}
        {data && (
          <polyline
            points={buildLinePoints(
              data.map(d => d.mobile),
              width,
              height,
              maxMobile
            )}
            fill="none"
            stroke="#4aa8ff"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {data && (
          <polyline
            points={buildLinePoints(
              data.map(d => d.desktop),
              width,
              height,
              maxDesktop
            )}
            fill="none"
            stroke="#e0a339"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 4"
          />
        )}
        {data?.map((d, i) => (
          <text
            key={d.day}
            className="chart-axis-label"
            x={(width / (data.length - 1)) * i}
            y={height + 18}
            textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
          >
            {d.day}
          </text>
        ))}
      </svg>
      <div className="chart-legend">
        <span className="chart-legend-item">
          <i className="chart-swatch" style={{ background: '#4aa8ff' }} /> Mobile (left axis)
        </span>
        <span className="chart-legend-item">
          <i className="chart-swatch" style={{ background: '#e0a339' }} /> Desktop (right axis)
        </span>
      </div>
    </ChartCard>
  );
}

function AdminCharts() {
  return (
    <div className="chart-grid">
      <ConversionBarChart />
      <AcquisitionAreaChart />
      <PatientDonutChart />
      <DeviceIntentLineChart />
    </div>
  );
}

export default AdminCharts;
