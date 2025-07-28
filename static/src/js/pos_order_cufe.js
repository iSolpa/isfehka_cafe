/** @odoo-module */

import { PosOrder } from "@point_of_sale/app/models/pos_order";
import { patch } from "@web/core/utils/patch";

console.log("[ISFEHKA CAFE] Loading model patches for Odoo 18");

patch(PosOrder.prototype, {
    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        console.log("[ISFEHKA CAFE] Exporting order as JSON:", {
            orderName: this.name,
            hasCufe: !!this.hka_cufe
        });
        
        if (this.hka_cufe) {
            console.log("[ISFEHKA CAFE] Including CUFE data in export for order:", this.name);
            json.hka_cufe = this.hka_cufe;
            json.hka_cufe_qr = this.hka_cufe_qr;
        }
        return json;
    },

    init_from_JSON(json) {
        console.log("[ISFEHKA CAFE] Initializing order from JSON:", {
            orderName: json.name,
            hasCufe: !!json.hka_cufe
        });
        
        super.init_from_JSON(...arguments);
        if (json.hka_cufe) {
            console.log("[ISFEHKA CAFE] Found CUFE data in JSON for order:", json.name);
            this.hka_cufe = json.hka_cufe;
            this.hka_cufe_qr = json.hka_cufe_qr;
        }
    },

    export_for_printing() {
        const result = super.export_for_printing(...arguments);
        
        // Add CUFE data to result for JavaScript-based injection
        if (this.hka_cufe) {
            result.hka_cufe = this.hka_cufe;
            
            // Format QR code with proper data URL prefix
            if (this.hka_cufe_qr) {
                result.hka_cufe_qr = `data:image/png;base64,${this.hka_cufe_qr}`;
            }
            
            // Inject CAFE section into receipt HTML
            if (result.receipt_html) {
                const cafeHtml = this._generateCafeHtml();
                // Insert CAFE section before the closing div of pos-receipt
                result.receipt_html = result.receipt_html.replace(
                    /<\/div>\s*<\/div>\s*$/,
                    cafeHtml + '</div></div>'
                );
            }
            
            console.log("[ISFEHKA CAFE] Added CUFE data for order:", this.name);
        }
        
        console.log("[ISFEHKA CAFE] Export for printing:", {
            orderName: this.name,
            hasCufe: !!this.hka_cufe,
            hasQrCode: !!this.hka_cufe_qr
        });
        
        return result;
    },
    
    _generateCafeHtml() {
        // Generate CAFE section HTML
        const qrCodeHtml = this.hka_cufe_qr ? 
            `<img src="${this.hka_cufe_qr}" style="max-width: 100px; margin-top: 5px;"/>` : '';
        
        return `
            <div class="cafe-section" style="margin-top: 15px; text-align: center; border-top: 2px dashed #000; padding-top: 10px;">
                <strong>CAFE - Comprobante Auxiliar de Factura Electrónica</strong><br/>
                <span style="font-size: 10px; word-break: break-all;">CUFE: ${this.hka_cufe}</span><br/>
                ${qrCodeHtml}
                <div style="font-size: 8px; margin-top: 3px;">Verifique en DGI Panamá</div>
            </div>
        `;
    },
});