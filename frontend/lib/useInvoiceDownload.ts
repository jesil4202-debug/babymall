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
    toast.success('Invoice download started');
  } catch (error) {
    console.error('❌ Invoice download error:', error);
    toast.error('Failed to download invoice');
  }
};
