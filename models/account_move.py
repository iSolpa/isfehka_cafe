# isfehka_cafe/models/account_move.py
from odoo import models, fields, api
import qrcode, base64, io
import logging

_logger = logging.getLogger(__name__)

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
        """Generate QR code image from official DGI QR URL (from parent isfehka module)"""
        for move in self:
            if move.hka_qr:
                try:
                    # Generate QR code from the official DGI URL
                    buf = io.BytesIO()
                    qrcode.make(move.hka_qr).save(buf, format='PNG')
                    move.hka_cufe_qr_image = base64.b64encode(buf.getvalue())
                except Exception as e:
                    _logger.error(f"Error generating QR image for invoice {move.name}: {e}")
                    move.hka_cufe_qr_image = False
            else:
                move.hka_cufe_qr_image = False

    def write(self, vals):
        """Override write to sync CUFE data to POS orders when HKA fields are updated"""
        res = super(AccountMove, self).write(vals)
        
        # If any CAFE-related field is updated, sync to POS orders
        cafe_fields = {'hka_cufe', 'hka_qr', 'hka_nro_protocolo_autorizacion', 'hka_fecha_recepcion_dgi'}
        if cafe_fields & set(vals.keys()):
            for move in self:
                move._sync_cufe_to_pos_orders()
        
        return res

    def _sync_cufe_to_pos_orders(self):
        """Sync CUFE data to related POS orders for CAFE display"""
        self.ensure_one()
        if not self.hka_cufe:
            return
            
        # Find POS orders that reference this invoice
        pos_orders = self.env['pos.order'].search([('account_move', '=', self.id)])
        
        if pos_orders:
            try:
                pos_orders.write({
                    'hka_cufe': self.hka_cufe,
                    'hka_cufe_qr': self.hka_cufe_qr_image,  # Use generated QR image from official URL
                    'hka_nro_protocolo_autorizacion': self.hka_nro_protocolo_autorizacion,
                    'hka_fecha_recepcion_dgi': self.hka_fecha_recepcion_dgi,
                    'hka_tipo_documento': self.tipo_documento,  # Add document type for CAFE display
                })
                # Commit immediately so auto-print receipts can access the data
                self.env.cr.commit()
                _logger.info(f"[ISFEHKA CAFE] Synced and committed CUFE data to {len(pos_orders)} POS orders for invoice {self.name}")
            except Exception as e:
                # Fields may not exist yet if pos_order module hasn't been updated
                _logger.warning(f"[ISFEHKA CAFE] Could not sync CUFE data to POS orders: {e}")