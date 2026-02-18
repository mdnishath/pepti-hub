import QRCode from 'qrcode';

export interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export class QRCodeService {
  /**
   * Generate QR code as data URL (base64 image)
   */
  async generateQRCodeDataURL(
    data: string,
    options?: QRCodeOptions
  ): Promise<string> {
    try {
      const qrOptions = {
        errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
        type: 'image/png' as const,
        width: options?.width || 300,
        margin: options?.margin || 2,
        color: {
          dark: options?.color?.dark || '#000000',
          light: options?.color?.light || '#FFFFFF'
        }
      };

      const dataURL = await QRCode.toDataURL(data, qrOptions);
      return dataURL;
    } catch (error) {
      console.error('[QRCodeService] Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code as SVG string
   */
  async generateQRCodeSVG(
    data: string,
    options?: QRCodeOptions
  ): Promise<string> {
    try {
      const qrOptions = {
        errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
        type: 'svg' as const,
        width: options?.width || 300,
        margin: options?.margin || 2,
        color: {
          dark: options?.color?.dark || '#000000',
          light: options?.color?.light || '#FFFFFF'
        }
      };

      const svg = await QRCode.toString(data, qrOptions);
      return svg;
    } catch (error) {
      console.error('[QRCodeService] Error generating QR code SVG:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }

  /**
   * Generate payment QR code with formatted payment URI
   * Format: ethereum:{address}?value={amount}&token={tokenAddress}
   */
  generatePaymentQRData(params: {
    address: string;
    amount: string;
    tokenAddress: string;
    chainId?: number;
  }): string {
    const { address, amount, tokenAddress, chainId } = params;

    // Create EIP-681 payment URI
    // Format: ethereum:{address}@{chainId}/transfer?address={token}&uint256={amount}
    const uri = chainId
      ? `ethereum:${address}@${chainId}/transfer?address=${tokenAddress}&uint256=${amount}`
      : `ethereum:${address}/transfer?address=${tokenAddress}&uint256=${amount}`;

    return uri;
  }

  /**
   * Generate simple address QR code
   */
  async generateAddressQRCode(
    address: string,
    options?: QRCodeOptions
  ): Promise<string> {
    return this.generateQRCodeDataURL(address, options);
  }

  /**
   * Generate payment QR code with all payment details
   */
  async generatePaymentQRCode(params: {
    address: string;
    amount: string;
    tokenAddress: string;
    chainId?: number;
    options?: QRCodeOptions;
  }): Promise<string> {
    const paymentData = this.generatePaymentQRData({
      address: params.address,
      amount: params.amount,
      tokenAddress: params.tokenAddress,
      chainId: params.chainId
    });

    return this.generateQRCodeDataURL(paymentData, params.options);
  }
}
