import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getDashboardOverview } from "../api/dashboardApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function StatCard({ title, value, color }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h2 className={`mt-3 text-3xl font-bold ${color}`}>{value ?? 0}</h2>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getDashboardOverview();
        setDashboard(data.dashboard);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <p className="text-gray-600">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-IN") : "N/A";

  const statusColor = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-700",
      "In Progress": "bg-blue-100 text-blue-700",
      Completed: "bg-green-100 text-green-700",
      Approved: "bg-green-100 text-green-700",
      Rejected: "bg-red-100 text-red-700",
    };

    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const taskChartData = [
    { status: "Pending", count: dashboard.tasks.pending },
    { status: "In Progress", count: dashboard.tasks.inProgress },
    { status: "Completed", count: dashboard.tasks.completed },
  ];

  const leaveChartData = [
    { status: "Pending", count: dashboard.leaves.pending },
    { status: "Approved", count: dashboard.leaves.approved },
    { status: "Rejected", count: dashboard.leaves.rejected },
  ];

  const employeeChartData = [
  {
    name: "Active",
    value: dashboard.employees?.active ?? 0,
  },
  {
    name: "Inactive",
    value: dashboard.employees?.inactive ?? 0,
  },
];

  const adminTaskChartData = [
    {
      name: "Pending",
      value: dashboard.tasks.pending,
    },
    {
      name: "In Progress",
      value: dashboard.tasks.inProgress,
    },
    {
      name: "Completed",
      value: dashboard.tasks.completed,
    },
  ];

  const adminLeaveChartData = [
  {
    name: "Pending",
    value: dashboard.leaves.pending,
  },
  {
    name: "Approved",
    value: dashboard.leaves.approved,
  },
  {
    name: "Rejected",
    value: dashboard.leaves.rejected,
  },
];

  const LEAVE_COLORS = ["#f59e0b", "#16a34a", "#dc2626"];
  const EMPLOYEE_COLORS = ["#16a34a", "#dc2626"];
  const TASK_COLORS = ["#F59E0B", "#6366f1", "#16a34a"];
  const ADMIN_LEAVE_COLORS = ["#f59e0b", "#16a34a", "#dc2626"];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

      <p className="mt-2 text-gray-600">Welcome, {user?.name || "User"}!</p>

      <p className="mt-1 text-sm text-gray-500">Role: {user?.role}</p>

      {user?.role === "Employee" && (
        <>
          <h2 className="mb-4 mt-8 text-xl font-semibold text-gray-800">
            My Tasks
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Tasks"
              value={dashboard.tasks.total}
              color="text-blue-600"
            />
            <StatCard
              title="Pending Tasks"
              value={dashboard.tasks.pending}
              color="text-yellow-600"
            />
            <StatCard
              title="In Progress"
              value={dashboard.tasks.inProgress}
              color="text-indigo-600"
            />
            <StatCard
              title="Completed Tasks"
              value={dashboard.tasks.completed}
              color="text-green-600"
            />
            <StatCard
              title="Overdue Tasks"
              value={dashboard.tasks.overdue}
              color="text-red-600"
            />
          </div>

          <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-800">
              Task Status Distribution
            </h2>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={taskChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <h2 className="mb-4 mt-8 text-xl font-semibold text-gray-800">
            My Leaves
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Leaves"
              value={dashboard.leaves.total}
              color="text-blue-600"
            />
            <StatCard
              title="Pending Leaves"
              value={dashboard.leaves.pending}
              color="text-yellow-600"
            />
            <StatCard
              title="Approved Leaves"
              value={dashboard.leaves.approved}
              color="text-green-600"
            />
            <StatCard
              title="Rejected Leaves"
              value={dashboard.leaves.rejected}
              color="text-red-600"
            />
          </div>
          {/* Leave Status Chart */}
          <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-800">
              Leave Status Distribution
            </h2>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveChartData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label
                  >
                    {leaveChartData.map((entry, index) => (
                      <Cell key={entry.status} fill={LEAVE_COLORS[index]} />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {(user?.role === "Admin" || user?.role === "Manager") && (
        <>
          <h2 className="mb-4 mt-8 text-xl font-semibold text-gray-800">
            Employee Overview
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Employees"
              value={dashboard.employees.total}
              color="text-blue-600"
            />
            <StatCard
              title="Active Employees"
              value={dashboard.employees.active}
              color="text-green-600"
            />
            <StatCard
              title="Inactive Employees"
              value={dashboard.employees.inactive}
              color="text-red-600"
            />
          </div>
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Employee Status Distribution
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={employeeChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {employeeChartData.map((entry, index) => (
                    <Cell
                      key={`employee-cell-${index}`}
                      fill={EMPLOYEE_COLORS[index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <h2 className="mb-4 mt-8 text-xl font-semibold text-gray-800">
            Task Overview
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Tasks"
              value={dashboard.tasks.total}
              color="text-blue-600"
            />
            <StatCard
              title="Pending Tasks"
              value={dashboard.tasks.pending}
              color="text-yellow-600"
            />
            <StatCard
              title="In Progress"
              value={dashboard.tasks.inProgress}
              color="text-indigo-600"
            />
            <StatCard
              title="Completed Tasks"
              value={dashboard.tasks.completed}
              color="text-green-600"
            />
            <StatCard
              title="Overdue Tasks"
              value={dashboard.tasks.overdue}
              color="text-red-600"
            />
          </div>
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Task Status Distribution
            </h3>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={adminTaskChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {adminTaskChartData.map((entry, index) => (
                    <Cell
                      key={`task-cell-${index}`}
                      fill={TASK_COLORS[index]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <h2 className="mb-4 mt-8 text-xl font-semibold text-gray-800">
            Leave Overview
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Leaves"
              value={dashboard.leaves.total}
              color="text-blue-600"
            />
            <StatCard
              title="Pending Leaves"
              value={dashboard.leaves.pending}
              color="text-yellow-600"
            />
            <StatCard
              title="Approved Leaves"
              value={dashboard.leaves.approved}
              color="text-green-600"
            />
            <StatCard
              title="Rejected Leaves"
              value={dashboard.leaves.rejected}
              color="text-red-600"
            />
          </div>
          <div className="mt-8 rounded-xl bg-white p-6 shadow">
  <h3 className="mb-4 text-lg font-semibold text-gray-800">
    Leave Status Distribution
  </h3>

  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={adminLeaveChartData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={100}
        label
      >
        {adminLeaveChartData.map((entry, index) => (
          <Cell
            key={`leave-cell-${index}`}
            fill={ADMIN_LEAVE_COLORS[index]}
          />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
</div>
        </>
      )}

      {/* Recent Tasks */}
      <h2 className="mb-4 mt-10 text-xl font-semibold text-gray-800">
        Recent Tasks
      </h2>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">Task</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4">Due Date</th>
            </tr>
          </thead>

          <tbody>
            {dashboard.recentTasks.length > 0 ? (
              dashboard.recentTasks.map((task) => (
                <tr key={task._id} className="border-t">
                  <td className="p-4 font-medium text-gray-800">
                    {task.title}
                  </td>
                  <td className="p-4">{task.priority}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor(task.status)}`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4">{formatDate(task.dueDate)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-500">
                  No recent tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Leaves */}
      <h2 className="mb-4 mt-10 text-xl font-semibold text-gray-800">
        Recent Leaves
      </h2>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">Leave Type</th>
              <th className="p-4">Start Date</th>
              <th className="p-4">End Date</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {dashboard.recentLeaves.length > 0 ? (
              dashboard.recentLeaves.map((leave) => (
                <tr key={leave._id} className="border-t">
                  <td className="p-4 font-medium text-gray-800">
                    {leave.leaveType}
                  </td>
                  <td className="p-4">{formatDate(leave.startDate)}</td>
                  <td className="p-4">{formatDate(leave.endDate)}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor(leave.status)}`}
                    >
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-500">
                  No recent leaves found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
