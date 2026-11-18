import { useEffect,useState } from "react";
import { Link,useParams } from "react-router-dom";
import { get } from "../services/api";

export default function ServiceDetailsPage() {
  const {id}=useParams();
  const [data,setData]=useState(null);
  const [error,setError]=useState("");
  useEffect(()=>{get(`/services/${id}`).then(setData).catch(e=>setError(e.message));},[id]);
  if(error) return <div className="container"><div className="alert error">{error}</div><Link to="/home" className="text-link">← Back to services</Link></div>;
  if(!data) return <div className="container loading-line">Loading service details…</div>;
  const s=data.service;
  const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return <div className="container detail-page">
    <Link to="/home" className="back-link">← Back to services</Link>
    <div className="detail-grid">
      <section className="detail-main">
        <img className="detail-image" src={s.image_url || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85"} alt={s.name}/>
        <div className="eyebrow">{s.category_name}</div><h1>{s.name}</h1>
        <p className="detail-description">{s.description || "More information will be added by this provider."}</p>
        <div className="price-line"><strong>EGP {Number(s.price).toLocaleString("en-EG")}</strong><span>{s.price_unit}</span><span>★ {Number(s.average_rating||0).toFixed(1)} · {s.review_count} reviews</span></div>
        <div className="detail-section"><h3>About the provider</h3><p>{s.provider_description || "Local service provider on Khidma."}</p><p><b>{s.business_name || s.provider_name}</b>{s.service_area ? ` · ${s.service_area}` : ""}</p></div>
      </section>
      <aside className="booking-aside panel"><div className="eyebrow">Book this service</div><h2>Choose a time that suits you.</h2><p>Send a request to the provider. Your appointment remains pending until it is reviewed.</p><h3>Provider availability</h3>
        {data.availability.length ? <ul className="availability-list">{data.availability.map((a,i)=><li key={i}><span>{days[a.day_of_week]}</span><b>{String(a.start_time).slice(0,5)} – {String(a.end_time).slice(0,5)}</b></li>)}</ul> : <p className="muted">Ask the provider about available times.</p>}
        <Link to={`/book/${s.id}`} className="btn full">Book appointment</Link>
      </aside>
    </div>
  </div>;
}