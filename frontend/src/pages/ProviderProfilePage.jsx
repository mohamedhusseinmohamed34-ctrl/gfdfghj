import { useEffect,useState } from "react";
import { get,put,post } from "../services/api";

export default function ProviderProfilePage(){
  const [profile,setProfile]=useState({business_name:"",description:"",service_area:"",profile_image_url:""});
  const [categories,setCategories]=useState([]);
  const [services,setServices]=useState([]);
  const [newService,setNewService]=useState({category_id:"",name:"",description:"",price:"",price_unit:"per service",image_url:""});
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  async function load(){
    try{
      const [p,c,s]=await Promise.all([get("/provider/profile"),get("/categories"),get("/provider/services")]);
      setProfile({business_name:p.profile.business_name||"",description:p.profile.description||"",service_area:p.profile.service_area||"",profile_image_url:p.profile.profile_image_url||""});
      setCategories(c.categories);setServices(s.services);
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
  return <div className="container"><div className="eyebrow">Provider workspace</div><h1>Your profile & services</h1><p className="muted">Keep your public information accurate and maintain your service listings.</p>
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
    <section className="section-block"><div className="section-heading"><div><div className="eyebrow">Your listings</div><h2>Published services</h2></div><span className="result-count">{services.length} services</span></div>
      <div className="simple-list">{services.map(s=><div key={s.id} className="simple-list-row"><div><b>{s.name}</b><small>{s.category_name} · EGP {Number(s.price).toLocaleString("en-EG")} / {s.price_unit}</small></div><span className={s.is_active?"status-pill status-approved":"status-pill status-cancelled"}>{s.is_active?"Active":"Inactive"}</span></div>)}</div>
    </section>
  </div>;
}