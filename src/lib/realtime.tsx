'use client';

import React, { createContext, useContext, useState } from 'react';

interface RealtimeAlert {
  id: string;
  type: 'created' | 'grant' | 'cheque';
  title: string;
  message: string;
  timestamp: Date;
}

interface RealtimeContextType {
  alerts: RealtimeAlert[];
  clearAlert: (id: string) => void;
  triggerRefresh: () => void;
  lastEventTimestamp: number;
}

const RealtimeContext = createContext<RealtimeContextType>({
  alerts: [],
  clearAlert: () => {},
  triggerRefresh: () => {},
  lastEventTimestamp: 0,
});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const [lastEventTimestamp, setLastEventTimestamp] = useState<number>(Date.now());

  const clearAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const triggerRefresh = () => {
    setLastEventTimestamp(Date.now());
  };

  return (
    <RealtimeContext.Provider value={{ alerts, clearAlert, triggerRefresh, lastEventTimestamp }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
