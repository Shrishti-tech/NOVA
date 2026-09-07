export const SkeletonLine = ({ className = '' }) => <div className={`skeleton h-4 ${className}`} />;

export const SkeletonCircle = ({ size = 40 }) => (
  <div className="skeleton rounded-full" style={{ width: size, height: size }} />
);

export const SkeletonCard = () => (
  <div className="card p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <SkeletonLine className="w-2/5" />
      <SkeletonLine className="w-16 rounded-full" />
    </div>
    <SkeletonLine className="w-full" />
    <SkeletonLine className="w-3/4" />
    <div className="flex items-center gap-2 mt-2">
      <SkeletonCircle size={20} />
      <SkeletonLine className="w-24" />
    </div>
  </div>
);

export const SkeletonStat = () => (
  <div className="card p-5 flex flex-col gap-3">
    <SkeletonLine className="w-1/2" />
    <SkeletonLine className="w-1/3 h-7" />
  </div>
);
