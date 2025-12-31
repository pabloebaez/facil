export const Input = ({ className = "", type = "text", ...props }) => <input type={type} className={`flex h-10 w-full rounded-md border border-accent-300 bg-transparent py-2 px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;

export const Checkbox = ({ id, checked, onChange, className = "", children }) => ( 
  <div className={`flex items-center space-x-2 ${className}`}> 
    <input type="checkbox" id={id} checked={checked} onChange={onChange} className="h-4 w-4 rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"/> 
    <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{children}</label> 
  </div> 
);

export const Textarea = ({ className = "", ...props }) => ( 
  <textarea className={`flex min-h-[80px] w-full rounded-md border border-accent-300 bg-transparent py-2 px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} /> 
);

export const Select = ({ children, className = "", ...props }) => ( 
  <select className={`flex h-10 w-full items-center justify-between rounded-md border border-accent-300 bg-transparent py-2 px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>{children}</select> 
);

