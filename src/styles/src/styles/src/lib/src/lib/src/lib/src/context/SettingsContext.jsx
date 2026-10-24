import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getSettings } from "../lib/api.js";

const DEFAULTS = {
  store_name: "Ribaat Shop",
  tagline: "Quality products, delivered fast",
  currency_symbol: "৳",
  contact_phone: "",
  contact_email: "",
  whatsapp: "",
  facebook_url: "",
  address: "",
  announcement: "",
  delivery_fee_inside: 60,
  delivery_fee_outside: 120,
  free_delivery_over: 0,
  cod_enabled: true,
  manual_pay_enabled: true,
  bkash_number: "",
  nagad_number: "",
  payment_instructions: "",
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);

  const refresh = useCallback(async () => {
    try {
      const row = await getSettings();
      if (row) setSettings({ ...DEFAULTS, ...row });
    } catch {
      /* keep defaults if the database is unreachable */
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => { document.title = settings.store_name; }, [settings.store_name]);

  const value = useMemo(() => ({ settings, refresh }), [settings, refresh]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
