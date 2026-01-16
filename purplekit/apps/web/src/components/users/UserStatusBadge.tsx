export function UserStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
      <span className="w-2 h-2 bg-green-600 rounded-full" />
      Active
    </span>
  ) : (
    <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
      <span className="w-2 h-2 bg-gray-600 rounded-full" />
      Inactive
    </span>
  );
}
