import { useEffect,useState } from "react";
import { Link,useParams } from "react-router-dom";
import { get } from "../services/api";
import { Status } from "./MyAppointmentsPage";

export default function BookingConfirmationPage(){
  const {id}=useParams();
  const [booking,setBooking]=useState(null);
  const [error,setError]=useState("");
  useEffect(()=>{get(`/bookings/${id}`).then(d=>setBooking(d.booking)).catch(e=>setError(e.message));},[id]);
  if(error)return <div className="container"><div className="alert error">{error}</div><Link to="/appointments">Back to appointments</Link></div>;
  if(!booking)return <div className="container loading-line">Loading booking…</div>;
  return <div className="container narrow-container">
    <section className="confirmation panel">
      <div className="success-mark">✓</div><div className="eyebrow">Booking request received</div><h1>Your request is on its way.</h1><p>The provider will review your appointment. You can check its status from My appointments.</p>
      <div className="confirmation-number"><small>Booking reference</small><b>{booking.id}</b></div>
      <div className="summary-list">
        <div><span>Service</span><b>{booking.service_name}</b></div>
        <div><span>Provider</span><b>{booking.provider_name}</b></div>
        <div><span>Date & time</span><b>{new Date(booking.booking_start).toLocaleString()}</b></div>
        <div><span>Address</span><b>{booking.address}</b></div>
        <div><span>Total</span><b>EGP {Number(booking.total_price).toLocaleString("en-EG")}</b></div>
        <div><span>Status</span><Status status={booking.status}/></div>
      </div>
      <div className="hero-actions"><Link className="btn" to="/appointments">My appointments</Link><Link className="btn btn-outline" to="/home">Explore more services</Link></div>
    </section>
  </div>;
}