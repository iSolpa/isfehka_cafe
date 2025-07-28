/** @odoo-module */

import { PosOrder } from "@point_of_sale/app/models/pos_order";
import { patch } from "@web/core/utils/patch";

console.log("[ISFEHKA CAFE] Loading model patches for Odoo 18");

// Store reference to inject CAFE after printing
let cafeInjectionTimer = null;

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
        
        // Store CUFE data for DOM injection after printing
        if (this.hka_cufe) {
            const cafeData = {
                cufe: this.hka_cufe,
                qr: this.hka_cufe_qr
            };
            
            // Format QR code properly
            if (cafeData.qr && !cafeData.qr.startsWith('data:')) {
                cafeData.qr = `data:image/png;base64,${cafeData.qr}`;
            }
            
            console.log("[ISFEHKA CAFE] Preparing CAFE injection for order:", this.name, {
                cufe: cafeData.cufe,
                hasQr: !!cafeData.qr
            });
            
            // Schedule DOM injection after a short delay
            if (cafeInjectionTimer) clearTimeout(cafeInjectionTimer);
            cafeInjectionTimer = setTimeout(() => {
                this._injectCafeSection(cafeData);
            }, 500);
        }
        
        return result;
    },
    
    _injectCafeSection(cafeData) {
        console.log("[ISFEHKA CAFE] Attempting to inject CAFE section");
        
        // Find the receipt container
        const receiptContainer = document.querySelector('.pos-receipt, .receipt, .o_pos_receipt');
        if (!receiptContainer) {
            console.warn("[ISFEHKA CAFE] Receipt container not found");
            return;
        }
        
        // Check if CAFE section already exists
        if (receiptContainer.querySelector('.cafe-section')) {
            console.log("[ISFEHKA CAFE] CAFE section already exists");
            return;
        }
        
        // Create CAFE section
        const cafeDiv = document.createElement('div');
        cafeDiv.className = 'cafe-section';
        cafeDiv.style.cssText = 'margin-top: 15px; text-align: center; border-top: 2px dashed #000; padding-top: 10px;';
        
        const qrHtml = cafeData.qr ? 
            `<img src="${cafeData.qr}" style="max-width: 100px; margin-top: 5px;"/>` : '';
        
        cafeDiv.innerHTML = `
            <strong>CAFE - Comprobante Auxiliar de Factura Electrónica</strong><br/>
            <span style="font-size: 10px; word-break: break-all;">CUFE: ${cafeData.cufe}</span><br/>
            ${qrHtml}
            <div style="font-size: 8px; margin-top: 3px;">Verifique en DGI Panamá</div>
        `;
        
        // Append to receipt
        receiptContainer.appendChild(cafeDiv);
        console.log("[ISFEHKA CAFE] CAFE section injected successfully");
    },
});