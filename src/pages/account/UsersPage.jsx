import { useEffect, useState } from "react";
import userAPI from "../../services/user.service";
import "./UserPage.css";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  role: "user",
};

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await userAPI.getAllUsers();
      setUsers(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Cannot load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      await userAPI.createUser(form);
      setForm(initialForm);
      setMessage("User created successfully");
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Cannot create user");
    } finally {
      setSubmitting(false);
    }
  };

  const activeUsers = users.filter((user) => user.isActive).length;
  const adminUsers = users.filter((user) => user.role === "admin").length;

  return (
    <main className="users-page">
      <section className="users-page__header">
        <div>
          <p className="users-page__eyebrow">Account Management</p>
          <h1>Users</h1>
          <p className="users-page__subtitle">
            Manage customer accounts, roles, and connection status.
          </p>
        </div>
        <button className="users-page__refresh" type="button" onClick={fetchUsers}>
          Refresh
        </button>
      </section>

      <section className="users-page__stats" aria-label="User summary">
        <article>
          <span>Total users</span>
          <strong>{users.length}</strong>
        </article>
        <article>
          <span>Active users</span>
          <strong>{activeUsers}</strong>
        </article>
        <article>
          <span>Admins</span>
          <strong>{adminUsers}</strong>
        </article>
      </section>

      <section className="users-page__workspace">
        <form className="users-form" onSubmit={handleSubmit}>
          <div className="users-form__title">
            <h2>Create User</h2>
            <p>Add a user record to MongoDB.</p>
          </div>

          <label>
            Full name
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Nguyen Van A"
              required
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="user@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="123456"
              required
            />
          </label>

          <label>
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="0900000000"
            />
          </label>

          <label>
            Role
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <button className="users-form__submit" type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </button>

          {message && <p className="users-page__success">{message}</p>}
          {error && <p className="users-page__error">{error}</p>}
        </form>

        <section className="users-list">
          <div className="users-list__heading">
            <div>
              <h2>User List</h2>
              <p>Latest records from the users collection.</p>
            </div>
            <span>{users.length} users</span>
          </div>

          {loading ? (
            <p className="users-list__empty">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="users-list__empty">No users found.</p>
          ) : (
            <div className="users-list__table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="users-list__person">
                          <span>{user.fullName?.charAt(0)?.toUpperCase() || "U"}</span>
                          <strong>{user.fullName}</strong>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone || "-"}</td>
                      <td>
                        <span className={`users-list__role users-list__role--${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`users-list__status ${
                            user.isActive
                              ? "users-list__status--active"
                              : "users-list__status--inactive"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default UsersPage;
