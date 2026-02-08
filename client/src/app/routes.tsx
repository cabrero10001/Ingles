import { createBrowserRouter } from "react-router";
import { Login } from "./pages/login";
import { Onboarding } from "./pages/onboarding";
import { Dashboard } from "./pages/dashboard";
import { Lesson } from "./pages/lesson";
import { Errors } from "./pages/errors";
import { Completed } from "./pages/completed";
import { DailyChallenge } from "./pages/daily-challenge";
import { AIConversation } from "./pages/ai-conversation";
import { RequireAuth } from "./routes/RequireAuth";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/onboarding",
    Component: () => (
      <RequireAuth>
        <Onboarding />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard",
    Component: () => (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/leccion",
    Component: () => (
      <RequireAuth>
        <Lesson />
      </RequireAuth>
    ),
  },
  {
    path: "/errores",
    Component: () => (
      <RequireAuth>
        <Errors />
      </RequireAuth>
    ),
  },
  {
    path: "/completado",
    Component: () => (
      <RequireAuth>
        <Completed />
      </RequireAuth>
    ),
  },
  {
    path: "/reto-diario",
    Component: () => (
      <RequireAuth>
        <DailyChallenge />
      </RequireAuth>
    ),
  },
  {
    path: "/conversacion-ia",
    Component: () => (
      <RequireAuth>
        <AIConversation />
      </RequireAuth>
    ),
  },
]);
