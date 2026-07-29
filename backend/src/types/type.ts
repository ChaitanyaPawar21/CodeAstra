

// --- ENUMS ---
export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
    GUEST = 'GUEST'
}

// --- INTERFACES ---
// Use interfaces for object shapes, especially when they might be extended.
export interface User {
    id: string;
    email: string;
    role: UserRole;
    createdAt: Date;
}

// --- TYPES ---
// Use types for unions, intersections, or primitives.
export type UserId = User['id'];

export type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
};
