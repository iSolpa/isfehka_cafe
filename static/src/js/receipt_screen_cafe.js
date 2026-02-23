/** @odoo-module */

import { ReceiptScreen } from "@point_of_sale/app/screens/receipt_screen/receipt_screen";
import { patch } from "@web/core/utils/patch";
import { onWillStart } from "@odoo/owl";

// Map for document type display names
const TIPO_DOCUMENTO_MAP = {
    '01': 'Factura de Operación Interna',
    '02': 'Factura de Importación',
    '03': 'Factura de Exportación',
    '04': 'Nota de Crédito',
    '05': 'Nota de Débito',
    '06': 'Nota de Crédito Genérica',
    '07': 'Nota de Débito Genérica',
    '08': 'Factura de Zona Franca',
    '09': 'Factura de Reembolso'
};

// Ensure CUFE fields are present on the Order before the receipt renders.
patch(ReceiptScreen.prototype, {
    setup() {
        super.setup();
        onWillStart(async () => {
            try {
                const order = this.currentOrder;
                console.log("[ISFEHKA CAFE] onWillStart - order:", order?.name, "hka_cufe:", order?.hka_cufe);
                // Use order.name (pos_reference) which is always available,
                // instead of server_id which may not be set yet on first print
                if (order && order.name && !order.hka_cufe) {
                    console.log("[ISFEHKA CAFE] Fetching CUFE via get_cufe_data for:", order.name);
                    const data = await this.env.services.orm.call(
                        "pos.order",
                        "get_cufe_data",
                        [order.name]
                    );
                    console.log("[ISFEHKA CAFE] get_cufe_data response:", data);
                    if (data && data.hka_cufe) {
                        order.hka_cufe = data.hka_cufe;
                        order.hka_cufe_qr = data.hka_cufe_qr;
                        order.hka_nro_protocolo_autorizacion = data.hka_nro_protocolo_autorizacion;
                        order.hka_fecha_recepcion_dgi = data.hka_fecha_recepcion_dgi;
                        order.hka_tipo_documento = data.hka_tipo_documento;
                        order.hka_tipo_documento_name = data.hka_tipo_documento ?
                            TIPO_DOCUMENTO_MAP[data.hka_tipo_documento] || '' : '';
                        console.log("[ISFEHKA CAFE] CUFE data loaded successfully:", order.hka_cufe);
                    }
                }
            } catch (e) {
                console.warn("[ISFEHKA CAFE] Could not preload CUFE for receipt:", e);
            }
        });
    },
});
