// Types for the vendored adz kit (vendor/adz-next-1.0.0.tgz), which ships plain JS.
declare module "@adz/next/middleware" {
  export function adzMiddleware(
    request: Request,
    options?: { prefix?: string; channelLinks?: boolean; debug?: boolean }
  ): Promise<Response | undefined>;
}

declare module "@adz/next/health" {
  export function GET(): Promise<Response>;
  export function POST(request: Request): Promise<Response>;
}

declare module "@adz/next" {
  export type Attribution = { code: string | null; source: "tiktok" | "instagram" | null };
  export type CodeCheck = {
    valid: boolean;
    code: string | null;
    discount_pct?: number | null;
    kind?: string | null;
    bogo_rule?: unknown;
    expires_at?: string | null;
    reason?: string | null;
  };
  export function readAttribution(source: unknown): Attribution;
  export function attributionMetadata(source: unknown): Record<string, string>;
  export function validateCode(code: string | null | undefined, options?: { fresh?: boolean }): Promise<CodeCheck>;
  export function trackOrder(order: Record<string, unknown>): Promise<unknown>;
  export function trackRefund(refund: { orderId: string; amount?: number; totalRefunded?: number; refundId?: string; reason?: string }): Promise<unknown>;
  export function trackCancel(cancel: { orderId: string; reason?: string }): Promise<unknown>;
}
