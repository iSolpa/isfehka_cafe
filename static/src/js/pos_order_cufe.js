/** @odoo-module **/
// isfehka_cafe/static/src/js/pos_order_cufe.js
import { Order } from '@point_of_sale/app/store/models';
import { patch } from '@web/core/utils/patch';

patch(Order.prototype, {
    export_for_printing() {
        const res = super.export_for_printing(...arguments);
        res.hka_cufe = this.get('hka_cufe');
        res.hka_cufe_qr = this.get('hka_cufe_qr');
        return res;
    },
});