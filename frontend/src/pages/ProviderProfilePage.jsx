import { useEffect,useState } from "react";
import { get,put,post,patch,del } from "../services/api";

const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export default function ProviderProfilePage(){
  const [profile,setProfile]=useState({business_name:"",description:"",service_area:"",profile_image_url:""});
  const [categories,setCategories]=useState([]);
  const [services,setServices]=useState([]);
  const [availability,setAvailability]=useState([]);
  const [slot,setSlot]=useState({day_of_week:"0",start_time:"09:00",end_time:"17:00"});
  const [newService,setNewService]=useState({category_id:"",name:"",description:"",price:"",price_unit:"per service",image_url:""});
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  async function load(){
    try{
      const [p,c,s,a]=await Promise.all([
        get("/provider/profile"),get("/categories"),get("/provider/services"),get("/provider/availability")
      ]);
      setProfile({
        business_name:p.profile.business_name||"",
        description:p.profile.description||"",
        service_area:p.profile.service_area||"",
        profile_image_url:p.profile.profile_image_url||""
      });
      setCategories(c.categories);
      setServices(s.services);
      setAvailability(a.availability);
      if(c.categories.length)setNewService(old=>({...old,category_id:old.category_id||c.categories[0].id}));
    }catch(e){setError(e.message);}
  }
  useEffect(()=>{load();},[]);
  function field(e){setProfile(p=>({...p,[e.target.name]:e.target.value}));}
  async function saveProfile(e){
    e.preventDefault();setBusy(true);setError("");setMessage("");
    try{await put("/provider/profile",profile);setMessage("Your profile was updated.");}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  function serviceField(e){setNewService(s=>({...s,[e.target.name]:e.target.value}));}
  async function addService(e){
    e.preventDefault();setBusy(true);setError("");setMessage("");
    try{
      await post("/provider/services",{...newService,price:Number(newService.price),image_url:newService.image_url||null});
      setNewService(s=>({...s,name:"",description:"",price:"",image_url:""}));
      const updated=await get("/provider/services");setServices(updated.services);setMessage("Service listing added.");
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }
  async function addSlot(e){
    e.preventDefault();setBusy(true);setError("");setMessage("");
    try{
      await post("/provider/availability",{...slot,day_of_week:Number(slot.day_of_week)});
      const updated=await get("/provider/availability");setAvailability(updated.availability);
      setMessage("Availability hours added.");
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }
  async function toggleSlot(item){
    setBusy(true);setError("");setMessage("");
    try{
      await patch(`/provider/availability/${item.id}`,{is_available:!item.is_available});
      const updated=await get("/provider/availability");setAvailability(updated.availability);
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }
  async function removeSlot(id){
    setBusy(true);setError("");setMessage("");
    try{
      await del(`/provider/availability/${id}`);
      const updated=await get("/provider/availability");setAvailability(updated.availability);
      setMessage("Availability hours removed.");
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }

  return <div className="container">
    <div className="eyebrow">Provider workspace</div><h1>Your profile & services</h1>
    <p className="muted">Keep your public information accurate, set working hours and maintain your listings.</p>
    {error&&<div className="alert error">{error}</div>}{message&&<div className="alert success">{message}</div>}

    <div className="two-column section-block">
      <form className="panel" onSubmit={saveProfile}><h2>Business profile</h2>
        <div className="field"><label>Business / display name</label><input name="business_name" value={profile.business_name} onChange={field} maxLength="150"/></div>
        <div className="field"><label>About your service</label><textarea name="description" value={profile.description} onChange={field} maxLength="3000"/></div>
        <div className="field"><label>Service area</label><input name="service_area" value={profile.service_area} onChange={field} placeholder="e.g. Nasr City, Heliopolis" maxLength="150"/></div>
        <div className="field"><label>Profile photo URL</label><input type="url" name="profile_image_url" value={profile.profile_image_url} onChange={field} placeholder="https://…"/></div>
        <button className="btn" disabled={busy}>Save profile</button>
      </form>

      <form className="panel" onSubmit={addService}><h2>Add a service</h2>
        <div className="field"><label>Category</label><select name="category_id" value={newService.category_id} onChange={serviceField} required>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></div>
        <div className="field"><label>Service name</label><input name="name" value={newService.name} onChange={serviceField} required minLength="2" maxLength="150"/></div>
        <div className="field"><label>Description</label><textarea name="description" value={newService.description} onChange={serviceField} maxLength="3000"/></div>
        <div className="form-row"><div className="field"><label>Price (EGP)</label><input type="number" min="0" step="0.01" name="price" value={newService.price} onChange={serviceField} required/></div><div className="field"><label>Price unit</label><select name="price_unit" value={newService.price_unit} onChange={serviceField}><option>per service</option><option>per hour</option><option>per visit</option></select></div></div>
        <div className="field"><label>Photo URL (optional)</label><input type="url" name="image_url" value={newService.image_url} onChange={serviceField}/></div>
        <button className="btn" disabled={busy||!categories.length}>Add service</button>
        {!categories.length&&<small>Add service categories in your database before creating listings.</small>}
      </form>
    </div>

    <section className="section-block">
      <div className="section-heading"><div><div className="eyebrow">Working hours</div><h2>Provider availability</h2><p>Customers can request appointments only within these hours.</p></div></div>
      <div className="two-column">
        <form className="panel" onSubmit={addSlot}>
          <h3>Add availability hours</h3>
          <div className="field"><label>Day of week</label><select value={slot.day_of_week} onChange={e=>setSlot(s=>({...s,day_of_week:e.target.value}))}>{DAYS.map((day,i)=><option value={i} key={day}>{day}</option>)}</select></div>
          <div className="form-row"><div className="field"><label>Start time</label><input type="time" value={slot.start_time} onChange={e=>setSlot(s=>({...s,start_time:e.target.value}))} required/></div><div className="field"><label>End time</label><input type="time" value={slot.end_time} onChange={e=>setSlot(s=>({...s,end_time:e.target.value}))} required/></div></div>
          <button className="btn" disabled={busy}>Add working hours</button>
        </form>
        <div className="simple-list availability-manager">
          {!availability.length&&<div className="empty-inline">No working hours configured yet. Add your available hours to receive bookings.</div>}
          {availability.map(a=><div className="simple-list-row" key={a.id}>
            <div><b>{DAYS[a.day_of_week]}</b><small>{String(a.start_time).slice(0,5)} – {String(a.end_time).slice(0,5)}</small></div>
            <div className="row-actions"><button className="text-button" disabled={busy} onClick={()=>toggleSlot(a)}>{a.is_available?"Pause":"Activate"}</button><button className="text-button danger-text" disabled={busy} onClick={()=>removeSlot(a.id)}>Remove</button></div>
          </div>)}
        </div>
      </div>
    </section>

    <section className="section-block"><div className="section-heading"><div><div className="eyebrow">Your listings</div><h2>Published services</h2></div><span className="result-count">{services.length} services</span></div>
      <div className="simple-list">{services.map(s=><div key={s.id} className="simple-list-row"><div><b>{s.name}</b><small>{s.category_name} · EGP {Number(s.price).toLocaleString("en-EG")} / {s.price_unit}</small></div><span className={s.is_active?"status-pill status-approved":"status-pill status-cancelled"}>{s.is_active?"Active":"Inactive"}</span></div>)}</div>
    </section>
  </div>;
}