# isfehka_cafe/models/account_move.py
from odoo import models, api

class AccountMove(models.Model):
    _inherit = 'account.move'

    def write(self, vals):
        """Override write to sync CUFE data when HKA fields are updated"""
        result = super().write(vals)
        
        # If CUFE or QR fields are updated, sync to related POS orders
        if 'hka_cufe' in vals or 'hka_qr' in vals:
            self._sync_cufe_to_pos_orders()
        
        return result

    def _sync_cufe_to_pos_orders(self):
        """Sync CUFE data to related POS orders for CAFE display"""
        for move in self:
            if move.hka_cufe and hasattr(move, 'pos_order_ids') and move.pos_order_ids:
                # Update related POS orders with CUFE data using official QR from isfehka
                try:
                    move.pos_order_ids.write({
                        'hka_cufe': move.hka_cufe,
                        'hka_cufe_qr': move.hka_qr,  # Use official QR from HKA service
                    })
                except Exception as e:
                    # Fields may not exist yet if module hasn't been updated
                    pass