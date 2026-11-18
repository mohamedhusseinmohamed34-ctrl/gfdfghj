import { useEffect,useState } from "react";
import { Link,useNavigate,useParams } from "react-router-dom";
import { get,post } from "../services/api";

export default function BookingPage() {
  const {serviceId}=useParams();
  const navigate=useNavigate();
  const [service,setService]=useState(null);
  const [form,setForm]=useState({booking_start:"",booking_end:"",address:"",notes:""});
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  useEffect(()=>{get(`/services/${serviceId}`).then(d=>setService(d.service)).catch(e=>setError(e.message));},[serviceId]);
  function change(e){setForm(old=>({...old,[e.target.name]:e.target.value}));}
  async function submit(e){
    e.preventDefault();setError("");setBusy(true);
    try {
      const booking=await post("/bookings",{
        service_id:serviceId,
        booking_start:new Date(form.booking_start).toISOString(),
        booking_end:new Date(form.booking_end).toISOString(),
        address:form.address,
        notes:form.notes
      });
      navigate(`/booking/${booking.booking.id}`);
    } catch(err){setError(err.message);}
    finally{setBusy(false);}
  }
  return <div className="container narrow-container">
    <Link to={`/services/${serviceId}`} className="back-link">← Back to service</Link>
    <div className="eyebrow">Appointment request</div><h1>Book your service</h1><p className="muted">Choose a date and time, then confirm your address in Cairo.</p>
    {error && <div className="alert error">{error}</div>}
    {service && <div className="selected-service"><img src={service.image_url || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=300&q=80"} alt=""/><div><b>{service.name}</b><small>{service.category_name} · {service.provider_name}</small><strong>EGP {Number(service.price).toLocaleString("en-EG")} <small>{service.price_unit}</small></strong></div></div>}
    <form className="panel form-panel" onSubmit={submit}>
      <div className="form-row"><div className="field"><label>Start date & time</label><input type="datetime-local" name="booking_start" value={form.booking_start} onChange={change} required/></div><div className="field"><label>End date & time</label><input type="datetime-local" name="booking_end" value={form.booking_end} onChange={change} required/></div></div>
      <div className="field"><label>Service address</label><textarea name="address" value={form.address} onChange={change} placeholder="Building, street, district, Cairo…" minLength="5" maxLength="1000" required/></div>
      <div className="field"><label>Additional notes <span className="muted">(optional)</span></label><textarea name="notes" value={form.notes} onChange={change} placeholder="Anything the provider should know?" maxLength="2000"/></div>
      <div className="notice">Your request will be marked <b>Pending</b>. The provider will review it. The price is taken from the service listing.</div>
      <button className="btn full" disabled={busy || !service}>{busy?"Sending request…":"Send booking request"}</button>
    </form>
  </div>;
}