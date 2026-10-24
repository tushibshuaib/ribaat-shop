import { useEffect, useState } from "react";
import Loader from "../components/Loader.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { supabase } from "../lib/supabase.js";

const TEXT = [
  ["store_name", "Store name", 100],
  ["tagline", "Tagline", 150],
  ["currency_symbol", "Currency symbol", 5],
  ["contact_phone", "Phone", 30],
  ["contact_email", "Email", 120],
  ["whatsapp", "WhatsApp number (with country code)", 20],
  ["facebook_url", "Facebook page link (https://…)", 200],
  ["address", "Address", 250],
  ["announcement", "Top announcement bar (empty = hidden)", 200],
];
const NUMS = [
  ["delivery_fee_inside", "Delivery fee: inside city"],
  ["delivery_fee_outside", "Delivery fee: outside city"],
  ["free_delivery_over", "Free delivery over (0 = never)"],
];

export default function Settings() {
  const { refresh } = useSettings();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.from("settings").select("*").eq("id", 1).maybeSingle().then(({ data, error: err }) => {
      if (!alive) return;
      if (err || !data) return setError(err ? err.message : "Settings row not found. Re-run 01_schema.sql.");
      const f = { ...data };
      NUMS.forEach(([k]) => { f[k] = String(data[k]); });
      setForm(f);
    });
    return () => { alive = false; };
  }, []);

  const set = (key) => (e) => { setSaved(false); setForm((f) => ({ ...f, [key]: e.target.value })); };
  const setCheck = (key) => (e) => { setSaved(false); setForm((f) => ({ ...f, [key]: e.target.checked })); };

  async function save(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (form.store_name.trim().length < 2) return setError("Enter a store name.");
    if (!form.currency_symbol.trim()) return setError("Enter a currency symbol.");
    const fb = form.facebook_url.trim();
    if (fb && !/^https:\/\//i.test(fb)) return setError("Facebook link must start with https://");
    const nums = {};
    for (const [k, label] of NUMS) {
      const n = Number(form[k]);
      if (form[k] === "" || !Number.isFinite(n) || n < 0) return setError(`${label}: enter 0 or a positive number.`);
      nums[k] = n;
    }
    const payload = {
      store_name: form.store_name.trim(),
      tagline: form.tagline.trim(),
      currency_symbol: form.currency_symbol.trim(),
      contact_phone: form.contact_phone.trim(),
      contact_email: form.contact_email.trim(),
      whatsapp: form.whatsapp.trim(),
      facebook_url: fb,
      address: form.address.trim(),
      announcement: form.announcement.trim(),
      cod_enabled: form.cod_enabled,
      manual_pay_enabled: form.manual_pay_enabled,
      bkash_number: form.bkash_number.trim(),
      nagad_number: form.nagad_number.trim(),
      payment_instructions: form.payment_instructions.trim(),
      ...nums,
    };
    setBusy(true);
    const { error: err } = await supabase.from("settings").update(payload).eq("id", 1);
    setBusy(false);
    if (err) return setError(err.message);
    await refresh();
    setSaved(true);
  }

  if (!form && !error) return <Loader />;
  if (!form) return <p className="error-text">{error}</p>;

  return (
    <form className="stack" onSubmit={save}>
      <h1>Settings</h1>

      <div className="card">
        <h3>Store</h3>
        {TEXT.map(([key, label, max]) => (
          <label className="field" key={key}><span>{label}</span>
            <input className="input" value={form[key] || ""} onChange={set(key)} maxLength={max} />
          </label>
        ))}
      </div>

      <div className="card">
        <h3>Delivery</h3>
        {NUMS.map(([key, label]) => (
          <label className="field" key={key}><span>{label}</span>
            <input className="input" type="number" inputMode="decimal" min="0" step="0.01" value={form[key]} onChange={set(key)} />
          </label>
        ))}
      </div>

      <div className="card">
        <h3>Payment</h3>
        <label className="check"><input type="checkbox" checked={form.cod_enabled} onChange={setCheck("cod_enabled")} /> Cash on delivery</label>
        <label className="check"><input type="checkbox" checked={form.manual_pay_enabled} onChange={setCheck("manual_pay_enabled")} /> bKash / Nagad (manual transfer)</label>
        <label className="field"><span>bKash number</span>
          <input className="input" value={form.bkash_number || ""} onChange={set("bkash_number")} maxLength={20} />
        </label>
        <label className="field"><span>Nagad number</span>
          <input className="input" value={form.nagad_number || ""} onChange={set("nagad_number")} maxLength={20} />
        </label>
        <label className="field"><span>Instructions shown at checkout</span>
          <textarea className="input" value={form.payment_instructions || ""} onChange={set("payment_instructions")} maxLength={500} />
        </label>
        <p className="muted">A method only appears at checkout if it is switched on and its number is filled in.</p>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {saved ? <p className="success-text">Settings saved.</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
