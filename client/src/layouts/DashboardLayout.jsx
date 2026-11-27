import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function DashboardLayout() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `block rounded-lg px-4 py-3 ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white p-5 shadow-md">
        <h2 className="mb-8 text-xl font-bold text-blue-700">
          Employee Management
        </h2>

        <nav className="space-y-2">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>

          <NavLink to="/employees" className={linkClass}>
            Employees
          </NavLink>

          <NavLink to="/tasks" className={linkClass}>
            Tasks
          </NavLink>

          <NavLink to="/leaves" className={linkClass}>
            Leaves
          </NavLink>

          <NavLink to="/attendance" className={linkClass}>
            Attendance
          </NavLink>

          <NavLink to="/notifications" className={linkClass}>
            Notifications
          </NavLink>
        </nav>

        <div className="mt-10 border-t pt-5">
          <p className="font-semibold">{user?.name}</p>
          <p className="mb-4 text-sm text-gray-500">{user?.role}</p>

          <button
            onClick={logout}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;