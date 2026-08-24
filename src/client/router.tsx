import { createBrowserRouter } from "react-router";
import { RootLayout } from "@/client/root";
import { RequireAuth } from "@/client/components/RequireAuth";
import { HomePage } from "@/client/pages/HomePage";
import { LoginPage } from "@/client/pages/LoginPage";
import { CriteriaPage } from "@/client/pages/CriteriaPage";
import { HouseDetailPage } from "@/client/pages/HouseDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        ),
      },
      { path: "login", element: <LoginPage /> },
      {
        path: "criteria",
        element: (
          <RequireAuth>
            <CriteriaPage />
          </RequireAuth>
        ),
      },
      {
        path: "houses/:id",
        element: (
          <RequireAuth>
            <HouseDetailPage />
          </RequireAuth>
        ),
      },
    ],
  },
]);
