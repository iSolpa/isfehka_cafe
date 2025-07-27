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
            else:
                move.hka_cufe_qr = False