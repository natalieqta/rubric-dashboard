"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  coachName: string | null;
  createdAt: string;
};

export function UsersClient({ coachNames }: { coachNames: string[] }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | "reset" | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  async function fetchUsers() {
    const res = await fetch("/api/users");
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    setUsers(data);
  }

  useEffect(() => {
    fetchUsers().catch(() => setError("Failed to load users")).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-zinc-500">Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => { setModal("create"); setEditingUser(null); }}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Create user
      </button>
      <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Name</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Email</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Role</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Coach name</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Created</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-100">
                <td className="px-4 py-2 font-medium text-zinc-900">{u.name}</td>
                <td className="px-4 py-2 text-zinc-700">{u.email}</td>
                <td className="px-4 py-2 text-zinc-700">{u.role}</td>
                <td className="px-4 py-2 text-zinc-700">{u.coachName ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-600">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => { setModal("edit"); setEditingUser(u); }}
                    className="mr-2 text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => { setModal("reset"); setResetUser(u); }}
                    className="mr-2 text-amber-600 hover:underline"
                  >
                    Reset password
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm("Delete this user?")) return;
                      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
                      if (res.ok) fetchUsers();
                    }}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === "create" && (
        <UserForm
          coachNames={coachNames}
          onClose={() => setModal(null)}
          onSuccess={() => { setModal(null); fetchUsers(); }}
        />
      )}
      {modal === "edit" && editingUser && (
        <UserForm
          coachNames={coachNames}
          user={editingUser}
          onClose={() => { setModal(null); setEditingUser(null); }}
          onSuccess={() => { setModal(null); setEditingUser(null); fetchUsers(); }}
        />
      )}
      {modal === "reset" && resetUser && (
        <ResetPasswordForm
          user={resetUser}
          onClose={() => { setModal(null); setResetUser(null); }}
          onSuccess={() => { setModal(null); setResetUser(null); }}
        />
      )}
    </div>
  );
}

function UserForm({
  coachNames,
  user,
  onClose,
  onSuccess,
}: {
  coachNames: string[];
  user?: User;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState(user?.role ?? "Coach");
  const [coachName, setCoachName] = useState(user?.coachName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      if (user) {
        const body: Record<string, unknown> = { email, name, role };
        if (role === "Coach") body.coachName = coachName || null;
        else body.coachName = null;
        if (password) body.password = password;
        const res = await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to update");
        }
      } else {
        if (!password) throw new Error("Password required");
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name,
            role,
            coachName: role === "Coach" ? coachName || null : null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to create");
        }
      }
      onSuccess();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">{user ? "Edit user" : "Create user"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="Admin">Admin</option>
              <option value="Coach">Coach</option>
            </select>
          </div>
          {role === "Coach" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700">Coach name (from sheet)</label>
              <select
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                required={role === "Coach"}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="">Select coach</option>
                {coachNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              {user ? "New password (leave blank to keep)" : "Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!user}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {user ? "Update" : "Create"}
            </button>
            <button type="button" onClick={onClose} className="rounded border border-zinc-300 px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordForm({
  user,
  onClose,
  onSuccess,
}: {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("Failed to reset password");
      onSuccess();
    } catch {
      setErr("Failed to reset password");
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">Reset password: {user.email}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              Reset
            </button>
            <button type="button" onClick={onClose} className="rounded border border-zinc-300 px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
