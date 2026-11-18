import { useEffect,useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../services/api";

export default function MyAppointmentsPage(){
  const [bookings,setBookings]=useState([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{get("/bookings/my").then(d=>setBookings(d.bookings)).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  return <div className="container"><div className="eyebrow">Your customer account</div><h1>My appointments</h1><p className="muted">Track your upcoming requests and previous services.</p><div className="page-actions"><Link to="/home" className="btn">＋ Book a service</Link></div>
    {loading&&<p className="loading-line">Loading appointments…</p>}{error&&<div className="alert error">{error}</div>}
    {!loading&&!error&&!bookings.length&&<div className="empty-state"><h3>No appointments yet</h3><p>Once you request a service, it will appear here.</p><Link to="/home" className="text-link">Explore services →</Link></div>}
    <div className="booking-list">{bookings.map(b=><article className="booking-card" key={b.id}>
      <div className="booking-avatar">K</div><div className="booking-content"><div className="service-meta"><span>{b.category_name}</span><Status status={b.status}/></div><h3>{b.service_name}</h3><p>Provider: {b.provider_name}</p><small>{new Date(b.booking_start).toLocaleString()} · {b.address}</small></div>
      <div className="booking-total"><b>EGP {Number(b.total_price).toLocaleString("en-EG")}</b><Link to={`/booking/${b.id}`} className="text-link">View details →</Link></div>
    </article>)}</div>
  </div>;
}
export function Status({status}){return <span className={`status-pill status-${status}`}>{status}</span>;}