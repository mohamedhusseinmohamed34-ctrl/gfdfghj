import { useEffect,useState } from "react";
import { get,patch,post } from "../services/api";

export default function AdminDashboardPage({ receptionist=false }){
  const [data,setData]=useState(null);
  const [categories,setCategories]=useState([]);
  const [categoryName,setCategoryName]=useState("");
  const [categoryDescription,setCategoryDescription]=useState("");
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState("");

  async function load(){
    try{
      const [dashboard,categoryData]=await Promise.all([get("/admin/dashboard"),get("/admin/categories")]);
      setData(dashboard);
      setCategories(categoryData.categories);
      setError("");
    }catch(e){setError(e.message);}
  }
  useEffect(()=>{load();},[]);
  const counts=Object.fromEntries((data?.stats?.bookings_by_status||[]).map(x=>[x.status,x.count]));

  async function updateStatus(id,status){
    setBusy(id);setError("");setMessage("");
    try{await patch(`/admin/bookings/${id}/status`,{status});await load();setMessage("Booking status updated.");}
    catch(e){setError(e.message);}
    finally{setBusy("");}
  }

  async function createCategory(e){
    e.preventDefault();setBusy("category");setError("");setMessage("");
    try{
      await post("/admin/categories",{name:categoryName,description:categoryDescription});
      setCategoryName("");setCategoryDescription("");
      await load();setMessage("Service category created. Providers can now use it.");
    }catch(e){setError(e.message);}
    finally{setBusy("");}
  }

  return <div className="container">
    <div className="eyebrow">{receptionist?"Front desk workspace":"Platform administration"}</div>
    <h1>{receptionist?"Receptionist dashboard":"Admin dashboard"}</h1>
    <p className="muted">{receptionist?"Review recent appointments and help customers with booking status.":"Monitor users, active providers, service listings and platform bookings."}</p>
    {error&&<div className="alert error">{error}</div>}{message&&<div className="alert success">{message}</div>}
    {!data&&!error&&<p className="loading-line">Loading dashboard…</p>}
    {data&&<>
      <div className="stats-grid">
        <Stat label="Registered users" value={data.stats.total_users}/>
        <Stat label="Active providers" value={data.stats.active_providers}/>
        <Stat label="Active services" value={data.stats.active_services}/>
        <Stat label="Pending requests" value={counts.pending||0}/>
      </div>
      <section className="section-block panel">
        <div className="section-heading"><div><div className="eyebrow">Latest activity</div><h2>Recent bookings</h2></div><button className="btn btn-outline small-btn" onClick={load}>Refresh</button></div>
        <div className="table-scroll"><table><thead><tr><th>Customer</th><th>Service</th><th>Provider</th><th>Appointment</th><th>Status</th><th>Price</th><th>Actions</th></tr></thead><tbody>
          {data.recent_bookings.map(b=><tr key={b.id}>
            <td>{b.customer_name}</td><td>{b.service_name}</td><td>{b.provider_name}</td>
            <td>{new Date(b.booking_start).toLocaleString()}</td>
            <td><span className={`status-pill status-${b.status}`}>{b.status}</span></td>
            <td>EGP {Number(b.total_price).toLocaleString("en-EG")}</td>
            <td><div className="table-actions">
              {b.status==="pending"&&<><button disabled={busy===b.id} onClick={()=>updateStatus(b.id,"approved")}>Approve</button><button disabled={busy===b.id} onClick={()=>updateStatus(b.id,"cancelled")}>Cancel</button></>}
              {b.status==="approved"&&<><button disabled={busy===b.id} onClick={()=>updateStatus(b.id,"completed")}>Complete</button><button disabled={busy===b.id} onClick={()=>updateStatus(b.id,"cancelled")}>Cancel</button></>}
              {["completed","cancelled"].includes(b.status)&&<span className="muted">—</span>}
            </div></td>
          </tr>)}
        </tbody></table>{!data.recent_bookings.length&&<p className="empty-inline">No bookings have been recorded yet.</p>}</div>
      </section>
      <section className="section-block"><div className="section-heading"><div><div className="eyebrow">Booking overview</div><h2>Status summary</h2></div></div><div className="status-summary">{["pending","approved","completed","cancelled"].map(s=><div className="status-summary-item" key={s}><span className={`status-pill status-${s}`}>{s}</span><b>{counts[s]||0}</b></div>)}</div></section>
      {!receptionist&&<section className="section-block two-column">
        <form className="panel" onSubmit={createCategory}>
          <div className="eyebrow">Service catalogue</div><h2>Add a category</h2>
          <p className="muted">Providers choose from these categories when creating their listings.</p>
          <div className="field"><label>Category name</label><input value={categoryName} onChange={e=>setCategoryName(e.target.value)} required minLength="2" maxLength="100" placeholder="e.g. Home cleaning"/></div>
          <div className="field"><label>Description (optional)</label><textarea value={categoryDescription} onChange={e=>setCategoryDescription(e.target.value)} maxLength="2000"/></div>
          <button className="btn" disabled={busy==="category"}>{busy==="category"?"Saving…":"Add category"}</button>
        </form>
        <div><div className="eyebrow">Available categories</div><h2>Service categories</h2><div className="simple-list">{categories.map(c=><div className="simple-list-row" key={c.id}><div><b>{c.name}</b><small>{c.description||"No description"}</small></div></div>)}{!categories.length&&<p className="empty-inline">No categories created yet.</p>}</div></div>
      </section>}
    </>}
  </div>;
}
function Stat({label,value}){return <div className="stat-card"><small>{label}</small><b>{Number(value||0).toLocaleString()}</b></div>}
