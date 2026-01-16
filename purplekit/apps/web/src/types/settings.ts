export interface OrganizationSettings {
  profile: {
    description: string | null;
    timezone: string;
    dateFormat: 'ISO' | 'US' | 'EU';
    timeFormat: '12h' | '24h';
  };
  reports: {
    defaultType: 'TACTICAL' | 'OPERATIONAL' | 'STRATEGIC';
    defaultFormat: 'pdf' | 'html' | 'docx';
  };
  security: {
    sessionTimeoutMinutes: number;
    requirePasswordChangeOnFirstLogin: boolean;
  };
}
