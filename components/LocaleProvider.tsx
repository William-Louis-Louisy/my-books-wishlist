"use client";

import {
  getLocaleSnapshot,
  subscribeToLocale,
  getServerLocaleSnapshot,
} from "@/lib/locale-store";
import { APP_TIME_ZONE } from "@/lib/i18n";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";
import { NextIntlClientProvider } from "next-intl";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

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
