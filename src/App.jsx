import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import Critics from "./pages/Critics";
import Memory from "./pages/Memory";
import Settings from "./pages/Settings";
import ProjectWorkspace from "./pages/ProjectWorkspace";

export default function App() {
  return <BrowserRouter><Routes><Route element={<AppLayout/>}>
    <Route path="/" element={<Home/>}/>
    <Route path="/studio" element={<Studio/>}/>
    <Route path="/projects/:projectId" element={<ProjectWorkspace/>}/>
    <Route path="/projects/:projectId/:section" element={<ProjectWorkspace/>}/>
    <Route path="/critics" element={<Critics/>}/>
    <Route path="/memory" element={<Memory/>}/>
    <Route path="/settings" element={<Settings/>}/>
  </Route></Routes></BrowserRouter>;
}
