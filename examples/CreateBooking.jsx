import { useState } from "react";
import { createBooking } from "./frontend-api";

export default function CreateBooking() {
  const [form, setForm] = useState({
    service_id: "",
    booking_start: "",
    booking_end: "",
    address: "",
    notes: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        booking_start: new Date(form.booking_start).toISOString(),
        booking_end: new Date(form.booking_end).toISOString()
      };
      const result = await createBooking(payload);
      setMessage(`Booking created. Reference: ${result.booking.id}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Book a Service</h2>
      <label>Service ID</label>
      <input name="service_id" value={form.service_id} onChange={handleChange} required />
      <label>Start date and time</label>
      <input type="datetime-local" name="booking_start" value={form.booking_start} onChange={handleChange} required />
      <label>End date and time</label>
      <input type="datetime-local" name="booking_end" value={form.booking_end} onChange={handleChange} required />
      <label>Address</label>
      <textarea name="address" value={form.address} onChange={handleChange} required />
      <label>Notes</label>
      <textarea name="notes" value={form.notes} onChange={handleChange} />
      <button type="submit" disabled={loading}>{loading ? "Submitting..." : "Confirm booking"}</button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}