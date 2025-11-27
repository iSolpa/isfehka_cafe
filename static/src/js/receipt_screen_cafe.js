/** @odoo-module */

import { ReceiptScreen } from "@point_of_sale/app/screens/receipt_screen/receipt_screen";
import { patch } from "@web/core/utils/patch";
import { onWillStart } from "@odoo/owl";

// Ensure CUFE fields are present on the Order before the receipt renders.
patch(ReceiptScreen.prototype, {
    setup() {
        super.setup();
        onWillStart(async () => {
            try {
                const order = this.currentOrder;
                if (order && order.server_id && !order.hka_cufe) {
                    console.log("[ISFEHKA CAFE] Attempting to load CUFE data for order:", order.name);
                    
                    // Retry logic: try up to 5 times with increasing delays
                    let attempts = 0;
                    const maxAttempts = 5;
                    const delays = [100, 200, 400, 800, 1000]; // Exponential backoff in ms
                    
                    while (attempts < maxAttempts) {
                        const data = await this.env.services.orm.call(
                            "pos.order",
                            "read",
                            [[order.server_id], [
                                "hka_cufe",
                                "hka_cufe_qr",
                                "hka_nro_protocolo_autorizacion",
                                "hka_fecha_recepcion_dgi",
                                "hka_tipo_documento",
                            ]]
                        );
                        
                        if (data && data.length && data[0].hka_cufe) {
                            order.hka_cufe = data[0].hka_cufe;
                            order.hka_cufe_qr = data[0].hka_cufe_qr;
                            order.hka_nro_protocolo_autorizacion = data[0].hka_nro_protocolo_autorizacion;
                            order.hka_fecha_recepcion_dgi = data[0].hka_fecha_recepcion_dgi;
                            order.hka_tipo_documento = data[0].hka_tipo_documento;
                            console.log("[ISFEHKA CAFE] ✓ CUFE data loaded successfully on attempt", attempts + 1);
                            break;
                        }
                        
                        attempts++;
                        if (attempts < maxAttempts) {
                            console.log(`[ISFEHKA CAFE] CUFE not ready, retrying in ${delays[attempts]}ms (attempt ${attempts}/${maxAttempts})...`);
                            await new Promise(resolve => setTimeout(resolve, delays[attempts]));
                        } else {
                            console.warn("[ISFEHKA CAFE] ✗ CUFE data not available after", maxAttempts, "attempts");
                        }
                    }
                }
            } catch (e) {
                console.error("[ISFEHKA CAFE] Error loading CUFE for receipt:", e);
            }
        });
    },
});
