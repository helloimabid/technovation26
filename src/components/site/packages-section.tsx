"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getAccount } from "@/lib/appwrite/client";
import { Package, Purchase, Segment } from "@/types/models";

type PackagesSectionProps = {
  packages: Package[];
  segments: Segment[];
  onPurchaseSuccess?: (purchase: Purchase) => void;
};

export function PackagesSection({ packages, segments, onPurchaseSuccess }: PackagesSectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);
  const [checkoutPackageId, setCheckoutPackageId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await getAccount().get();
        if (!mounted) return;

        setIsAuthenticated(true);
        const purchasesRes = await fetch("/api/purchases");
        if (purchasesRes.ok) {
          const purchaseData = (await purchasesRes.json()) as Purchase[];
          if (mounted) {
            setPurchases(Array.isArray(purchaseData) ? purchaseData : []);
          }
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
          setPurchases([]);
        }
      } finally {
        if (mounted) {
          setLoadingAuth(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const buyPackage = async (pack: Package) => {
    try {
      setBuyingPackageId(pack.$id);

      if (!isAuthenticated) {
        toast.error("Please login to buy a package.");
        window.location.href = "/login";
        return;
      }

      const needsTransaction = Number(pack.price) > 0;
      const trimmedTransactionId = transactionId.trim();

      if (needsTransaction && trimmedTransactionId.length < 6) {
        toast.error("Please provide a valid bKash transaction ID.");
        return;
      }

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pack.$id,
          paymentTransactionId: needsTransaction ? trimmedTransactionId : "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to purchase package");
      }

      toast.success("Package purchased. Awaiting admin approval.");
      const purchase = data as Purchase;
      setPurchases((prev) => [...prev, purchase]);
      setCheckoutPackageId(null);
      setTransactionId("");
      onPurchaseSuccess?.(purchase);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to purchase package");
    } finally {
      setBuyingPackageId(null);
    }
  };

  if (packages.length === 0) {
    return null;
  }

  return (
    <section className="py-14 md:py-16 px-6 md:px-12 border-b border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-[var(--font-anton)] uppercase tracking-wider text-white">
            Package Deals
          </h2>
          <p className="text-white/70 mt-3 max-w-2xl mx-auto">
            Buy one package and use it across multiple included segments at a lower combined cost.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((pack) => {
            const includedIds = Array.isArray(pack.includedSegmentIds) ? pack.includedSegmentIds : [];
            const includedSegments = segments.filter((segment) => includedIds.includes(segment.$id));
            const combinedCost = includedSegments.reduce((sum, segment) => sum + Number(segment.fee ?? 0), 0);
            const savings = combinedCost > pack.price ? combinedCost - pack.price : 0;
            const userPurchase = purchases.find((p) => p.packageId === pack.$id);
            const purchaseStatus = userPurchase?.status;
            const isPurchased = !!userPurchase;
            const isApproved = purchaseStatus === "approved";
            const isPending = purchaseStatus === "pending";
            const isRejected = purchaseStatus === "rejected";
            const isBusy = buyingPackageId === pack.$id;
            const isCheckoutOpen = checkoutPackageId === pack.$id;
            const needsTransaction = Number(pack.price) > 0;

            let buttonText = "Checkout";
            let buttonDisabled = loadingAuth || isPurchased || isBusy;
            if (isPurchased) {
              if (isApproved) buttonText = "Approved ✓";
              else if (isPending) buttonText = "Pending";
              else if (isRejected) buttonText = "Rejected ✗";
              buttonDisabled = true;
            }

            const canSubmit =
              !loadingAuth &&
              !isPurchased &&
              !isBusy &&
              (!needsTransaction || transactionId.trim().length >= 6);

            return (
              <article
                key={pack.$id}
                className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 flex flex-col gap-4"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">{pack.name}</h3>
                  <p className="text-[#6972fd] font-[var(--font-anton)] text-2xl">{pack.price} BDT</p>

                  {isPurchased && (
                    <div className={`text-xs font-bold uppercase tracking-wider ${isApproved ? "text-emerald-400" : isPending ? "text-yellow-400" : "text-red-400"}`}>
                      Status: {isApproved ? "Approved" : isPending ? "Pending Admin Approval" : "Rejected"}
                    </div>
                  )}

                  {includedSegments.length > 0 ? (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/50 mb-2">
                        Includes Segments
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {includedSegments.map((segment) => (
                          <span
                            key={`${pack.$id}-${segment.$id}`}
                            className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-white/75"
                          >
                            {segment.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {savings > 0 ? (
                    <p className="text-xs text-emerald-300">
                      Bundle savings: {savings} BDT compared to segment total
                    </p>
                  ) : null}

                  <p className="text-sm text-white/65 pt-1">{pack.benefits}</p>
                </div>

                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Please login to continue checkout.");
                      window.location.href = "/login";
                      return;
                    }
                    if (isPurchased) {
                      toast.info(`Purchase is ${purchaseStatus}`);
                      return;
                    }
                    setCheckoutPackageId((prev) => (prev === pack.$id ? null : pack.$id));
                    setTransactionId("");
                  }}
                  disabled={buttonDisabled}
                  className="mt-1 w-full rounded-xl bg-white/5 hover:bg-[#6972fd] border border-white/10 text-white/80 hover:text-white py-3 text-xs font-bold uppercase tracking-[0.16em] transition disabled:opacity-40 disabled:hover:bg-white/5"
                >
                  {buttonText}
                </button>

                {isCheckoutOpen && !isPurchased ? (
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-white/60">Package Checkout</p>
                    {needsTransaction ? (
                      <>
                        <p className="text-xs text-white/70">
                          Send <span className="font-semibold text-white">{pack.price} BDT</span> to bKash number:
                          <span className="ml-1 font-semibold text-[#8dd8ff]">
                            {pack.bkashNumber || "Not configured"}
                          </span>
                        </p>
                        <input
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="Enter bKash transaction ID"
                          className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40"
                        />
                      </>
                    ) : (
                      <p className="text-xs text-white/70">
                        This package is free. Confirm checkout to complete the purchase.
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => buyPackage(pack)}
                        disabled={!canSubmit}
                        className="flex-1 rounded-lg bg-[#6972fd] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-40"
                      >
                        {isBusy ? "Processing..." : "Confirm Purchase"}
                      </button>
                      <button
                        onClick={() => {
                          setCheckoutPackageId(null);
                          setTransactionId("");
                        }}
                        disabled={isBusy}
                        className="rounded-lg border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/80 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}