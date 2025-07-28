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
            json.hka_nro_protocolo_autorizacion = this.hka_nro_protocolo_autorizacion;
            json.hka_fecha_recepcion_dgi = this.hka_fecha_recepcion_dgi;
            json.hka_tipo_documento = this.hka_tipo_documento;  // Add document type from synced data
        }
        
        // Add tipo_documento for transaction type display (from HKA integration)
        console.log("[ISFEHKA CAFE] Debug - this.hka_tipo_documento:", this.hka_tipo_documento);
        
        json.tipo_documento = this.hka_tipo_documento || '';
        
        // Get the display name for tipo_documento selection field
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
        json.tipo_documento_name = json.tipo_documento ? tipoDocumentoMap[json.tipo_documento] || '' : '';
        
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
            this.hka_nro_protocolo_autorizacion = json.hka_nro_protocolo_autorizacion;
            this.hka_fecha_recepcion_dgi = json.hka_fecha_recepcion_dgi;
            this.hka_tipo_documento = json.hka_tipo_documento;  // Store document type from synced data
        }
        
        // Store tipo_documento for transaction type display (from HKA integration)
        console.log("[ISFEHKA CAFE] Debug init_from_JSON - json.tipo_documento:", json.tipo_documento);
        console.log("[ISFEHKA CAFE] Debug init_from_JSON - json.hka_tipo_documento:", json.hka_tipo_documento);
        this.tipo_documento = json.tipo_documento || json.hka_tipo_documento || '';
        
        // Get the display name for tipo_documento selection field
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
        this.tipo_documento_name = json.tipo_documento_name || (this.tipo_documento ? tipoDocumentoMap[this.tipo_documento] || '' : '');
    },

    export_for_printing() {
        const result = super.export_for_printing(...arguments);
        
        // Add tipo_documento for transaction type display (from HKA integration)
        console.log("[ISFEHKA CAFE] Debug export_for_printing - this.tipo_documento:", this.tipo_documento);
        console.log("[ISFEHKA CAFE] Debug export_for_printing - this.hka_tipo_documento:", this.hka_tipo_documento);
        console.log("[ISFEHKA CAFE] Debug export_for_printing - all HKA fields:", {
            hka_cufe: this.hka_cufe,
            hka_tipo_documento: this.hka_tipo_documento,
            hka_nro_protocolo_autorizacion: this.hka_nro_protocolo_autorizacion,
            hka_fecha_recepcion_dgi: this.hka_fecha_recepcion_dgi
        });
        result.tipo_documento = this.hka_tipo_documento || this.tipo_documento || '';
        
        // Get the display name for tipo_documento selection field
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
        result.tipo_documento_name = this.tipo_documento_name || (result.tipo_documento ? tipoDocumentoMap[result.tipo_documento] || '' : '');
        
        console.log("[ISFEHKA CAFE] Debug export_for_printing result:", {
            tipo_documento: result.tipo_documento,
            tipo_documento_name: result.tipo_documento_name
        });
        
        // Add CUFE data to headerData for template access (working approach)
        if (this.hka_cufe) {
            result.headerData = result.headerData || {};
            result.headerData.hka_cufe = this.hka_cufe;
            result.headerData.hka_nro_protocolo_autorizacion = this.hka_nro_protocolo_autorizacion;
            result.headerData.hka_fecha_recepcion_dgi = this.hka_fecha_recepcion_dgi;
            
            // Format QR image with proper data URL prefix (generated from official DGI URL)
            if (this.hka_cufe_qr) {
                result.headerData.hka_cufe_qr = `data:image/png;base64,${this.hka_cufe_qr}`;
            }
            
            console.log("[ISFEHKA CAFE] Added CUFE to headerData for order:", this.name);
        }
        
        console.log("[ISFEHKA CAFE] Export for printing:", {
            orderName: this.name,
            hasCufe: !!this.hka_cufe,
            headerHasCufe: !!(result.headerData && result.headerData.hka_cufe),
            hasQrCode: !!(result.headerData && result.headerData.hka_cufe_qr)
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