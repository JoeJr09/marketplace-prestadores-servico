export function canAccess(
  userRole: string,
  routeRole: string
) {
  return userRole === routeRole;
}