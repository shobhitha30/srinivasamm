export const VALID_ROLES = ['donor', 'volunteer', 'orphanage', 'admin'];

export const ROLE_HOME = {
  admin: '/admin/dashboard',
  orphanage: '/orphanage/dashboard',
  volunteer: '/volunteer/dashboard',
  donor: '/dashboard',
};

const ROLE_LABELS = {
  admin: 'Admin',
  orphanage: 'Orphanage',
  volunteer: 'Volunteer',
  donor: 'Donor',
};

export function normalizeRole(role) {
  if (role === 'platform_admin') return 'admin';
  if (role === 'orphanage_admin') return 'orphanage';
  if (VALID_ROLES.includes(role)) return role;
  return null;
}

export function roleHome(role) {
  return ROLE_HOME[normalizeRole(role)] || ROLE_HOME.donor;
}

export function roleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)] || 'Donor';
}
