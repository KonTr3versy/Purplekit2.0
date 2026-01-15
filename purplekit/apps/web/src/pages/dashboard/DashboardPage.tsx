export function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Active Engagements', value: '3' },
          { label: 'Techniques Tested', value: '47' },
          { label: 'Detection Rate', value: '68%' },
          { label: 'Open Findings', value: '12' },
        ].map((stat) => (
          <div key={stat.label} className="card p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <p className="text-gray-500">Activity feed coming soon...</p>
      </div>
    </div>
  );
}
