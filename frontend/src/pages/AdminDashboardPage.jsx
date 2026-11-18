import { useEffect,useState } from "react";
import { get } from "../services/api";

export default function AdminDashboardPage({ receptionist=false }){
  const [data,setData]=useState(null);
  const [error,setError]=useState("");
  useEffect(()=>{get("/admin/dashboard").then(setData).catch(e=>setError(e.message));},[]);
  const counts=Object.fromEntries((data?.stats?.bookings_by_status||[]).map(x=>[x.status,x.count]));
  return <div className="container"><div className="eyebrow">{receptionist?"Front desk workspace":"Platform administration"}</div><h1>{receptionist?"Receptionist dashboard":"Admin dashboard"}</h1><p className="muted">{receptionist?"Review recent appointments and help customers with booking status.":"Monitor users, active providers, service listings and platform bookings."}</p>
    {error&&<div className="alert error">{error}</div>}
    {!data&& !error&&<p className="loading-line">Loading dashboard…</p>}
    {data&&<>
      <div className="stats-grid">
        <Stat label="Registered users" value={data.stats.total_users}/>
        <Stat label="Active providers" value={data.stats.active_providers}/>
        <Stat label="Active services" value={data.stats.active_services}/>
        <Stat label="Pending requests" value={counts.pending||0}/>
      </div>
      <section className="section-block panel"><div className="section-heading"><div><div className="eyebrow">Latest activity</div><h2>Recent bookings</h2></div></div>
        <div className="table-scroll"><table><thead><tr><th>Customer</th><th>Service</th><th>Provider</th><th>Appointment</th><th>Status</th><th>Price</th></tr></thead><tbody>
          {data.recent_bookings.map(b=><tr key={b.id}><td>{b.customer_name}</td><td>{b.service_name}</td><td>{b.provider_name}</td><td>{new Date(b.booking_start).toLocaleString()}</td><td><span className={`status-pill status-${b.status}`}>{b.status}</span></td><td>EGP {Number(b.total_price).toLocaleString("en-EG")}</td></tr>)}
        </tbody></table>{!data.recent_bookings.length&&<p className="empty-inline">No bookings have been recorded yet.</p>}</div>
      </section>
      <section className="section-block"><div className="section-heading"><div><div className="eyebrow">Booking overview</div><h2>Status summary</h2></div></div><div className="status-summary">{["pending","approved","completed","cancelled"].map(s=><div className="status-summary-item" key={s}><span className={`status-pill status-${s}`}>{s}</span><b>{counts[s]||0}</b></div>)}</div></section>
    </>}
  </div>;
}
function Stat({label,value}){return <div className="stat-card"><small>{label}</small><b>{Number(value||0).toLocaleString()}</b></div>}