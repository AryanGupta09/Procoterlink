import React from 'react';
import { User, Permission, UserRole, ROLE_DEFINITIONS } from '@/types/user';

export class RBACService {
  /**
   * Check if user has a specific permission
   */
  static hasPermission(user: User, permission: Permission): boolean {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(user: User, permissions: Permission[]): boolean {
    if (!user || !user.permissions) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  static hasAllPermissions(user: User, permissions: Permission[]): boolean {
    if (!user || !user.permissions) return false;
    return permissions.every(permission => user.permissions.includes(permission));
  }

  /**
   * Get permissions for a specific role
   */
  static getPermissionsForRole(role: UserRole): Permission[] {
    const roleDefinition = ROLE_DEFINITIONS.find(def => def.role === role);
    return roleDefinition?.permissions || [];
  }

  /**
   * Check if user can access a specific route
   */
  static canAccessRoute(user: User, route: string): boolean {
    const routePermissions = this.getRoutePermissions(route);
    if (routePermissions.length === 0) return true; // Public route
    return this.hasAnyPermission(user, routePermissions);
  }

  /**
   * Get required permissions for a route
   */
  private static getRoutePermissions(route: string): Permission[] {
    const routeMap: Record<string, Permission[]> = {
      '/dashboard/users': ['users:read'],
      '/dashboard/users/create': ['users:create'],
      '/dashboard/users/bulk-import': ['users:bulk_import'],
      '/dashboard/organizations': ['org:view'],
      '/dashboard/organizations/settings': ['org:settings'],
      '/dashboard/groups': ['groups:read'],
      '/dashboard/groups/create': ['groups:create'],
      '/dashboard/exams/create': ['exams:create'],
      '/dashboard/exams': ['exams:read'],
      '/dashboard/results': ['results:view'],
      '/dashboard/analytics': ['results:analytics'],
      '/dashboard/proctor': ['proctor:monitor'],
      '/admin': ['system:admin'],
    };

    // Check for dynamic routes
    for (const [pattern, permissions] of Object.entries(routeMap)) {
      if (this.matchRoute(route, pattern)) {
        return permissions;
      }
    }

    return [];
  }

  /**
   * Match route patterns (simple implementation)
   */
  private static matchRoute(route: string, pattern: string): boolean {
    if (pattern.includes('[')) {
      // Handle dynamic routes like /users/[id]
      const regex = pattern.replace(/\[.*?\]/g, '[^/]+');
      return new RegExp(`^${regex}$`).test(route);
    }
    return route.startsWith(pattern);
  }

  /**
   * Check if user can manage another user
   */
  static canManageUser(currentUser: User, targetUser: User): boolean {
    // Super admin can manage anyone
    if (currentUser.role === 'super_admin') return true;
    
    // Organization admin can manage users in their org (except super admins)
    if (currentUser.role === 'organization_admin' && 
        currentUser.organizationId === targetUser.organizationId &&
        targetUser.role !== 'super_admin') {
      return true;
    }
    
    // Users can only manage themselves for profile updates
    if (currentUser.uid === targetUser.uid) return true;
    
    return false;
  }

  /**
   * Get hierarchical role level for comparison
   */
  static getRoleLevel(role: UserRole): number {
    const hierarchy = {
      'super_admin': 6,
      'organization_admin': 5,
      'exam_creator': 4,
      'proctor': 3,
      'viewer': 2,
      'participant': 1
    };
    return hierarchy[role] || 0;
  }

  /**
   * Check if user can assign a specific role
   */
  static canAssignRole(currentUser: User, targetRole: UserRole): boolean {
    const currentLevel = this.getRoleLevel(currentUser.role);
    const targetLevel = this.getRoleLevel(targetRole);
    
    // Can only assign roles at or below your level
    return currentLevel > targetLevel;
  }

  /**
   * Filter users based on current user's permissions
   */
  static filterAccessibleUsers(currentUser: User, users: User[]): User[] {
    if (currentUser.role === 'super_admin') {
      return users; // Super admin sees all
    }
    
    if (currentUser.role === 'organization_admin') {
      return users.filter(user => user.organizationId === currentUser.organizationId);
    }
    
    // Other roles see limited users based on their permissions
    return users.filter(user => 
      user.organizationId === currentUser.organizationId &&
      this.getRoleLevel(user.role) <= this.getRoleLevel(currentUser.role)
    );
  }

  /**
   * Get available roles that current user can assign
   */
  static getAssignableRoles(currentUser: User): UserRole[] {
    const allRoles: UserRole[] = ['super_admin', 'organization_admin', 'exam_creator', 'proctor', 'viewer', 'participant'];
    
    return allRoles.filter(role => this.canAssignRole(currentUser, role));
  }

  /**
   * Check organization access
   */
  static canAccessOrganization(user: User, organizationId: string): boolean {
    if (user.role === 'super_admin') return true;
    return user.organizationId === organizationId;
  }

  /**
   * Generate user permissions based on role and organization
   */
  static generateUserPermissions(role: UserRole, organizationId: string): Permission[] {
    return this.getPermissionsForRole(role);
  }
}

/**
 * Higher-order component for route protection
 */
export function withRoleProtection(
  WrappedComponent: React.ComponentType<any>,
  requiredPermissions: Permission[]
) {
  return function ProtectedComponent(props: any) {
    // This would be implemented with your auth context
    // For now, returning the component directly
    return <WrappedComponent {...props} />;
  };
}

/**
 * Hook for checking permissions in components
 */
export function usePermissions() {
  // This would integrate with your auth context
  return {
    hasPermission: (permission: Permission) => false,
    hasAnyPermission: (permissions: Permission[]) => false,
    hasAllPermissions: (permissions: Permission[]) => false,
    canAccessRoute: (route: string) => false,
  };
}
