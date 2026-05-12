"use client";
import { useState } from "react";
export function AdminRoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);
  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    setSaving(true);
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ auth_user_id: userId, app_role: newRole }) });
    setRole(newRole);
    setSaving(false);
  };
  return (
    <select value={role} onChange={handleChange} disabled={saving}
      className="text-xs border rounded px-2 py-1 bg-background shrink-0">
      <option value="member">Member</option>
      <option value="leader">Leader</option>
      <option value="admin">Admin</option>
    </select>
  );
}