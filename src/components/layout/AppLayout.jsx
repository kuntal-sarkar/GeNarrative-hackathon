import { Outlet } from "react-router-dom";
import Header from "./Header";
import BottomNavbar from "./BottomNavbar";
import GlobalSearch from "../search/GlobalSearch";
import "./AppLayout.css";

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Header />
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNavbar />
      <GlobalSearch />
    </div>
  );
}