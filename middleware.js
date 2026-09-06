export const config = {
  matcher: ["/Mubaddil-Setup.exe", "/files/Mubaddil-Setup.exe"],
};

function hexFromBuffer(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return hexFromBuffer(signature);
}

function timingSafeEqualHex(left, right) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyDownloadToken(token, secret) {
  if (!token || !secret) return false;
  const parts = String(token).split(".");
  if (parts.length !== 3) return false;
  const [orderId, expRaw, sig] = parts;
  if (!/^[A-Za-z0-9_-]+$/.test(orderId)) return false;
  const exp = Number.parseInt(expRaw, 10);
  if (!Number.isInteger(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmacSha256Hex(secret, `${orderId}.${exp}`);
  return timingSafeEqualHex(expected, sig);
}

export default async function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname === "/Mubaddil-Setup.exe") {
    return Response.redirect(new URL("/#download", request.url), 302);
  }

  const token = url.searchParams.get("token") || "";
  const secret = process.env.DOWNLOAD_TOKEN_SECRET || process.env.PAYMOB_HMAC_SECRET || "";
  const allowed = await verifyDownloadToken(token, secret);
  if (!allowed) {
    return new Response("Payment required", {
      status: 401,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
  return undefined;
}
