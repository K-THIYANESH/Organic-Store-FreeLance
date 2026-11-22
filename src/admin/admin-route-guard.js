const USER_KEY = 'goorganic-user';

/** @returns {import('../shared/types/domain.js').User | null} */
export function readSessionUser() {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    if (!user || typeof user !== 'object') return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Admin pages render only when the stored session has role === 'admin'.
 * Customer sessions from the intro login stay role-less and are refused.
 */
export function guardAdminRoute() {
  const user = readSessionUser();
  if (!user || !user.email) {
    return { allowed: false, reason: 'Sign in on the storefront before opening admin.' };
  }
  if (user.role !== 'admin') {
    return { allowed: false, reason: 'This account is not an admin. Set role to "admin" on the server-issued session.' };
  }
  return { allowed: true, user };
}
