export function UserRoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800',
    RED_LEAD: 'bg-red-100 text-red-800',
    BLUE_LEAD: 'bg-blue-100 text-blue-800',
    ANALYST: 'bg-green-100 text-green-800',
    OBSERVER: 'bg-gray-100 text-gray-800',
  };

  const labels: Record<string, string> = {
    ADMIN: 'Admin',
    RED_LEAD: 'Red Lead',
    BLUE_LEAD: 'Blue Lead',
    ANALYST: 'Analyst',
    OBSERVER: 'Observer',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[role] || colors.OBSERVER}`}>
      {labels[role] || role}
    </span>
  );
}
