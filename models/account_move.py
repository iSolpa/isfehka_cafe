# isfehka_cafe/models/account_move.py
from odoo import models, fields, api
import qrcode, base64, io

class AccountMove(models.Model):
    _inherit = 'account.move'

    hka_cufe_qr = fields.Binary(
        string='QR CUFE',
        readonly=True,
        compute='_compute_hka_cufe_qr',
        store=True,
        attachment=True,
    )

    @api.depends('hka_cufe')
    def _compute_hka_cufe_qr(self):
        """Encode CUFE → https://dgi-fep.mef.gob.pa/consultar?cufe=…"""
        url_tpl = 'https://dgi-fep.mef.gob.pa/consultar?cufe=%s'
        for move in self:
            if move.hka_cufe:
                buf = io.BytesIO()
                qrcode.make(url_tpl % move.hka_cufe).save(buf, format='PNG')
                move.hka_cufe_qr = base64.b64encode(buf.getvalue())
                
                # Sync CUFE data to related POS orders
                move._sync_cufe_to_pos_orders()
            else:
                move.hka_cufe_qr = False
    
    def _sync_cufe_to_pos_orders(self):
        """Sync CUFE data to related POS orders for CAFE display"""
        self.ensure_one()
        if hasattr(self, 'pos_order_ids') and self.pos_order_ids:
            # Update related POS orders with CUFE data
            self.pos_order_ids.write({
                'hka_cufe': self.hka_cufe,
                'hka_cufe_qr': self.hka_cufe_qr,
            })