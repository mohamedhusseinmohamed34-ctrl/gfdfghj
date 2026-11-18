import { useState } from "react";
import { post } from "../services/api";

export default function AboutPage(){
  const [form,setForm]=useState({full_name:"",email:"",phone:"",message:""});
  const [message,setMessage]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  function change(e){setForm(p=>({...p,[e.target.name]:e.target.value}));}
  async function submit(e){e.preventDefault();setBusy(true);setMessage("");setError("");try{const d=await post("/contact",form);setMessage(d.message);setForm({full_name:"",email:"",phone:"",message:""});}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <div className="container"><section className="about-hero"><div className="eyebrow">About Khidma</div><h1>Local services,<br/>made easier.</h1><p>Khidma brings everyday services and local providers together, making it simpler for Cairo residents to discover, compare and request help.</p></section>
    <div className="two-column section-block"><article className="panel"><div className="eyebrow">How it works</div><h2>A simple way to get things done.</h2><div className="steps"><div><b>01</b><span><strong>Discover</strong><small>Browse service listings and provider details.</small></span></div><div><b>02</b><span><strong>Request</strong><small>Choose a time and send your booking details.</small></span></div><div><b>03</b><span><strong>Track</strong><small>Follow the request until it is completed.</small></span></div></div><p className="muted">Built around everyday needs in Cairo, from home care and maintenance to tutoring and more.</p></article>
      <form className="panel" onSubmit={submit}><div className="eyebrow">Get in touch</div><h2>Contact Khidma</h2><p className="muted">Send a question or feedback to our team.</p>
        <div className="field"><label>Your name</label><input name="full_name" value={form.full_name} onChange={change} required minLength="2" maxLength="150"/></div>
        <div className="field"><label>Email</label><input type="email" name="email" value={form.email} onChange={change} required maxLength="255"/></div>
        <div className="field"><label>Phone (optional)</label><input name="phone" value={form.phone} onChange={change} maxLength="30"/></div>
        <div className="field"><label>Message</label><textarea name="message" value={form.message} onChange={change} required minLength="5" maxLength="4000"/></div>
        {error&&<div className="alert error">{error}</div>}{message&&<div className="alert success">{message}</div>}
        <button className="btn" disabled={busy}>{busy?"Sending…":"Send message"}</button>
      </form>
    </div>
  </div>;
}