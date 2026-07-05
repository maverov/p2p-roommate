import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

type Loader<TProps> = () => Promise<{ default: ComponentType<TProps> }>;

export function dynamicNoSsr<TProps>(loader: Loader<TProps>) {
  return dynamic(loader, { ssr: false });
}
