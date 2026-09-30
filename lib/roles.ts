/** Matches the Better Auth admin plugin's defaults (`adminRoles` / `defaultRole`). */
export const ADMIN_ROLE = 'admin';
export const DEFAULT_ROLE = 'user';

export function isAdmin(user: { role?: string | null } | null | undefined) {
  return user?.role === ADMIN_ROLE;
}
