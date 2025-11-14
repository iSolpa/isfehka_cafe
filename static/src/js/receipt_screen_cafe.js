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
                    }
                }
            } catch (e) {
                console.warn("[ISFEHKA CAFE] Could not preload CUFE for receipt:", e);
            }
        });
    },
});
