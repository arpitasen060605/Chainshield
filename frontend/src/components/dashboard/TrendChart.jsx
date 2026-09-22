import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function TrendChart({ recentIncidents = [] }) {
  const daysInMonth = Array.from({ length: 30 }, (_, i) => ({
    day: String(i + 1).padStart(2, "0"),
    value: 0,
  }));

  if (Array.isArray(recentIncidents) && recentIncidents.length > 0) {
    recentIncidents.forEach((incident) => {
      const incomingDate = incident.createdAt || incident.acquisitionDate;
      if (!incomingDate) return;

      const dateObj = new Date(incomingDate);
      const day = String(dateObj.getDate()).padStart(2, "0");
      const found = daysInMonth.find((entry) => entry.day === day);
      if (found) found.value += 1;
    });
  }

  const chartData = daysInMonth;

  return (
    <div className="panel trend-panel">
      <div className="panel-head">
        <h3>Recent incident trend</h3>
      </div>

      <div className="trend-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#8b9bb0", fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fill: "#8b9bb0", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, "auto"]} />
            <Tooltip
              contentStyle={{
                background: "#0d1828",
                border: "1px solid #263a50",
                borderRadius: 8,
                color: "#e2e8f0",
              }}
            />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}