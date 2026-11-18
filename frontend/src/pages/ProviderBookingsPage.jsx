import { useEffect,useState } from "react";
import { get,patch } from "../services/api";
import { Status } from "./MyAppointmentsPage";

export default function ProviderBookingsPage(){
  const [items,setItems]=useState([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState("");
  async function load(){try{const d=await get("/provider/bookings");setItems(d.bookings);}catch(e){setError(e.message);}finally{setLoading(false);}}
  useEffect(()=>{load();},[]);
  async function update(id,status){
    setBusy(id);setError("");
    try{await patch(`/provider/bookings/${id}/status`,{status});await load();}
    catch(e){setError(e.message);}finally{setBusy("");}
  }
  return <div className="container"><div className="eyebrow">Provider workspace</div><h1>Booking requests</h1><p className="muted">Review requests for your listed services and update their status.</p>
    {error&&<div className="alert error">{error}</div>}{loading&&<p className="loading-line">Loading requests…</p>}
    {!loading&&!items.length&&<div className="empty-state"><h3>No booking requests</h3><p>New customer requests will appear here.</p></div>}
    <div className="booking-list">{items.map(b=><article className="booking-card provider-booking" key={b.id}>
      <div className="booking-content"><div className="service-meta"><span>{b.service_name}</span><Status status={b.status}/></div><h3>{b.customer_name}</h3><p>{b.customer_phone || "No phone provided"} · {b.address}</p><small>{new Date(b.booking_start).toLocaleString()} – {new Date(b.booking_end).toLocaleTimeString()}</small>{b.notes&&<p className="notes-line">Note: {b.notes}</p>}</div>
      <div className="booking-total"><b>EGP {Number(b.total_price).toLocaleString("en-EG")}</b><div className="button-stack">
        {b.status==="pending"&&<><button className="btn small-btn" disabled={busy===b.id} onClick={()=>update(b.id,"approved")}>Approve</button><button className="btn btn-danger small-btn" disabled={busy===b.id} onClick={()=>update(b.id,"cancelled")}>Decline</button></>}
        {b.status==="approved"&&<><button className="btn small-btn" disabled={busy===b.id} onClick={()=>update(b.id,"completed")}>Mark completed</button><button className="btn btn-danger small-btn" disabled={busy===b.id} onClick={()=>update(b.id,"cancelled")}>Cancel</button></>}
      </div></div>
    </article>)}</div>
  </div>;
}