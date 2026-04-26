export interface PortalData {
  account: {
    email: string;
    profile_name: string;
    expired_at: string;
  };
  messages: Array<{
    id: string;
    subject: string;
    email_date: string;
    parsed_context: string;
    parsed_data: string;
  }>;
  limit: {
    remaining: number;
    total: number;
  };
}

export function PortalServiceGenerator(apiUrl: string, tenantId: string) {
  const getPortalData = async (token: string): Promise<PortalData> => {
    const response = await fetch(`${apiUrl}/public/email-access/${token}`, {
      headers: {
        'x-tenant-id': tenantId,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Gagal memuat data portal' }));
      throw new Error(error.message || 'Gagal memuat data portal');
    }
    
    return response.json();
  };

  return {
    getPortalData,
  };
}
