import { Outlet } from "react-router-dom";
import Header from "./Header";
import BottomNavbar from "./BottomNavbar";
import "./AppLayout.css";

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Header />
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNavbar />
    </div>
  );
}