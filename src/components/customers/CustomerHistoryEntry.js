import React from 'react';

export function CustomerHistoryEntry({ entry }) { 
  return ( 
    <div className="text-xs border-t pt-2 mt-2"> 
      <p className="text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p> 
      <p>{entry.details}</p> 
    </div> 
  ); 
}















