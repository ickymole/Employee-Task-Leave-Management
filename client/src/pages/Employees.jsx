import { useEffect, useState } from "react";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../api/employeeApi";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEmployees: 0,
  });
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    department: "",
    designation: "",
    phone: "",
    joiningDate: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const handleCreateEmployee = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setFormError("");

      await createEmployee(formData);

      setFormData({
        name: "",
        email: "",
        password: "",
        employeeId: "",
        department: "",
        designation: "",
        phone: "",
        joiningDate: "",
      });

      setShowForm(false);
      setSearch("");
      setDepartment("");
      setStatus("");
      setPage(1);
      setRefresh((prev) => prev + 1);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create employee");
    } finally {
      setSaving(false);
    }
  };
  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);

    setFormData({
      name: employee.user?.name || "",
      email: employee.user?.email || "",
      password: "",
      employeeId: employee.employeeId || "",
      department: employee.department || "",
      designation: employee.designation || "",
      phone: employee.phone || "",
      joiningDate: employee.joiningDate
        ? employee.joiningDate.split("T")[0]
        : "",
    });

    setShowForm(true);
    setFormError("");
  };
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setFormError("");

      await updateEmployee(editingEmployee._id, {
        name: formData.name,
        department: formData.department,
        designation: formData.designation,
        phone: formData.phone,
        joiningDate: formData.joiningDate,
      });

      setEditingEmployee(null);
      setShowForm(false);
      setFormError("");

      setFormData({
        name: "",
        email: "",
        password: "",
        employeeId: "",
        department: "",
        designation: "",
        phone: "",
        joiningDate: "",
      });

      setRefresh((prev) => prev + 1);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update employee");
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteEmployee = async (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${employee.user?.name}? This will also delete their login account.`,
    );

    if (!confirmed) return;

    try {
      await deleteEmployee(employee._id);
      setRefresh((prev) => prev + 1);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete employee");
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getEmployees({
          search,
          department,
          status,
          page,
          limit: 5,
        });

        setEmployees(data.employees);
        setPagination(data.pagination);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [search, department, status, page, refresh]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Employee Management
        </h1>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingEmployee(null);
            setFormError("");

            setFormData({
              name: "",
              email: "",
              password: "",
              employeeId: "",
              department: "",
              designation: "",
              phone: "",
              joiningDate: "",
            });
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Add Employee"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            {editingEmployee ? "Edit Employee" : "Add New Employee"}
          </h2>

          {formError && (
            <p className="mb-4 text-sm text-red-600">{formError}</p>
          )}

          <form
            onSubmit={
              editingEmployee ? handleUpdateEmployee : handleCreateEmployee
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="rounded-lg border p-3"
              />

              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!!editingEmployee}
                required
                className="rounded-lg border p-3"
              />

              {!editingEmployee && (
                <input
                  type="password"
                  placeholder="Temporary Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="rounded-lg border p-3"
                />
              )}

              <input
                type="text"
                placeholder="Employee ID (e.g. EMP008)"
                value={formData.employeeId}
                onChange={(e) =>
                  setFormData({ ...formData, employeeId: e.target.value })
                }
                disabled={!!editingEmployee}
                required
                className="rounded-lg border p-3"
              />

              <input
                type="text"
                placeholder="Department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
                required
                className="rounded-lg border p-3"
              />

              <input
                type="text"
                placeholder="Designation"
                value={formData.designation}
                onChange={(e) =>
                  setFormData({ ...formData, designation: e.target.value })
                }
                required
                className="rounded-lg border p-3"
              />

              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
                className="rounded-lg border p-3"
              />

              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) =>
                  setFormData({ ...formData, joiningDate: e.target.value })
                }
                required
                className="rounded-lg border p-3"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingEmployee
                  ? "Update Employee"
                  : "Create Employee"}
            </button>
          </form>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by name, email or employee ID..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
        />

        <select
          value={department}
          onChange={(e) => {
            setDepartment(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 bg-white px-4 py-3"
        >
          <option value="">All Departments</option>
          <option value="IT">IT</option>
          <option value="Finance">Finance</option>
          <option value="Human Resources">Human Resources</option>
          <option value="Artificial Intelligence">
            Artificial Intelligence
          </option>
          <option value="Information Technology">Information Technology</option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 bg-white px-4 py-3"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {loading && <p className="p-4 text-gray-600">Loading employees...</p>}
      {error && <p className="p-4 text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto rounded-xl bg-white shadow">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Employee ID</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee._id} className="border-t">
                    <td className="p-4">{employee.user?.name}</td>
                    <td className="p-4">{employee.employeeId}</td>
                    <td className="p-4">{employee.user?.email}</td>
                    <td className="p-4">{employee.department}</td>
                    <td className="p-4">{employee.designation}</td>
                    <td className="p-4">{employee.phone}</td>
                    <td className="p-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                        {employee.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteEmployee(employee)}
                          className="rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Total Employees: {pagination.totalEmployees}
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((prev) => prev - 1)}
                disabled={page === 1}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={page >= pagination.totalPages}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {employees.length === 0 && (
            <p className="mt-4 text-gray-500">No employees found.</p>
          )}
        </>
      )}
    </div>
  );
}
export default Employees;
