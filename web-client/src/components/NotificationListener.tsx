'use client';

import { useNotificationToasts } from '@/hooks/useNotificationToasts';

/**
 * Component that listens to socket events and shows toast notifications.
 * This component doesn't render anything visible - it just sets up event listeners.
 */
export function NotificationListener() {
  // Set up toast notifications for customer order updates
  useNotificationToasts();

  // This component is invisible - it just manages notifications
  return null;
}
