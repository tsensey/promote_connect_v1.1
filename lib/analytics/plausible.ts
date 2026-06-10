"use client";

import { usePlausible } from 'next-plausible';

export type AppEvents = {
  login_success: never;
  login_error: { error: string };
  pwa_installed: never;
  apk_first_open: never;
  click_contact_exposant: { exposant_id: string };
  click_agenda_add: { event_id: string };
  click_rdv_request: { destinataire_id: string };
};

export const useAnalytics = () => {
  const plausible = usePlausible<AppEvents>();

  const trackEvent = <E extends keyof AppEvents>(
    eventName: E,
    ...options: AppEvents[E] extends never ? [] : [props: AppEvents[E]]
  ) => {
    const p = plausible as any;
    if (options.length > 0) {
      p(eventName, { props: options[0] });
    } else {
      p(eventName);
    }
  };

  return { trackEvent };
};
