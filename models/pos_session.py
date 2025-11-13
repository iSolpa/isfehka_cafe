# -*- coding: utf-8 -*-
from odoo import models

class PosSession(models.Model):
    _inherit = 'pos.session'
    
    def _loader_params_pos_order(self):
        """Include CUFE fields in POS order loading"""
        result = super()._loader_params_pos_order()
        if 'search_params' in result and 'fields' in result['search_params']:
            result['search_params']['fields'].extend([
                'hka_cufe',
                'hka_cufe_qr',
                'hka_nro_protocolo_autorizacion',
                'hka_fecha_recepcion_dgi',
                'hka_tipo_documento',
            ])
        return result
