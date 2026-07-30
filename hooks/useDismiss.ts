'use client';

import { useEffect, type RefObject } from 'react';

type UseDismissOptions = {
  isOpen: boolean;
  onDismiss: () => void;
  /** Container that defines "inside"; pointer events outside it dismiss. */
  ref: RefObject<HTMLElement | null>;
};

/**
 * Closes a popover on outside pointer-down or Escape. Listeners are only
 * attached while the popover is open, so closed popovers cost nothing.
 */
export function useDismiss({ isOpen, onDismiss, ref }: UseDismissOptions) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        onDismiss();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onDismiss, ref]);
}
