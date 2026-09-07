const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
    <div className="w-16 h-16 rounded-2xl bg-gradient-nova-soft flex items-center justify-center mb-4">
      {Icon && <Icon size={28} className="text-nova-600 dark:text-nova-300" />}
    </div>
    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-5">{description}</p>}
    {action}
  </div>
);

export default EmptyState;
