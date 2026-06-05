export async function getLocationFromIp(ip: string): Promise<string> {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'Unknown') {
    return ip;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json() as any;
      if (data.status === 'success') {
        return `${ip} (${data.city}, ${data.regionName})`;
      }
    }
  } catch (error) {
    // Silently ignore geolocation errors to not block login
  }
  
  return ip;
}
