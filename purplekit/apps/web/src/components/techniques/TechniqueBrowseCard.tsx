interface AttackTechnique {
  id: string;
  name: string;
  description: string;
  tactics: string[];
  platforms: string[];
  isSubtechnique: boolean;
  deprecated: boolean;
}

interface TechniqueBrowseCardProps {
  technique: AttackTechnique;
  onClick: (technique: AttackTechnique) => void;
}

export function TechniqueBrowseCard({ technique, onClick }: TechniqueBrowseCardProps) {
  return (
    <button
      onClick={() => onClick(technique)}
      className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 bg-white transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <span className="font-mono text-sm text-purple-600 font-medium">
            {technique.id}
          </span>
          {technique.isSubtechnique && (
            <span className="ml-2 text-xs text-gray-500">(Sub-technique)</span>
          )}
        </div>
      </div>
      <h3 className="font-medium text-gray-900 mb-1">{technique.name}</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
        {technique.description}
      </p>
      <div className="flex flex-wrap gap-2">
        {technique.tactics.slice(0, 3).map((tactic) => (
          <span
            key={tactic}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
          >
            {tactic}
          </span>
        ))}
        {technique.tactics.length > 3 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            +{technique.tactics.length - 3} more
          </span>
        )}
      </div>
    </button>
  );
}
