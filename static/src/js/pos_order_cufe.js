/** @odoo-module **/
// isfehka_cafe/static/src/js/pos_order_cufe.js
import { Order } from '@point_of_sale/app/store/models';
import { patch } from '@web/core/utils/patch';
import { PosStore } from '@point_of_sale/app/store/pos_store';

console.log('[ISFEHKA CAFE] Loading model patches');

patch(Order.prototype, {
    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        console.log('[ISFEHKA CAFE] Exporting order as JSON:', {
            orderName: this.name,
            hasCufe: !!this.hka_cufe
        });
        
        if (this.hka_cufe) {
            console.log('[ISFEHKA CAFE] Including CUFE data in export for order:', this.name);
            json.hka_cufe = this.hka_cufe;
            json.hka_cufe_qr = this.hka_cufe_qr;
        }
        return json;
    },

    init_from_JSON(json) {
        console.log('[ISFEHKA CAFE] Initializing order from JSON:', {
            orderName: json.name,
            hasCufe: !!json.hka_cufe
        });
        
        super.init_from_JSON(...arguments);
        if (json.hka_cufe) {
            console.log('[ISFEHKA CAFE] Found CUFE data in JSON for order:', json.name);
            this.hka_cufe = json.hka_cufe;
            this.hka_cufe_qr = json.hka_cufe_qr;
        }
    },

    export_for_printing() {
        const res = super.export_for_printing(...arguments);
        
        // Add CUFE data if available
        // Note: CUFE is generated after invoice posting, so it might not be available
        // during initial receipt printing
        res.hka_cufe = this.hka_cufe || null;
        res.hka_cufe_qr = this.hka_cufe_qr || null;
        
        console.log('[ISFEHKA CAFE] Export for printing:', {
            orderName: this.name,
            hasCufe: !!res.hka_cufe
        });
        
        return res;
    },
});

patch(PosStore.prototype, {
    async loadCufeData(orderData) {
        console.log('[ISFEHKA CAFE] PosStore loading CUFE data:', {
            orderRef: orderData.pos_reference
        });
        
        try {
            const result = await this.rpc({
                model: 'pos.order',
                method: 'get_cufe_data',
                args: [orderData.pos_reference],
            });
            
            console.log('[ISFEHKA CAFE] PosStore RPC result:', {
                success: !!result,
                hasCufe: !!result?.hka_cufe,
                orderRef: orderData.pos_reference
            });
            
            if (result && result.hka_cufe) {
                console.log('[ISFEHKA CAFE] PosStore successfully loaded CUFE for:', orderData.pos_reference);
                // Store in current order if it matches
                const currentOrder = this.get_order();
                if (currentOrder && currentOrder.name === orderData.pos_reference) {
                    currentOrder.hka_cufe = result.hka_cufe;
                    currentOrder.hka_cufe_qr = result.hka_cufe_qr;
                    console.log('[ISFEHKA CAFE] PosStore updated current order with CUFE data');
                }
                return result;
            } else {
                console.warn('[ISFEHKA CAFE] PosStore no CUFE found in response');
            }
        } catch (error) {
            console.error('[ISFEHKA CAFE] PosStore error loading CUFE data:', error);
        }
        return null;
    },
});