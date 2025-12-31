export const Card = ({ children, className = '' }) => <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className}`}>{children}</div>;
export const CardHeader = ({ children, className = '' }) => <div className={`p-4 border-b border-gray-200 ${className}`}>{children}</div>;
export const CardTitle = ({ children, className = '' }) => <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
export const CardContent = ({ children, className = '' }) => <div className={`p-4 ${className}`}>{children}</div>;
export const CardFooter = ({ children, className = '' }) => <div className={`p-4 border-t border-gray-200 flex items-center ${className}`}>{children}</div>;















