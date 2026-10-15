"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useAccount, updateAccount } from "../lib/demo/store";
import { parseMinor } from "../lib/demo/account";
import { money } from "./dialog";
import { parseRequest } from "../lib/demo/request";
export default function PixRequest({
  prefill,
  mode = "receive",
  onRequestQr,
}: {
  prefill: (name: string, amount: string, key: string) => void;
  mode?: "receive" | "qr";
  onRequestQr?: () => void;
}) {
  const { profile, requests } = useAccount();
  const [amount, setAmount] = useState(""),
    [svg, setSvg] = useState(""),
    [payload, setPayload] = useState(""),
    [importCode, setImportCode] = useState(""),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    if (!payload) {
      setSvg("");
      return;
    }
    import("qrcode")
      .then((q) =>
        q.toString(payload, {
          type: "svg",
          margin: 2,
          width: 240,
          errorCorrectionLevel: "M",
        }),
      )
      .then((text) => {
        if (active) setSvg(text);
      })
      .catch(() => setError("QR generation failed."));
    return () => {
      active = false;
    };
  }, [payload]);
  function create() {
    try {
      const value = parseMinor(amount);
      const request = {
        id: crypto.randomUUID(),
        name: profile.name,
        key: profile.pixKey,
        amount: value,
        createdAt: new Date().toISOString(),
      };
      const code = `fluxo-demo:${encodeURIComponent(JSON.stringify(request))}`;
      updateAccount((a) => ({
        ...a,
        requests: [request, ...a.requests].slice(0, 50),
      }));
      setPayload(code);
      setCopied(false);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid amount.");
    }
  }
  function importRequest() {
    try {
      const data = parseRequest(importCode);
      setError("");
      prefill(data.name, (data.amount / 100).toFixed(2), data.key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid request code.");
    }
  }
  if (mode === "receive")
    return (
      <div className="receive-box">
        <h3>Your demo receiving key</h3>
        <p>
          Share this sandbox key, or create a request with an amount in the QR
          Code tab. It cannot receive real bank payments.
        </p>
        <label className="field">
          Demo Pix key
          <input
            readOnly
            value={profile.pixKey}
            onFocus={(e) => e.target.select()}
          />
        </label>
        <button
          className="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(profile.pixKey);
              setCopied(true);
              setError("");
            } catch {
              setError("Copy unavailable. Select and copy the key above.");
            }
          }}
        >
          {copied ? "Key copied" : "Copy demo key"}
        </button>
        <button className="primary" onClick={onRequestQr}>
          Create a demo QR request
        </button>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  return (
    <div className="receive-box">
      <h3>Create a demo QR request</h3>
      <p>
        Create a scannable request with an amount, or import someone else’s
        Fluxo request for review. These codes do not work in banking apps.
      </p>
      <label className="field">
        Requested amount (BRL)
        <input
          placeholder="0,00"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <button className="primary" onClick={create}>
        Generate request QR
      </button>
      {svg && (
        <div className="qr-image">
          <Image
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
            alt="Scannable Fluxo demo payment request"
            width={240}
            height={240}
            unoptimized
          />
        </div>
      )}
      {payload && (
        <>
          <button
            className="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(payload);
                setCopied(true);
              } catch {
                setError("Copy unavailable. Select the code below.");
              }
            }}
          >
            {copied ? "Copied" : "Copy request code"}
          </button>
          <textarea
            aria-label="Generated request code"
            readOnly
            value={payload}
          />
          <small>
            Scan with a QR reader to copy the request. Import it into Fluxo
            below. This is not a bank Pix QR.
          </small>
        </>
      )}
      <div className="request-import">
        <h3>Pay a demo request</h3>
        <label className="field">
          Request code
          <textarea
            placeholder="fluxo-demo:..."
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
          />
        </label>
        <button className="secondary" onClick={importRequest}>
          Import request for review
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {requests.length > 0 && (
        <div className="request-history">
          <h3>Recent requests</h3>
          {requests.slice(0, 3).map((r) => (
            <div key={r.id}>
              <span>{money(r.amount)}</span>
              <small>{new Date(r.createdAt).toLocaleDateString("pt-BR")}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
