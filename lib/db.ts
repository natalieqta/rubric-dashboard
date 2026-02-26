import bcrypt from "bcryptjs";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  coachName: string | null;
  createdAt: Date;
};

const users = new Map<string, User>();
const byEmail = new Map<string, string>();

function cuid(): string {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function ensureSeed() {
  if (users.size > 0) return;
  const hash = await bcrypt.hash("changeme123", 10);
  const admin: User = {
    id: cuid(),
    email: "admin@lumenalta.com",
    passwordHash: hash,
    name: "Default Admin",
    role: "Admin",
    coachName: null,
    createdAt: new Date(),
  };
  users.set(admin.id, admin);
  byEmail.set(admin.email, admin.id);
}

export const db = {
  user: {
    findMany: async (opts?: { orderBy?: { createdAt: string }; select?: Record<string, boolean> }) => {
      await ensureSeed();
      let list = Array.from(users.values());
      if (opts?.orderBy?.createdAt === "desc") {
        list = list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      const select = opts?.select;
      if (select) {
        return list.map((u) => {
          const out: Record<string, unknown> = {};
          for (const k of Object.keys(select) as (keyof User)[]) if (select[k]) out[k] = u[k];
          return out;
        });
      }
      return list;
    },
    findUnique: async (args: { where: { id?: string; email?: string } }) => {
      await ensureSeed();
      let id: string | undefined;
      if (args.where.id) id = args.where.id;
      else if (args.where.email) id = byEmail.get(args.where.email);
      if (!id) return null;
      return users.get(id) ?? null;
    },
    create: async (args: {
      data: { email: string; passwordHash: string; name: string; role: string; coachName?: string | null };
      select?: Record<string, boolean>;
    }) => {
      await ensureSeed();
      if (byEmail.has(args.data.email)) throw new Error("Email already exists");
      const user: User = {
        id: cuid(),
        email: args.data.email,
        passwordHash: args.data.passwordHash,
        name: args.data.name,
        role: args.data.role,
        coachName: args.data.coachName ?? null,
        createdAt: new Date(),
      };
      users.set(user.id, user);
      byEmail.set(user.email, user.id);
      const select = args.select;
      if (select) {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(select) as (keyof User)[]) if (select[k]) out[k] = user[k];
        return out;
      }
      return user;
    },
    update: async (args: {
      where: { id: string };
      data: Partial<Pick<User, "email" | "name" | "role" | "coachName" | "passwordHash">>;
      select?: Record<string, boolean>;
    }) => {
      await ensureSeed();
      const existing = users.get(args.where.id);
      if (!existing) throw new Error("User not found");
      if (args.data.email != null && args.data.email !== existing.email) {
        byEmail.delete(existing.email);
        byEmail.set(args.data.email, existing.id);
      }
      const updated: User = {
        ...existing,
        ...args.data,
        email: args.data.email ?? existing.email,
        name: args.data.name ?? existing.name,
        role: args.data.role ?? existing.role,
        coachName: args.data.coachName !== undefined ? args.data.coachName : existing.coachName,
        passwordHash: args.data.passwordHash ?? existing.passwordHash,
      };
      users.set(updated.id, updated);
      const select = args.select;
      if (select) {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(select) as (keyof User)[]) if (select[k]) out[k] = updated[k];
        return out;
      }
      return updated;
    },
    delete: async (args: { where: { id: string } }) => {
      const u = users.get(args.where.id);
      if (u) {
        users.delete(u.id);
        byEmail.delete(u.email);
      }
    },
    count: async () => {
      await ensureSeed();
      return users.size;
    },
  },
};
