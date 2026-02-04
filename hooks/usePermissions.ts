import { useAuth } from '../contexts/AuthContext';
import { getPermissions, Role, Permissions } from '../utils/permissions';

export const usePermissions = () => {
    const { sessionRole, session } = useAuth();
    const role = (sessionRole as Role) || 'CLIENT';
    const permissions = getPermissions(role);
    const currentUserId = session?.user?.id;

    return {
        role,
        permissions,
        currentUserId,
        isMaster: role === 'MASTER',
        isArtist: role === 'ARTIST',
        isPiercer: role === 'PIERCER',
        isReceptionist: role === 'RECEPTIONIST',
    };
};
