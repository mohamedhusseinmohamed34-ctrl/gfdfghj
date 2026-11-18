import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const links = !user ? [] : user.role === "customer"
    ? [["/home","Explore services"],["/appointments","My appointments"]]
    : user.role === "provider"
      ? [["/provider/bookings","Booking requests"],["/provider/profile","My profile"]]
      : [["/admin","Admin dashboard"],["/receptionist","Receptionist desk"]];

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  return (
    <>
      <header className="topbar">
        <Link to={user ? (user.role === "customer" ? "/home" : user.role === "provider" ? "/provider/bookings" : "/admin") : "/"} className="brand">
          khidma<span>.</span><small>Cairo's service hub</small>
        </Link>
        <nav className="nav">
          {links.map(([to,label]) => <NavLink key={to} to={to} className={({isActive}) => isActive ? "active" : ""}>{label}</NavLink>)}
          <NavLink to="/about">About & contact</NavLink>
          {user ? <>
            <span className="role-pill">{user.role === "customer" ? "Booker" : user.role === "provider" ? "Provider" : "Admin"}</span>
            <button className="nav-button" onClick={handleLogout}>Sign out</button>
          </> : <Link className="nav-cta" to="/login">Sign in</Link>}
        </nav>
      </header>
      <main className="site-main"><Outlet /></main>
      <footer className="footer">Khidma · Everyday services, closer to home · Cairo, Egypt</footer>
    </>
  );
}