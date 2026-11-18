const API_URL = "/api";

export async function createBooking(bookingData) {
  const response = await fetch(`${API_URL}/bookings`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Booking failed");
  }

  return data;
}