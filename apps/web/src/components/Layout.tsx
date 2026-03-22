import { NavLink, Outlet } from "react-router-dom";
import { ui } from "../i18n/ru";

export function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <NavLink to="/" end>
              {ui.appTitle}
            </NavLink>
          </div>
          <nav className="nav" aria-label={ui.navMainAria}>
            <NavLink to="/" end>
              {ui.nav.course}
            </NavLink>
            <NavLink to="/exercises">{ui.nav.exercises}</NavLink>
            <NavLink to="/resources">{ui.nav.resources}</NavLink>
            <NavLink to="/progress">{ui.nav.progress}</NavLink>
          </nav>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
    </div>
  );
}
