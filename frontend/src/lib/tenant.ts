const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "marl.com";

export function getBusinessSlugFromHost(host: string) {
  const cleanHost = host.split(":")[0].toLowerCase();

  if (cleanHost === "localhost" || cleanHost === "127.0.0.1") {
    return null;
  }

  if (!cleanHost.endsWith(ROOT_DOMAIN)) {
    return null;
  }

  const subdomain = cleanHost.replace(`.${ROOT_DOMAIN}`, "");

  if (!subdomain || subdomain === "www" || subdomain === ROOT_DOMAIN) {
    return null;
  }

  return subdomain;
}

export function queuePublicUrl(queueSlug: string, businessSlug?: string | null) {
  if (typeof window === "undefined") {
    return `/q/${queueSlug}`;
  }

  const protocol = window.location.protocol;
  const host = window.location.host;

  if (businessSlug && !host.startsWith(`${businessSlug}.`)) {
    return `${protocol}//${businessSlug}.${ROOT_DOMAIN}/q/${queueSlug}`;
  }

  return `${protocol}//${host}/q/${queueSlug}`;
}
