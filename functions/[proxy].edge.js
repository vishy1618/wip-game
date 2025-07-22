export default async function handler(request, context) {
  // Define your whitelisted IPs
  const allowedIPs = ["58.84.60.21"]; // Replace with your actual allowed IP addresses

  // Get the client's IP address (as sent by the platform)
  const clientIP = request.headers.get("x-forwarded-for") || "";
  const clientIPList = clientIP.split(",").map(ip => ip.trim()); // handle multiple IPs (proxies etc)

  // Check if any forwarded IP is in the allowed list
  const allowed = clientIPList.some(ip => allowedIPs.includes(ip));
  if (!allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  // Continue with normal logic if IP is allowed
  // ... your normal edge function logic here ...
  return fetch(request);
}