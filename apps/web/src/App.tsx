import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ExercisesPage } from "./pages/ExercisesPage";
import { HomePage } from "./pages/HomePage";
import { MonthPage } from "./pages/MonthPage";
import { ProgressPage } from "./pages/ProgressPage";
import { ReaderPage } from "./pages/ReaderPage";
import { ResourcesPage } from "./pages/ResourcesPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="month/:monthId" element={<MonthPage />} />
        <Route path="read/:contentId" element={<ReaderPage />} />
        <Route path="exercises" element={<ExercisesPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
