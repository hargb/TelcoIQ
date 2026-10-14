"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

type CustomerForm = {
  gender: string; SeniorCitizen: number; Partner: string; Dependents: string;
  tenure: number; PhoneService: string; MultipleLines: string; InternetService: string;
  OnlineSecurity: string; OnlineBackup: string; DeviceProtection: string; TechSupport: string;
  StreamingTV: string; StreamingMovies: string; Contract: string; PaperlessBilling: string;
  PaymentMethod: string; MonthlyCharges: number; TotalCharges: number;
};

type PredictionResult = {
  id: number; customer_id: string; prediction: string; churn_probability: number;
  risk_level: string; threshold: number; created_at: string;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const DEFAULT_THRESHOLD = 0.6;

const INTERNET_KEYS = [
  "OnlineSecurity", "OnlineBackup", "DeviceProtection",
  "TechSupport", "StreamingTV", "StreamingMovies",
] as const;

const initialCustomer: CustomerForm = {
  gender: "Female", SeniorCitizen: 0, Partner: "Yes", Dependents: "No", tenure: 2,
  PhoneService: "Yes", MultipleLines: "No", InternetService: "Fiber optic",
  OnlineSecurity: "No", OnlineBackup: "No", DeviceProtection: "No", TechSupport: "No",
  StreamingTV: "No", StreamingMovies: "No", Contract: "Month-to-month",
  PaperlessBilling: "Yes", PaymentMethod: "Electronic check",
  MonthlyCharges: 85.5, TotalCharges: 171,
};

const inputClass = "mt-2 w-full rounded-sm border border-[#b7ad91] bg-[#eee4ce] px-4 py-3.5 text-sm text-[#24271d] outline-none transition placeholder:text-[#777257] focus:border-[#315c45] focus:ring-2 focus:ring-[#315c45]/15";

const selectFields: { key: keyof CustomerForm; label: string; options: string[] }[] = [
  { key: "gender", label: "Gender", options: ["Female", "Male"] },
  { key: "Partner", label: "Has partner", options: ["Yes", "No"] },
  { key: "Dependents", label: "Has dependents", options: ["Yes", "No"] },
  { key: "PhoneService", label: "Phone service", options: ["Yes", "No"] },
  { key: "MultipleLines", label: "Multiple lines", options: ["No", "Yes", "No phone service"] },
  { key: "InternetService", label: "Internet service", options: ["DSL", "Fiber optic", "No"] },
  { key: "OnlineSecurity", label: "Online security", options: ["Yes", "No", "No internet service"] },
  { key: "OnlineBackup", label: "Online backup", options: ["Yes", "No", "No internet service"] },
  { key: "DeviceProtection", label: "Device protection", options: ["Yes", "No", "No internet service"] },
  { key: "TechSupport", label: "Tech support", options: ["Yes", "No", "No internet service"] },
  { key: "StreamingTV", label: "Streaming TV", options: ["Yes", "No", "No internet service"] },
  { key: "StreamingMovies", label: "Streaming movies", options: ["Yes", "No", "No internet service"] },
  { key: "Contract", label: "Contract type", options: ["Month-to-month", "One year", "Two year"] },
  { key: "PaperlessBilling", label: "Paperless billing", options: ["Yes", "No"] },
  { key: "PaymentMethod", label: "Payment method", options: ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"] },
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0 text-sm"><span className="block font-medium text-[#3d4332]">{label}</span>{children}</label>;
}

function SectionTitle({ number, title, description }: { number: string; title: string; description: string }) {
  return <div className="mb-5 flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-[#c65b36]/30 bg-[#c65b36]/10 text-sm font-bold text-[#a64a2e]">{number}</div><div><h3 className="font-semibold text-[#24271d]">{title}</h3><p className="mt-1 text-xs leading-5 text-[#777257]">{description}</p></div></div>;
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-sm border-2 border-[#315c45] bg-[#244a3a] p-5 text-[#f7efd9] shadow-[3px_3px_0_rgba(49,92,69,0.18)]"><p className="font-mono text-xs font-medium uppercase tracking-wider text-[#d9cfad]">{label}</p><p className="mt-2 font-mono text-3xl font-black text-[#f7efd9]">{value}</p><p className="mt-1 text-xs text-[#d9cfad]">{detail}</p></div>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function Home() {
  const [customerId, setCustomerId] = useState("CUST-1042");
  const [customer, setCustomer] = useState<CustomerForm>(initialCustomer);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<PredictionResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`${API_URL}/history?limit=8`, { cache: "no-store" });
      if (!response.ok) throw new Error("History request failed");
      const data: PredictionResult[] = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/health`, { cache: "no-store" })
      .then((response) => { if (active) setApiStatus(response.ok ? "online" : "offline"); })
      .catch(() => { if (active) setApiStatus("offline"); });
    void loadHistory();
    return () => { active = false; };
  }, [loadHistory]);

  function updateField<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setCustomer((prev) => {
      const next = { ...prev, [key]: value } as CustomerForm;

      // PhoneService "No" => MultipleLines must be "No phone service"
      if (key === "PhoneService") {
        next.MultipleLines =
          value === "No"
            ? "No phone service"
            : prev.MultipleLines === "No phone service" ? "No" : prev.MultipleLines;
      }

      // InternetService "No" => all internet add-ons must be "No internet service"
      if (key === "InternetService") {
        for (const k of INTERNET_KEYS) {
          next[k] =
            value === "No"
              ? "No internet service"
              : prev[k] === "No internet service" ? "No" : prev[k];
        }
      }
      return next;
    });
    setResult(null);
    setError("");
  }

  async function predictChurn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!customerId.trim()) { setError("Please enter a customer reference ID."); return; }
    if (!Number.isInteger(customer.tenure) || customer.tenure < 0 || customer.tenure > 72) {
      setError("Tenure must be between 0 and 72 months."); return;
    }
    if (!Number.isFinite(customer.MonthlyCharges) || customer.MonthlyCharges < 0 ||
        !Number.isFinite(customer.TotalCharges) || customer.TotalCharges < 0) {
      setError("Please enter valid, non-negative charges."); return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...customer, customer_id: customerId.trim() }),
      });
      if (!response.ok) {
        let message = response.statusText;
        try {
          const body = await response.json();
          message = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? body);
        } catch { /* non-JSON response */ }
        throw new Error(`API error ${response.status}: ${message}`);
      }
      const data: PredictionResult = await response.json();
      if (typeof data.churn_probability !== "number" || !Number.isFinite(data.churn_probability) ||
          data.churn_probability < 0 || data.churn_probability > 1 ||
          typeof data.prediction !== "string" || typeof data.threshold !== "number" ||
          typeof data.risk_level !== "string") {
        throw new Error("Invalid prediction response from API.");
      }
      setResult(data);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction request failed.");
    } finally {
      setLoading(false);
    }
  }

  const probability = result ? result.churn_probability * 100 : 0;
  const threshold = result?.threshold ?? history[0]?.threshold ?? DEFAULT_THRESHOLD;
  const thresholdLabel = `${(threshold * 100).toFixed(0)}%`;
  const churnCount = history.filter((item) => item.prediction === "Yes").length;
  const avgRisk = history.length ? history.reduce((sum, item) => sum + item.churn_probability, 0) / history.length * 100 : null;

  function renderSelectField(field: (typeof selectFields)[number]) {
    return <Field key={field.key} label={field.label}>
      <select value={String(customer[field.key])} onChange={(event) => updateField(field.key, event.target.value as CustomerForm[typeof field.key])} className={inputClass}>
        {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </Field>;
  }

  return (
    <main className="min-h-screen bg-[#d7c9a7] px-2 py-3 font-mono text-[#24271d] sm:px-4 lg:px-5">
      <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#315c45]/[0.06] blur-2xl" /><div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-[#c65b36]/[0.08] blur-2xl" /></div>
      <div className="relative mx-auto max-w-[1500px] border-[3px] border-[#315c45] bg-[#eee4ce] p-3 shadow-[8px_8px_0_rgba(36,74,58,0.2)] sm:p-5">
        <header className="mb-8 flex flex-col gap-6 border-b border-[#b7ad91] pb-7 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#315c45] font-black text-[#f7efd9] shadow-lg shadow-[#17664f]/10">T</div><div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#315c45]">TELECO / FIELD SYSTEMS</p><h1 className="mt-1 font-mono text-4xl font-black uppercase tracking-tight sm:text-5xl">Telco<span className="text-[#315c45]">IQ</span></h1><p className="mt-1 text-sm text-[#5d604b]">Customer retention, with a signal-first view</p></div></div>
          <div className="flex flex-wrap items-center gap-3"><div className="rounded-sm border border-[#b7ad91] bg-white/90 px-4 py-3"><p className="text-[11px] uppercase tracking-wider text-[#777257]">Backend status</p><div className="mt-1 flex items-center gap-2 text-sm font-semibold"><span className={`h-2 w-2 rounded-full ${apiStatus === "online" ? "bg-[#315c45]" : apiStatus === "offline" ? "bg-[#c94c3b]" : "animate-pulse bg-[#e77735]"}`} />{apiStatus === "online" ? "Connected" : apiStatus === "offline" ? "Offline" : "Checking"}</div></div><a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" className="rounded-sm border border-[#d6d2c7] px-4 py-3 text-sm font-semibold text-[#3d4332] transition hover:border-[#315c45] hover:text-[#315c45]">API documentation ↗</a></div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Latest records" value={historyLoading ? "…" : String(history.length)} detail="Latest records from database" />
          <StatCard label="Churn flagged" value={historyLoading ? "…" : String(churnCount)} detail="Among recent predictions" />
          <StatCard label="Mean model score" value={avgRisk === null ? "—" : `${avgRisk.toFixed(1)}%`} detail="Recent prediction probabilities" />
          <StatCard label="Decision threshold" value={thresholdLabel} detail="Configured model threshold" />
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
          <form onSubmit={predictChurn} className="rounded-sm border border-[#b7ad91] bg-[#f7efd9] p-5 shadow-[5px_5px_0_rgba(49,92,69,0.12)] sm:p-8">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#315c45]">OPERATIONS CONSOLE / 01</p><h2 className="mt-2 text-2xl font-bold">Analyze a customer</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#5d604b]">Enter the customer profile, subscription services and billing details to estimate churn probability.</p></div><span className="rounded-full border border-[#315c45]/30 bg-[#315c45]/10 px-3 py-1.5 text-xs font-semibold text-[#315c45]">19 model features</span></div>

            <section className="mb-8"><SectionTitle number="01" title="Customer profile" description="Basic customer information and relationship history." /><div className="grid gap-4 sm:grid-cols-2">
              <Field label="Customer reference ID"><input value={customerId} onChange={(event) => setCustomerId(event.target.value)} placeholder="e.g. CUST-1042" className={inputClass} required /></Field>
              {renderSelectField(selectFields[0])}
              <Field label="Senior citizen"><select value={String(customer.SeniorCitizen)} onChange={(event) => updateField("SeniorCitizen", Number(event.target.value))} className={inputClass}><option value="0">No</option><option value="1">Yes</option></select></Field>
              {selectFields.slice(1, 3).map(renderSelectField)}
              <Field label={`Tenure — ${customer.tenure} months`}><input type="range" min="0" max="72" step="1" value={customer.tenure} onChange={(event) => updateField("tenure", Number(event.target.value))} className="mt-5 w-full accent-[#315c45]" /><div className="mt-2 flex justify-between text-xs text-[#777257]"><span>0 months</span><span>72 months</span></div></Field>
            </div></section>

            <section className="mb-8 border-t border-[#b7ad91] pt-7"><SectionTitle number="02" title="Services & subscriptions" description="Phone, internet, support and entertainment services." /><div className="grid gap-4 sm:grid-cols-2">{selectFields.slice(3, 12).map(renderSelectField)}</div></section>

            <section className="mb-8 border-t border-[#b7ad91] pt-7"><SectionTitle number="03" title="Contract & billing" description="Agreement type, billing preference and payment method." /><div className="grid gap-4 sm:grid-cols-2">
              {selectFields.slice(12).map(renderSelectField)}
              <Field label="Monthly charges"><input type="number" min="0" step="0.01" value={Number.isFinite(customer.MonthlyCharges) ? customer.MonthlyCharges : ""} onChange={(event) => updateField("MonthlyCharges", event.target.value === "" ? Number.NaN : Number(event.target.value))} className={inputClass} required /></Field>
              <Field label="Total charges"><input type="number" min="0" step="0.01" value={Number.isFinite(customer.TotalCharges) ? customer.TotalCharges : ""} onChange={(event) => updateField("TotalCharges", event.target.value === "" ? Number.NaN : Number(event.target.value))} className={inputClass} required /></Field>
            </div><p className="mt-3 text-xs leading-5 text-[#777257]">Use the customer’s actual cumulative charges where available. For a new customer, total charges may be 0.</p></section>

            {error && <div role="alert" className="mb-4 break-words rounded-sm border border-red-500/30 bg-red-500/10 p-4 text-sm text-[#b83f31]">{error}</div>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-sm bg-[#315c45] px-5 py-4 font-bold text-[#f7efd9] shadow-lg shadow-[#17664f]/10 transition hover:bg-[#264a36] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Analyzing customer…</> : "Run churn prediction →"}</button>
            <p className="mt-3 text-center text-xs text-[#777257]">Predictions are estimates and should support—not replace—business judgment.</p>
          </form>

          <aside className="space-y-6">
            <section className="overflow-hidden rounded-sm border-2 border-[#315c45] bg-[#f7efd9] shadow-[5px_5px_0_rgba(49,92,69,0.16)]"><div className="border-b border-[#b7ad91] p-5 sm:p-6"><p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#315c45]">SIGNAL OUTPUT</p><h2 className="mt-2 text-xl font-bold">Prediction result</h2></div><div className="p-5 sm:p-6">
              {!result && !loading && <div className="rounded-sm border border-dashed border-[#d6d2c7] bg-[#eee4ce] px-5 py-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-sm bg-[#315c45]/10 text-3xl text-[#315c45]">◎</div><p className="mt-4 font-semibold">Ready to analyze</p><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#777257]">Submit the customer profile to view the model’s churn estimate.</p></div>}
              {loading && <div className="animate-pulse rounded-sm bg-[#eee4ce] p-8 text-center text-sm text-[#315c45]">Processing customer features…</div>}
              {result && <div><div className="rounded-sm border border-[#b7ad91] bg-[#eee4ce] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-[#5d604b]">Estimated churn probability</p><p className="mt-2 text-5xl font-black tracking-tight text-[#24271d]">{probability.toFixed(1)}<span className="text-2xl text-[#5d604b]">%</span></p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${result.prediction === "Yes" ? "bg-[#c94c3b]/10 text-[#b83f31] ring-1 ring-[#c94c3b]/20" : "bg-[#315c45]/10 text-[#315c45] ring-1 ring-[#315c45]/20"}`}>{result.prediction === "Yes" ? "Churn flagged" : "Not flagged"}</span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e7e3d9]"><div className="h-full rounded-full bg-gradient-to-r from-[#17664f] to-[#c65b36] transition-all duration-700" style={{ width: `${probability}%` }} /></div><div className="mt-2 flex justify-between text-xs text-[#777257]"><span>0%</span><span>Threshold {thresholdLabel}</span><span>100%</span></div></div>
                <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-sm border border-[#b7ad91] bg-[#eee4ce] p-4"><p className="text-xs text-[#777257]">Risk category</p><p className={`mt-2 text-xl font-bold ${result.risk_level === "High" ? "text-[#b83f31]" : "text-[#315c45]"}`}>{result.risk_level}</p></div><div className="rounded-sm border border-[#b7ad91] bg-[#eee4ce] p-4"><p className="text-xs text-[#777257]">Record ID</p><p className="mt-2 text-xl font-bold text-[#24271d]">#{result.id}</p></div></div>
                <div className="mt-4 rounded-sm border border-[#b7ad91] p-4"><p className="font-semibold">Suggested follow-up</p><p className="mt-2 text-sm leading-6 text-[#5d604b]">{result.prediction === "Yes" ? "Review contract type, billing experience and service needs before selecting an appropriate retention action." : "Continue routine engagement and monitor customer satisfaction and service usage."}</p></div><p className="mt-3 text-xs text-[#777257]">Saved to PostgreSQL · {formatDate(result.created_at)}</p>
              </div>}
            </div></section>

            <section className="rounded-sm border-2 border-[#315c45] bg-[#f7efd9] p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#315c45]">SYSTEM REGISTER</p><h3 className="mt-2 text-lg font-bold">Model information</h3></div><span className="rounded-sm border border-[#d6d2c7] bg-[#eee4ce] px-3 py-2 text-xs font-semibold text-[#3d4332]">ML</span></div><div className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4"><span className="text-[#777257]">Algorithm</span><span className="text-right font-medium">Logistic Regression</span></div><div className="flex justify-between gap-4"><span className="text-[#777257]">Input features</span><span className="font-medium">19</span></div><div className="flex justify-between gap-4"><span className="text-[#777257]">Decision threshold</span><span className="font-medium">{thresholdLabel}</span></div><div className="flex justify-between gap-4"><span className="text-[#777257]">Backend</span><span className="font-medium">FastAPI</span></div><div className="flex justify-between gap-4"><span className="text-[#777257]">Persistence</span><span className="font-medium">PostgreSQL</span></div></div></section>
          </aside>
        </div>

        <section className="mt-7 rounded-sm border border-[#b7ad91] bg-[#f7efd9] p-5 shadow-[4px_4px_0_rgba(49,92,69,0.08)] sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#315c45]">TRANSMISSION LOG</p><h2 className="mt-2 text-xl font-bold">Recent prediction history</h2><p className="mt-1 text-sm text-[#777257]">The latest saved predictions from your API.</p></div><button type="button" onClick={() => void loadHistory()} disabled={historyLoading} className="rounded-sm border border-[#d6d2c7] px-4 py-2.5 text-sm font-semibold text-[#3d4332] transition hover:border-[#315c45] hover:text-[#315c45] disabled:opacity-50">{historyLoading ? "Refreshing…" : "↻ Refresh"}</button></div>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-[#b7ad91] font-mono text-xs uppercase tracking-wider text-[#777257]"><th className="px-3 py-3 font-semibold">Customer</th><th className="px-3 py-3 font-semibold">Prediction</th><th className="px-3 py-3 font-semibold">Probability</th><th className="px-3 py-3 font-semibold">Risk</th><th className="px-3 py-3 font-semibold">Created</th></tr></thead><tbody>
            {historyLoading ? <tr><td colSpan={5} className="px-3 py-8 text-center text-[#777257]">Loading prediction history…</td></tr> : history.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-[#777257]">No saved predictions yet. Run a prediction to populate this table.</td></tr> : history.map((item) => <tr key={item.id} className="border-b border-[#b7ad91]/70 last:border-0 hover:bg-[#e7dcc0]"><td className="px-3 py-4 font-semibold text-[#24271d]">{item.customer_id}</td><td className="px-3 py-4">{item.prediction === "Yes" ? "Churn" : "No churn"}</td><td className="px-3 py-4 tabular-nums">{(item.churn_probability * 100).toFixed(1)}%</td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.risk_level === "High" ? "bg-[#c94c3b]/10 text-[#b83f31]" : "bg-[#315c45]/10 text-[#315c45]"}`}>{item.risk_level}</span></td><td className="px-3 py-4 text-xs text-[#777257]">{formatDate(item.created_at)}</td></tr>)}
          </tbody></table></div>
        </section>

        <footer className="mt-8 flex flex-col gap-2 border-t border-[#b7ad91] pt-5 text-xs text-[#777257] sm:flex-row sm:items-center sm:justify-between"><span>TelcoIQ · Customer churn analytics</span><span>Predictions are estimates, not guarantees of future behavior.</span></footer>
      </div>
    </main>
  );
}