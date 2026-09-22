import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export default function SeverityChart({ severityBreakdown, statsData }) {
  const critical = severityBreakdown?.critical ?? statsData?.criticalIncidents ?? 0;
  const high = severityBreakdown?.high ?? statsData?.highIncidents ?? 0;
  const medium = severityBreakdown?.medium ?? statsData?.mediumIncidents ?? 0;
  const low = severityBreakdown?.low ?? statsData?.lowIncidents ?? 0;

  const total = critical + high + medium + low;

  const data = [
    { name: "Critical", value: critical, color: "#ef4444" },
    { name: "High", value: high, color: "#f97316" },
    { name: "Medium", value: medium, color: "#facc15" },
    { name: "Low", value: low, color: "#22c55e" },
  ];

  const chartData = total > 0 ? data : [{ name: "No incidents", value: 1, color: "#1f2937" }];

  return (
    <div className="panel severity-panel">
      <div className="panel-head">
        <h3>Incident overview</h3>
      </div>

      <div className="severity-body">
        <div className="donut">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="donut-center">
            <strong>{total}</strong>
            <span>Total</span>
          </div>
        </div>

        <div className="legend">
          {data.map((item) => (
            <div className="legend-row" key={item.name}>
              <span className="legend-label">
                <i style={{ background: item.color }} />
                {item.name}
              </span>
              <strong>
                {item.value} {total > 0 ? `(${Math.round((item.value / total) * 100)}%)` : "(0%)"}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}