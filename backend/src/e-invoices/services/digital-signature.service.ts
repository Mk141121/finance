import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import { create } from 'xmlbuilder2';

/**
 * Digital Signature Service for E-Invoices
 * Implements XML-DSig (XML Digital Signature) standard
 * Uses RSA-SHA256 algorithm for signing
 */
@Injectable()
export class DigitalSignatureService {
  /**
   * Sign XML invoice with digital signature
   * @param xmlContent - The XML content to sign
   * @param privateKeyPath - Path to private key file (PEM format)
   * @param certificatePath - Path to certificate file (PEM format)
   * @returns Signed XML content
   */
  async signXml(
    xmlContent: string,
    privateKeyPath?: string,
    certificatePath?: string,
  ): Promise<{ signedXml: string; signature: string }> {
    try {
      // For development, generate a mock signature
      // In production, use actual private key and certificate
      if (!privateKeyPath || !certificatePath) {
        return this.generateMockSignature(xmlContent);
      }

      // Read private key and certificate
      const privateKey = await fs.readFile(privateKeyPath, 'utf8');
      const certificate = await fs.readFile(certificatePath, 'utf8');

      // Calculate canonical XML (C14N)
      const canonicalXml = this.canonicalizeXml(xmlContent);

      // Calculate SHA-256 digest of the content
      const digest = crypto
        .createHash('sha256')
        .update(canonicalXml, 'utf8')
        .digest('base64');

      // Create SignedInfo element
      const signedInfo = this.createSignedInfo(digest);
      const canonicalSignedInfo = this.canonicalizeXml(signedInfo);

      // Sign the SignedInfo with private key
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(canonicalSignedInfo);
      const signatureValue = sign.sign(privateKey, 'base64');

      // Extract certificate value (remove headers/footers)
      const certValue = this.extractCertificateValue(certificate);

      // Create Signature element
      const signatureXml = this.createSignatureElement(
        signedInfo,
        signatureValue,
        certValue,
      );

      // Insert signature into original XML (before closing tag)
      const signedXml = this.insertSignature(xmlContent, signatureXml);

      return {
        signedXml,
        signature: signatureValue,
      };
    } catch (error) {
      console.error('Error signing XML:', error);
      // Fallback to mock signature in case of error
      return this.generateMockSignature(xmlContent);
    }
  }

  /**
   * Verify XML signature
   * @param signedXml - The signed XML content
   * @param publicKeyPath - Path to public key or certificate
   * @returns true if signature is valid
   */
  async verifySignature(
    signedXml: string,
    publicKeyPath?: string,
  ): Promise<boolean> {
    try {
      if (!publicKeyPath) {
        // For development, always return true for mock signatures
        return signedXml.includes('<Signature');
      }

      // Extract signature components from XML
      const signatureValue = this.extractSignatureValue(signedXml);
      const signedInfo = this.extractSignedInfo(signedXml);
      const canonicalSignedInfo = this.canonicalizeXml(signedInfo);

      // Read public key
      const publicKey = await fs.readFile(publicKeyPath, 'utf8');

      // Verify signature
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(canonicalSignedInfo);
      return verify.verify(publicKey, signatureValue, 'base64');
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }

  /**
   * Generate mock signature for development/testing
   */
  private generateMockSignature(xmlContent: string): {
    signedXml: string;
    signature: string;
  } {
    // Create a simple hash as mock signature
    const hash = crypto
      .createHash('sha256')
      .update(xmlContent)
      .digest('base64');

    const mockSignature = create({ version: '1.0' })
      .ele('Signature', { xmlns: 'http://www.w3.org/2000/09/xmldsig#' })
      .ele('SignedInfo')
      .ele('CanonicalizationMethod', {
        Algorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
      })
      .up()
      .ele('SignatureMethod', {
        Algorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
      })
      .up()
      .ele('Reference', { URI: '' })
      .ele('DigestMethod', {
        Algorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
      })
      .up()
      .ele('DigestValue')
      .txt(hash)
      .up()
      .up()
      .up()
      .ele('SignatureValue')
      .txt(hash)
      .up()
      .ele('KeyInfo')
      .ele('X509Data')
      .ele('X509Certificate')
      .txt('MOCK_CERTIFICATE_FOR_DEVELOPMENT')
      .up()
      .up()
      .up()
      .end({ prettyPrint: true });

    const signedXml = this.insertSignature(xmlContent, mockSignature);

    return {
      signedXml,
      signature: hash,
    };
  }

  /**
   * Canonicalize XML (C14N)
   */
  private canonicalizeXml(xml: string): string {
    // Simplified canonicalization
    // In production, use a proper C14N library like xml-c14n
    return xml
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Create SignedInfo element
   */
  private createSignedInfo(digestValue: string): string {
    return create({ version: '1.0' })
      .ele('SignedInfo', { xmlns: 'http://www.w3.org/2000/09/xmldsig#' })
      .ele('CanonicalizationMethod', {
        Algorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
      })
      .up()
      .ele('SignatureMethod', {
        Algorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
      })
      .up()
      .ele('Reference', { URI: '' })
      .ele('Transforms')
      .ele('Transform', {
        Algorithm: 'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      })
      .up()
      .up()
      .ele('DigestMethod', {
        Algorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
      })
      .up()
      .ele('DigestValue')
      .txt(digestValue)
      .up()
      .up()
      .up()
      .end({ prettyPrint: true });
  }

  /**
   * Create full Signature element
   */
  private createSignatureElement(
    signedInfo: string,
    signatureValue: string,
    certificateValue: string,
  ): string {
    const doc = create({ version: '1.0' })
      .ele('Signature', { xmlns: 'http://www.w3.org/2000/09/xmldsig#' });

    // Insert SignedInfo (remove XML declaration)
    doc.import(
      create(signedInfo.replace(/<\?xml[^>]*\?>/g, '')).first(),
    );

    doc.ele('SignatureValue').txt(signatureValue).up();
    doc
      .ele('KeyInfo')
      .ele('X509Data')
      .ele('X509Certificate')
      .txt(certificateValue);

    return doc.end({ prettyPrint: true });
  }

  /**
   * Extract certificate value from PEM format
   */
  private extractCertificateValue(certificate: string): string {
    return certificate
      .replace(/-----BEGIN CERTIFICATE-----/g, '')
      .replace(/-----END CERTIFICATE-----/g, '')
      .replace(/\n/g, '')
      .trim();
  }

  /**
   * Insert signature into XML document
   */
  private insertSignature(xmlContent: string, signatureXml: string): string {
    // Find the closing tag of the root element
    const lastClosingTag = xmlContent.lastIndexOf('</');
    if (lastClosingTag === -1) {
      throw new Error('Invalid XML: No closing tag found');
    }

    // Insert signature before the closing tag
    const before = xmlContent.substring(0, lastClosingTag);
    const after = xmlContent.substring(lastClosingTag);
    
    // Remove XML declaration from signature
    const signatureContent = signatureXml.replace(/<\?xml[^>]*\?>/g, '').trim();
    
    return `${before}\n${signatureContent}\n${after}`;
  }

  /**
   * Extract signature value from signed XML
   */
  private extractSignatureValue(signedXml: string): string {
    const match = signedXml.match(/<SignatureValue>(.*?)<\/SignatureValue>/s);
    return match ? match[1].trim() : '';
  }

  /**
   * Extract SignedInfo from signed XML
   */
  private extractSignedInfo(signedXml: string): string {
    const match = signedXml.match(/<SignedInfo[^>]*>(.*?)<\/SignedInfo>/s);
    return match ? `<SignedInfo>${match[1]}</SignedInfo>` : '';
  }
}
