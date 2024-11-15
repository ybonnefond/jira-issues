export enum UserRole {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  FULLSTACK = 'fullstack',
  MANAGER = 'manager',
}

export function parseUserRole(value: unknown): UserRole {
  if (typeof value !== 'string') {
    throw new Error('User role must be a string');
  }

  if (!Object.values(UserRole).includes(value as UserRole)) {
    throw new Error(`Invalid user role: ${value}. Expected one of [${Object.values(UserRole).join(', ')}]`);
  }

  return value as UserRole;
}
