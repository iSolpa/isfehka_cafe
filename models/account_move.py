# isfehka_cafe/models/account_move.py
from odoo import models, fields, api
import qrcode, base64, io

class AccountMove(models.Model):
    _inherit = 'account.move'

    hka_cufe_qr_image = fields.Binary(
        string='QR CUFE Image',
        readonly=True,
        compute='_compute_hka_cufe_qr_image',
        store=True,
        attachment=True,
    )

    @api.depends('hka_qr')
    def _compute_hka_cufe_qr_image(self):
        """Generate QR code image from official DGI QR URL"""
        for move in self:
            if move.hka_qr:
                # Generate QR code from the official DGI URL
                buf = io.BytesIO()
                qrcode.make(move.hka_qr).save(buf, format='PNG')
                move.hka_cufe_qr_image = base64.b64encode(buf.getvalue())
            else:
                move.hka_cufe_qr_image = False

    def _sync_cufe_to_pos_orders(self):
        """Sync CUFE data to related POS orders for CAFE display"""
        self.ensure_one()
        if self.hka_cufe and hasattr(self, 'pos_order_ids') and self.pos_order_ids:
            # Update related POS orders with official CUFE and QR data from HKA
            try:
                self.pos_order_ids.write({
                    'hka_cufe': self.hka_cufe,
                    'hka_cufe_qr': self.hka_cufe_qr_image,  # Use generated QR image from official URL
                    'hka_nro_protocolo_autorizacion': self.hka_nro_protocolo_autorizacion,
                })
                print(f"[ISFEHKA CAFE] Synced CUFE data to {len(self.pos_order_ids)} POS orders for invoice {self.name}")
            except Exception as e:
                # Fields may not exist yet if module hasn't been updated
                print(f"[ISFEHKA CAFE] Error syncing CUFE data: {e}")
                pass