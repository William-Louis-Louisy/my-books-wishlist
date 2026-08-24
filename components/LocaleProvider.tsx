"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { APP_TIME_ZONE } from "@/lib/i18n";
import {
  getLocaleSnapshot,
  getServerLocaleSnapshot,
  subscribeToLocale,
} from "@/lib/locale-store";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    getLocaleSnapshot,
    getServerLocaleSnapshot,
  );
  const messages = locale === "en" ? enMessages : frMessages;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = messages.Common.appName;
  }, [locale, messages.Common.appName]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={APP_TIME_ZONE}
    >
      {children}
    </NextIntlClientProvider>
  );
}
