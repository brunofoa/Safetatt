export type Role = 'MASTER' | 'ARTIST' | 'PIERCER' | 'RECEPTIONIST' | 'CLIENT';

export interface Permissions {
    // Dashboard
    canViewFinancials: boolean;
    canViewAllAppointments: boolean;

    // Agenda
    canViewAllAgenda: boolean;

    // Atendimentos
    canViewAllSessions: boolean;
    canCreateSession: boolean;
    canFilterByProfessional: boolean;

    // Clientes
    canViewClientProfile: boolean;
    canEditClient: boolean;
    canAddClient: boolean;

    // Páginas completas
    canAccessMarketing: boolean;
    canAccessLoyalty: boolean;
    canAccessSettings: boolean;
}

export const getPermissions = (role: Role): Permissions => {
    switch (role) {
        case 'MASTER':
            return {
                canViewFinancials: true,
                canViewAllAppointments: true,
                canViewAllAgenda: true,
                canViewAllSessions: true,
                canCreateSession: true,
                canFilterByProfessional: true,
                canViewClientProfile: true,
                canEditClient: true,
                canAddClient: true,
                canAccessMarketing: true,
                canAccessLoyalty: true,
                canAccessSettings: true,
            };

        case 'ARTIST':
        case 'PIERCER':
            return {
                canViewFinancials: false,
                canViewAllAppointments: false, // Só os próprios
                canViewAllAgenda: false, // Só os próprios
                canViewAllSessions: false, // Só os próprios
                canCreateSession: true,
                canFilterByProfessional: false, // Não pode filtrar por outros
                canViewClientProfile: false,
                canEditClient: false,
                canAddClient: true,
                canAccessMarketing: false,
                canAccessLoyalty: false,
                canAccessSettings: false,
            };

        case 'RECEPTIONIST':
            return {
                canViewFinancials: false,
                canViewAllAppointments: false, // Só os próprios no dashboard
                canViewAllAgenda: true, // Pode ver agenda de todos
                canViewAllSessions: true, // Pode ver todos atendimentos
                canCreateSession: false, // Não pode realizar atendimento
                canFilterByProfessional: true,
                canViewClientProfile: false,
                canEditClient: false,
                canAddClient: true,
                canAccessMarketing: true,
                canAccessLoyalty: true,
                canAccessSettings: false,
            };

        default:
            return {
                canViewFinancials: false,
                canViewAllAppointments: false,
                canViewAllAgenda: false,
                canViewAllSessions: false,
                canCreateSession: false,
                canFilterByProfessional: false,
                canViewClientProfile: false,
                canEditClient: false,
                canAddClient: false,
                canAccessMarketing: false,
                canAccessLoyalty: false,
                canAccessSettings: false,
            };
    }
};
