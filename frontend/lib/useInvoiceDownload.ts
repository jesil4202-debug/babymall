import toast from 'react-hot-toast';

/**
 * Hook to handle invoice download
 * @param apiUrl - Base API URL (usually process.env.NEXT_PUBLIC_API_URL)
 */
export const useInvoiceDownload = (apiUrl: string) => {
  const downloadInvoice = async (orderId: string, orderNumber?: string) => {
    try {
      const invoiceUrl = `${apiUrl}/api/invoice/${orderId}`;

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = invoiceUrl;
      link.download = `invoice-${orderNumber || orderId}.pdf`;
      link.target = '_blank';

      // Trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Invoice download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  return { downloadInvoice };
};

/**
 * Alternative: Direct download function (without hook)
 */
export const downloadOrderInvoice = (orderId: string, apiUrl: string, orderNumber?: string) => {
  try {
    const invoiceUrl = `${apiUrl}/api/invoice/${orderId}`;
    window.open(invoiceUrl, '_blank');
    toast.success('Invoice download started');
  } catch (error) {
    console.error('Invoice download error:', error);
    toast.error('Failed to download invoice');
  }
};
