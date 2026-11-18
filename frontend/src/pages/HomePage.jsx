import { useEffect,useMemo,useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../services/api";

export default function HomePage() {
  const [services,setServices]=useState([]);
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("all");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{get("/services").then(d=>setServices(d.services)).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  const categories=useMemo(()=>["all",...new Set(services.map(s=>s.category_name).filter(Boolean))],[services]);
  const filtered=services.filter(s=>(category==="all"||s.category_name===category) && (s.name+" "+(s.description||"")+" "+(s.provider_name||"")).toLowerCase().includes(query.toLowerCase()));

  return <div className="container">
    <section className="hero">
      <div><div className="eyebrow">Services around Cairo</div><h1>Find the right help<br/>for your home and life.</h1><p>Browse useful local services, compare providers and request a time that works for you.</p><div className="hero-actions"><a href="#listings" className="btn">Explore services</a><Link to="/appointments" className="btn btn-outline">My appointments</Link></div><div className="hero-trust"><span>✓ Local providers</span><span>✓ Easy requests</span><span>✓ Clear status updates</span></div></div>
      <div className="hero-visual"><div className="photo-caption"><b>Good help, close to home.</b><span>Made for everyday life in Cairo</span></div></div>
    </section>
    <section className="section-block" id="listings">
      <div className="section-heading"><div><div className="eyebrow">Browse by need</div><h2>Popular services</h2><p>Find a service and check the details before booking.</p></div><span className="result-count">{services.length} listings</span></div>
      <div className="filters"><input aria-label="Search services" placeholder="Search cleaning, maintenance, tutoring…" value={query} onChange={e=>setQuery(e.target.value)} /><select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Filter by category">{categories.map(c=><option key={c} value={c}>{c==="all"?"All categories":c}</option>)}</select></div>
      {loading && <div className="loading-line">Loading services…</div>}
      {error && <div className="alert error">{error}</div>}
      {!loading && !error && !filtered.length && <div className="empty-state"><h3>No services found</h3><p>Try another search or category.</p></div>}
      <div className="service-grid">{filtered.map(service=><article className="service-card" key={service.id}>
        <Link to={`/services/${service.id}`} className="service-image-link"><img src={service.image_url || fallbackImage(service.category_name)} alt={service.name} loading="lazy"/></Link>
        <div className="service-card-body"><div className="service-meta"><span>{service.category_name}</span><span>★ {Number(service.average_rating||0).toFixed(1)}</span></div><h3><Link to={`/services/${service.id}`}>{service.name}</Link></h3><p>{service.description || "A local service listed on Khidma."}</p><div className="service-bottom"><div><b>EGP {Number(service.price).toLocaleString("en-EG")}</b><small>{service.price_unit}</small></div><Link className="text-link" to={`/services/${service.id}`}>View details →</Link></div><small className="provider-byline">By {service.provider_name}{service.service_area ? ` · ${service.service_area}` : ""}</small></div>
      </article>)}</div>
    </section>
  </div>;
}
function fallbackImage(category="") {
  const value=category.toLowerCase();
  if(value.includes("clean")) return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1000&q=85";
  if(value.includes("maint")||value.includes("repair")||value.includes("ac")) return "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1000&q=85";
  if(value.includes("tutor")||value.includes("educ")) return "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=85";
  return "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85";
}