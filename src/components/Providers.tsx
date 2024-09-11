'use client';

import { ReactNode } from 'react';
import { DeepgramContextProvider } from '../lib/contexts/DeepgramContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <DeepgramContextProvider>
      {children}
    </DeepgramContextProvider>
  );
}