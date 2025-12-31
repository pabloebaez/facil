export const Table = ({ children, className = "" }) => <div className={`w-full overflow-auto ${className}`}><table className="w-full caption-bottom text-sm">{children}</table></div>;
export const TableHeader = ({ children, className = "" }) => <thead className={`[&_tr]:border-b ${className}`}>{children}</thead>;
export const TableBody = ({ children, className = "" }) => <tbody className={`[&_tr:last-child]:border-0 ${className}`}>{children}</tbody>;
export const TableFooter = ({ children, className = "" }) => <tfoot className={`border-t bg-gray-100/50 font-medium [&>tr]:last:border-b-0 ${className}`}>{children}</tfoot>;
export const TableRow = ({ children, className = "" }) => <tr className={`border-b transition-colors hover:bg-gray-100/50 data-[state=selected]:bg-gray-100 ${className}`}>{children}</tr>;
export const TableHead = ({ children, className = "" }) => <th className={`h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0 ${className}`}>{children}</th>;
export const TableCell = ({ children, className = "" }) => <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>{children}</td>;















