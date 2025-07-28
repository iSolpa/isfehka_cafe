# -*- coding: utf-8 -*-
from odoo import models, fields, api

class PosOrder(models.Model):
    _inherit = 'pos.order'

    def get_cufe_data(self, pos_reference):
        """Get CUFE data for a specific POS order reference"""
        order = self.search([('pos_reference', '=', pos_reference)], limit=1)
        if order and order.account_move and order.account_move.hka_cufe:
            return {
                'hka_cufe': order.account_move.hka_cufe,
                'hka_cufe_qr': order.account_move.hka_cufe_qr,
            }
        return {
            'hka_cufe': False,
            'hka_cufe_qr': False,
        }
