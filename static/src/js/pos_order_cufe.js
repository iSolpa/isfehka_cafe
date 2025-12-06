/** @odoo-module */

import { PosOrder } from "@point_of_sale/app/models/pos_order";
import { patch } from "@web/core/utils/patch";

console.log("[ISFEHKA CAFE] Loading PosOrder model patches for Odoo 19");

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

patch(PosOrder.prototype, {
    setup(vals) {
        super.setup(...arguments);
        
        console.log("[ISFEHKA CAFE] PosOrder.setup() called for order:", vals.name || vals.id);
        console.log("[ISFEHKA CAFE] vals keys:", Object.keys(vals));
        console.log("[ISFEHKA CAFE] vals.hka_cufe:", vals.hka_cufe);
        console.log("[ISFEHKA CAFE] vals.hka_cufe_qr:", vals.hka_cufe_qr ? "present (binary)" : "not present");
        
        // Initialize CUFE fields from vals (loaded from backend)
        this.hka_cufe = vals.hka_cufe || false;
        this.hka_cufe_qr = vals.hka_cufe_qr || false;
        this.hka_nro_protocolo_autorizacion = vals.hka_nro_protocolo_autorizacion || false;
        this.hka_fecha_recepcion_dgi = vals.hka_fecha_recepcion_dgi || false;
        this.hka_tipo_documento = vals.hka_tipo_documento || '';
        
        // Compute display name for tipo_documento
        this.hka_tipo_documento_name = this.hka_tipo_documento ? 
            TIPO_DOCUMENTO_MAP[this.hka_tipo_documento] || '' : '';
        
        if (this.hka_cufe) {
            console.log("[ISFEHKA CAFE] Order initialized with CUFE:", this.name, this.hka_cufe);
        } else {
            console.log("[ISFEHKA CAFE] Order initialized WITHOUT CUFE:", this.name || vals.name);
        }
    },

    serializeForORM(opts = {}) {
        const data = super.serializeForORM(opts);
        
        console.log("[ISFEHKA CAFE] serializeForORM called, hka_cufe:", this.hka_cufe);
        
        // Include CUFE fields in serialization
        if (this.hka_cufe) {
            data.hka_cufe = this.hka_cufe;
            data.hka_cufe_qr = this.hka_cufe_qr;
            data.hka_nro_protocolo_autorizacion = this.hka_nro_protocolo_autorizacion;
            data.hka_fecha_recepcion_dgi = this.hka_fecha_recepcion_dgi;
            data.hka_tipo_documento = this.hka_tipo_documento;
        }
        
        return data;
    },
});