import { PermissionName } from '@prisma/client';

// Decorator for marking routes with required permissions
export function RequirePermission(permission: PermissionName) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store the permission requirement in route metadata
    if (!target.constructor.prototype.routeMetadata) {
      target.constructor.prototype.routeMetadata = {};
    }
    if (!target.constructor.prototype.routeMetadata[propertyKey]) {
      target.constructor.prototype.routeMetadata[propertyKey] = {};
    }
    target.constructor.prototype.routeMetadata[propertyKey].permission = permission;

    return descriptor;
  };
}

// Decorator for marking routes with multiple permission options (any of them)
export function RequireAnyPermission(permissions: PermissionName[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.constructor.prototype.routeMetadata) {
      target.constructor.prototype.routeMetadata = {};
    }
    if (!target.constructor.prototype.routeMetadata[propertyKey]) {
      target.constructor.prototype.routeMetadata[propertyKey] = {};
    }
    target.constructor.prototype.routeMetadata[propertyKey].permissions = permissions;
    target.constructor.prototype.routeMetadata[propertyKey].permissionType = 'any';

    return descriptor;
  };
}

// Decorator for marking routes with multiple required permissions (all of them)
export function RequireAllPermissions(permissions: PermissionName[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.constructor.prototype.routeMetadata) {
      target.constructor.prototype.routeMetadata = {};
    }
    if (!target.constructor.prototype.routeMetadata[propertyKey]) {
      target.constructor.prototype.routeMetadata[propertyKey] = {};
    }
    target.constructor.prototype.routeMetadata[propertyKey].permissions = permissions;
    target.constructor.prototype.routeMetadata[propertyKey].permissionType = 'all';

    return descriptor;
  };
}
