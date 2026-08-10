export const ALLOWED_USER_IDS = [8877452838, 8197456094];

export function isAllowedUser(id?: number): boolean {
  return typeof id === "number" && ALLOWED_USER_IDS.includes(id);
}
