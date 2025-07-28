# -*- coding: utf-8 -*-
from odoo import models, fields, api

class PosOrder(models.Model):
    _inherit = 'pos.order'
    
    # CUFE fields for Panama DGI CAFE integration
    hka_cufe = fields.Char(string='CUFE', help='Código Único de Factura Electrónica')
    hka_cufe_qr = fields.Binary(string='CUFE QR Image', help='QR code image generated from official DGI URL')
    hka_nro_protocolo_autorizacion = fields.Char(string='Número de Protocolo de Autorización', help='Número de protocolo de autorización de DGI')

    def get_cufe_data(self, pos_reference):
        """Get CUFE data for a specific POS order reference"""
        order = self.search([('pos_reference', '=', pos_reference)], limit=1)
        if order and order.account_move and order.account_move.hka_cufe:
            # Sync CUFE data from invoice to POS order if not already synced
            if not order.hka_cufe:
                order.write({
                    'hka_cufe': order.account_move.hka_cufe,
                    'hka_cufe_qr': order.account_move.hka_cufe_qr,
                    'hka_nro_protocolo_autorizacion': order.account_move.hka_nro_protocolo_autorizacion,
                })
            return {
                'hka_cufe': order.hka_cufe,
                'hka_cufe_qr': order.hka_cufe_qr,
                'hka_nro_protocolo_autorizacion': order.hka_nro_protocolo_autorizacion,
            }
        return {
            'hka_cufe': False,
            'hka_cufe_qr': False,
            'hka_nro_protocolo_autorizacion': False,
        }
