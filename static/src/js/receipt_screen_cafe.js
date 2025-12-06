/** @odoo-module */

import { ReceiptScreen } from "@point_of_sale/app/screens/receipt_screen/receipt_screen";
import { PosStore } from "@point_of_sale/app/services/pos_store";
import { patch } from "@web/core/utils/patch";
import { onWillStart, onMounted } from "@odoo/owl";

console.log("[ISFEHKA CAFE] Loading ReceiptScreen and PosStore patches for Odoo 19");

// Ensure CUFE fields are present on the Order before the receipt renders.
// This is needed for reprints where the order is loaded from the server.
patch(ReceiptScreen.prototype, {
    setup() {
        super.setup();
        console.log("[ISFEHKA CAFE] ReceiptScreen setup() called");
        console.log("[ISFEHKA CAFE] this.props:", this.props);
        console.log("[ISFEHKA CAFE] this.pos:", this.pos);
        
        onWillStart(async () => {
            console.log("[ISFEHKA CAFE] ReceiptScreen onWillStart triggered");
            try {
                const order = this.currentOrder;
                console.log("[ISFEHKA CAFE] currentOrder:", order);
                console.log("[ISFEHKA CAFE] order details:", {
                    name: order?.name,
                    id: order?.id,
                    uuid: order?.uuid,
                    hka_cufe: order?.hka_cufe,
                    allKeys: order ? Object.keys(order) : []
                });
                
                // If order exists, has an ID (synced), but no CUFE loaded, fetch from backend
                if (order && order.id && !order.hka_cufe) {
                    console.log("[ISFEHKA CAFE] Fetching CUFE data from backend for order:", order.id);
                    console.log("[ISFEHKA CAFE] order.pos_reference:", order.pos_reference);
                    
                    // Use get_cufe_data method which syncs from invoice to pos.order
                    const data = await this.pos.data.call(
                        "pos.order",
                        "get_cufe_data",
                        [order.pos_reference]
                    );
                    console.log("[ISFEHKA CAFE] get_cufe_data response:", data);
                    
                    if (data && data.hka_cufe) {
                        order.hka_cufe = data.hka_cufe;
                        order.hka_cufe_qr = data.hka_cufe_qr;
                        order.hka_nro_protocolo_autorizacion = data.hka_nro_protocolo_autorizacion;
                        order.hka_fecha_recepcion_dgi = data.hka_fecha_recepcion_dgi;
                        order.hka_tipo_documento = data.hka_tipo_documento;
                        
                        // Compute display name for tipo_documento
                        const tipoDocumentoMap = {
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
                        order.hka_tipo_documento_name = order.hka_tipo_documento ? 
                            tipoDocumentoMap[order.hka_tipo_documento] || '' : '';
                        
                        console.log("[ISFEHKA CAFE] CUFE data loaded successfully:", order.hka_cufe);
                    } else {
                        console.log("[ISFEHKA CAFE] No CUFE data returned from get_cufe_data");
                    }
                } else {
                    console.log("[ISFEHKA CAFE] Skipping fetch - order:", !!order, "id:", order?.id, "hka_cufe already:", order?.hka_cufe);
                }
            } catch (e) {
                console.error("[ISFEHKA CAFE] Error in onWillStart:", e);
            }
        });
        
        onMounted(() => {
            console.log("[ISFEHKA CAFE] ReceiptScreen mounted");
            const order = this.currentOrder;
            console.log("[ISFEHKA CAFE] After mount - order.hka_cufe:", order?.hka_cufe);
        });
    },
});

// Helper function to fetch CUFE data for an order
async function fetchCufeData(pos, order) {
    if (!order || !order.id || order.hka_cufe) {
        return; // Already has CUFE or not synced
    }
    
    console.log("[ISFEHKA CAFE] Fetching CUFE for order:", order.name, "pos_reference:", order.pos_reference);
    
    try {
        const data = await pos.data.call(
            "pos.order",
            "get_cufe_data",
            [order.pos_reference]
        );
        
        if (data && data.hka_cufe) {
            order.hka_cufe = data.hka_cufe;
            order.hka_cufe_qr = data.hka_cufe_qr;
            order.hka_nro_protocolo_autorizacion = data.hka_nro_protocolo_autorizacion;
            order.hka_fecha_recepcion_dgi = data.hka_fecha_recepcion_dgi;
            order.hka_tipo_documento = data.hka_tipo_documento;
            
            const tipoDocumentoMap = {
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
            order.hka_tipo_documento_name = order.hka_tipo_documento ? 
                tipoDocumentoMap[order.hka_tipo_documento] || '' : '';
            
            console.log("[ISFEHKA CAFE] CUFE loaded for reprint:", order.hka_cufe);
        }
    } catch (e) {
        console.warn("[ISFEHKA CAFE] Error fetching CUFE:", e);
    }
}

// Patch PosStore.printReceipt to fetch CUFE before printing (for reprints)
patch(PosStore.prototype, {
    async printReceipt(opts = {}) {
        const order = opts.order || this.getOrder();
        console.log("[ISFEHKA CAFE] printReceipt called for order:", order?.name);
        
        // Fetch CUFE data if not already present
        await fetchCufeData(this, order);
        
        return super.printReceipt(opts);
    },
});
