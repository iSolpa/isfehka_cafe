from datetime import datetime
from types import SimpleNamespace
from unittest.mock import patch

from odoo.addons.account.tests.common import AccountTestInvoicingCommon
from odoo.tests import new_test_user, tagged


@tagged('post_install', '-at_install')
class TestFeInvoiceReport(AccountTestInvoicingCommon):
    """Printed invoice and POS ticket (#2004). No test reaches HKA."""

    def _invoice(self, tipo='01'):
        self.partner_a.write({'tipo_cliente_fe': tipo})
        move = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.partner_a.id,
            'invoice_line_ids': [(0, 0, {'name': 'x', 'quantity': 1, 'price_unit': 10})],
        })
        move.write({
            'hka_cufe': 'FE-TEST',
            'numero_documento_fiscal': '0000000138',
            'hka_fecha_recepcion_dgi': datetime(2026, 11, 6, 16, 52, 41),
        })
        return move

    def _html(self, move, user=None):
        report = self.env['ir.actions.report']
        if user:
            report = report.with_user(user)
        html, _kind = report._render_qweb_html('account.report_invoice', move.ids)
        return html.decode() if isinstance(html, bytes) else str(html)

    def test_time_does_not_depend_on_who_prints(self):
        move = self._invoice()
        groups = 'account.group_account_invoice,base.group_user'
        cases = [
            None,
            new_test_user(self.env, login='tz_panama', tz='America/Panama', groups=groups,
                          company_id=self.env.company.id, company_ids=[(6, 0, self.env.company.ids)]),
            new_test_user(self.env, login='tz_none', tz=False, groups=groups,
                          company_id=self.env.company.id, company_ids=[(6, 0, self.env.company.ids)]),
            new_test_user(self.env, login='tz_tokyo', tz='Asia/Tokyo', groups=groups,
                          company_id=self.env.company.id, company_ids=[(6, 0, self.env.company.ids)]),
        ]
        for user in cases:
            html = self._html(move, user)
            self.assertIn('11:52:41', html, user and user.login)
            self.assertNotIn('06:52:41', html)
            self.assertNotIn('16:52:41', html)

    def test_customer_type_is_the_real_one(self):
        for code, label in (('01', 'Contribuyente'), ('02', 'Consumidor Final'),
                            ('03', 'Gobierno'), ('04', 'Extranjero')):
            html = self._html(self._invoice(code))
            self.assertRegex(html, r'Tipo:</strong>\s*<span[^>]*>%s</span>' % label)

    def test_wall_clock_for_ticket(self):
        pos = self.env['pos.order']
        self.assertEqual(pos._hka_panama_wall_clock(datetime(2026, 11, 6, 16, 52, 41)),
                         datetime(2026, 11, 6, 11, 52, 41))
        self.assertFalse(pos._hka_panama_wall_clock(False))

    def test_get_cufe_data_returns_the_order_copy(self):
        invoice = self._invoice()
        order = SimpleNamespace(account_move=invoice, hka_cufe='FE-TEST',
                                hka_fecha_recepcion_dgi=datetime(2026, 11, 6, 11, 52, 41))
        pos = self.env['pos.order']
        with patch.object(type(pos), 'search', return_value=order):
            data = pos.get_cufe_data('REF')
        self.assertEqual(data['hka_fecha_recepcion_dgi'], '2026-11-06 11:52:41')
