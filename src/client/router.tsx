import { createBrowserRouter } from "react-router";
import { RootLayout } from "@/client/root";
import { RequireAuth } from "@/client/components/RequireAuth";
import { HomePage } from "@/client/pages/HomePage";
import { LoginPage } from "@/client/pages/LoginPage";
import { CriteriaPage } from "@/client/pages/CriteriaPage";
import { SearchProfilesPage } from "@/client/pages/SearchProfilesPage";
import { HouseDetailPage } from "@/client/pages/HouseDetailPage";
import { ArchivePage } from "@/client/pages/ArchivePage";

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
        path: "search-profiles",
        element: (
          <RequireAuth>
            <SearchProfilesPage />
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
      {
        path: "archive",
        element: (
          <RequireAuth>
            <ArchivePage />
          </RequireAuth>
        ),
      },
    ],
  },
]);
