# -*- coding: utf-8 -*-
from odoo import models, fields, api

class PosOrder(models.Model):
    _inherit = 'pos.order'
    
    # CUFE fields for Panama DGI CAFE integration
    hka_cufe = fields.Char(string='CUFE', help='Código Único de Factura Electrónica')
    hka_cufe_qr = fields.Binary(string='CUFE QR Image', help='QR code image generated from official DGI URL')
    hka_nro_protocolo_autorizacion = fields.Char(string='Número de Protocolo de Autorización', help='Número de protocolo de autorización de DGI')
    hka_fecha_recepcion_dgi = fields.Datetime(
        string='Fecha de Recepción DGI',
        readonly=True,
        help='Fecha de autorización ante la DGI'
    )
    
    hka_tipo_documento = fields.Char(
        string='Tipo de Documento HKA',
        readonly=True,
        help='Tipo de documento fiscal de la factura relacionada'
    )

    @api.model
    def get_cufe_data(self, pos_reference):
        """Get CUFE data for a specific POS order reference.
        Syncs data from the related invoice (account.move) to the pos.order.
        """
        import logging
        import qrcode
        import base64
        import io
        
        _logger = logging.getLogger(__name__)
        _logger.info("[ISFEHKA CAFE] get_cufe_data called for pos_reference: %s", pos_reference)
        
        order = self.search([('pos_reference', '=', pos_reference)], limit=1)
        _logger.info("[ISFEHKA CAFE] Found order: %s, account_move: %s", order, order.account_move if order else None)
        
        if order and order.account_move:
            invoice = order.account_move
            _logger.info("[ISFEHKA CAFE] Invoice hka_cufe: %s, hka_qr: %s", invoice.hka_cufe, invoice.hka_qr if hasattr(invoice, 'hka_qr') else 'N/A')
            
            if invoice.hka_cufe:
                # Get QR image - use hka_cufe_qr_image (computed field) from isfehka_cafe
                qr_image = invoice.hka_cufe_qr_image if hasattr(invoice, 'hka_cufe_qr_image') and invoice.hka_cufe_qr_image else False
                
                # If no QR image but we have the QR URL, generate it on-the-fly
                if not qr_image and hasattr(invoice, 'hka_qr') and invoice.hka_qr:
                    _logger.info("[ISFEHKA CAFE] Generating QR image on-the-fly from hka_qr URL")
                    try:
                        buf = io.BytesIO()
                        qrcode.make(invoice.hka_qr).save(buf, format='PNG')
                        qr_image = base64.b64encode(buf.getvalue())
                        # Also store it on the invoice for future use
                        invoice.hka_cufe_qr_image = qr_image
                    except Exception as e:
                        _logger.warning("[ISFEHKA CAFE] Error generating QR: %s", e)
                
                # Sync CUFE data from invoice to POS order if not already synced
                if not order.hka_cufe:
                    order.write({
                        'hka_cufe': invoice.hka_cufe,
                        'hka_cufe_qr': qr_image,
                        'hka_nro_protocolo_autorizacion': invoice.hka_nro_protocolo_autorizacion,
                        'hka_fecha_recepcion_dgi': invoice.hka_fecha_recepcion_dgi,
                        'hka_tipo_documento': invoice.tipo_documento,
                    })
                    _logger.info("[ISFEHKA CAFE] Synced CUFE data to pos.order")
                
                # Return the data (decode binary for JS)
                qr_data = qr_image.decode('utf-8') if qr_image else False
                return {
                    'hka_cufe': invoice.hka_cufe,
                    'hka_cufe_qr': qr_data,
                    'hka_nro_protocolo_autorizacion': invoice.hka_nro_protocolo_autorizacion,
                    'hka_fecha_recepcion_dgi': str(invoice.hka_fecha_recepcion_dgi) if invoice.hka_fecha_recepcion_dgi else False,
                    'hka_tipo_documento': invoice.tipo_documento,
                }
        
        _logger.info("[ISFEHKA CAFE] No CUFE data found")
        return {
            'hka_cufe': False,
            'hka_cufe_qr': False,
            'hka_nro_protocolo_autorizacion': False,
            'hka_fecha_recepcion_dgi': False,
            'hka_tipo_documento': False,
        }
