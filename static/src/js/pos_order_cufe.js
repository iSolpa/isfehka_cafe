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
        
        // Add CUFE data to headerData for template access
        if (this.hka_cufe) {
            result.headerData = result.headerData || {};
            result.headerData.hka_cufe = this.hka_cufe;
            result.headerData.hka_cufe_qr = this.hka_cufe_qr;
            
            console.log("[ISFEHKA CAFE] Added CUFE to headerData for order:", this.name);
        }
        
        console.log("[ISFEHKA CAFE] Export for printing:", {
            orderName: this.name,
            hasCufe: !!this.hka_cufe,
            headerHasCufe: !!(result.headerData && result.headerData.hka_cufe)
        });
        
        return result;
    },
});