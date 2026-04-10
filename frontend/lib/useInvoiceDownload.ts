import toast from 'react-hot-toast';

/**
 * Hook to handle invoice download with authentication
 * @param apiUrl - Base API URL (usually process.env.NEXT_PUBLIC_API_URL)
 */
export const useInvoiceDownload = (apiUrl: string) => {
  const downloadInvoice = async (orderId: string, orderNumber?: string) => {
    try {
      const invoiceUrl = `${apiUrl}/api/invoice/${orderId}`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('bm_token') : null;

      if (!token) {
        toast.error('Not authorized. Please login.');
        return;
      }

      console.log(`📥 Requesting invoice for order: ${orderId}`);

      // Fetch the invoice PDF with Authorization header
      const response = await fetch(invoiceUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Handle authorization errors
      if (response.status === 401) {
        console.error('❌ Authorization failed - invalid or expired token');
        toast.error('Authorization expired. Please login again.');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('bm_token');
          window.location.href = '/auth/login';
        }
        return;
      }

      // Handle not found or other errors
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Invoice download error:', errorData);
        toast.error(errorData.message || 'Failed to download invoice');
        return;
      }

      // Convert response to blob
      const blob = await response.blob();

      // Create blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `invoice-${orderNumber || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      console.log(`✅ Invoice downloaded: invoice-${orderNumber || orderId}.pdf`);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('❌ Invoice download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  return { downloadInvoice };
};

/**
 * Server-side safe download function (for use in components)
 */
export const downloadOrderInvoice = async (
  orderId: string,
  apiUrl: string,
  orderNumber?: string
) => {
  try {
    // Ensure we're on client-side
    if (typeof window === 'undefined') {
      console.error('❌ [Invoice] Not on client-side');
      toast.error('Please try again');
      return;
    }

    // Validate inputs
    if (!orderId) {
      console.error('❌ [Invoice] Order ID missing');
      toast.error('Invalid order');
      return;
    }

    if (!apiUrl) {
      console.error('❌ [Invoice] API URL not configured:', process.env.NEXT_PUBLIC_API_URL);
      toast.error('Configuration error');
      return;
    }

    // Build correct URL
    const invoiceUrl = apiUrl.endsWith('/api') 
      ? `${apiUrl}/invoice/${orderId}`
      : `${apiUrl}/api/invoice/${orderId}`;
    
    console.log('🔍 [Invoice URL]', invoiceUrl);

    // Get token
    let token: string | null = null;
    try {
      token = localStorage.getItem('bm_token');
      console.log('🔑 [Token found]', token ? 'YES ✅' : 'NO ❌');
    } catch (err) {
      console.error('❌ [localStorage] Access failed:', err);
      toast.error('Session error. Please login again.');
      return;
    }

    if (!token) {
      console.error('❌ [Token] Missing - user must login');
      toast.error('Not authorized. Please login.');
      return;
    }

    console.log('📤 [Request] Sending Authorization header...');
    console.log('📝 [Header] Authorization: Bearer ' + token.substring(0, 20) + '...');

    // CRITICAL: Include credentials and Authorization header
    const response = await fetch(invoiceUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf',
      },
    });

    console.log('📊 [Response] Status:', response.status);

    if (response.status === 401) {
      console.error('❌ [Auth] 401 Unauthorized');
      toast.error('Authorization expired. Please login again.');
      localStorage.removeItem('bm_token');
      window.location.href = '/auth/login';
      return;
    }

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ [Error]', error);
      toast.error('Failed to download invoice');
      return;
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `invoice-${orderNumber || orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    console.log('✅ [Success] Invoice downloaded');
    toast.success('Invoice downloaded successfully');
  } catch (error) {
    console.error('❌ [Fatal Error]', error);
    toast.error('Failed to download invoice');
  }
};
