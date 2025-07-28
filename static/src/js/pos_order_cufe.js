/** @odoo-module */

import { OrderReceipt } from "@point_of_sale/app/screens/receipt_screen/receipt/order_receipt";
import { patch } from "@web/core/utils/patch";
import { usePos } from "@point_of_sale/app/store/pos_hook";

console.log("[ISFEHKA CAFE] Loading receipt component patch");

patch(OrderReceipt.prototype, {
    setup() {
        super.setup();
        this.pos = usePos();
        
        console.log("[ISFEHKA CAFE] Setting up CAFE receipt component");
    },
    
    get hkaCufe() {
        // Get CUFE from current order or reprint data
        const isReprint = this.props.data?.isReprint === true;
        
        if (isReprint && this.props.data?.hka_cufe) {
            console.log("[ISFEHKA CAFE] Getting CUFE from reprint data:", this.props.data.hka_cufe);
            return this.props.data.hka_cufe;
        }
        
        const currentOrder = this.pos?.get_order();
        if (currentOrder?.hka_cufe) {
            console.log("[ISFEHKA CAFE] Getting CUFE from current order:", currentOrder.hka_cufe);
            return currentOrder.hka_cufe;
        }
        
        console.log("[ISFEHKA CAFE] No CUFE found");
        return null;
    },
    
    get hkaCufeQr() {
        // Get QR from current order or reprint data
        const isReprint = this.props.data?.isReprint === true;
        
        if (isReprint && this.props.data?.hka_cufe_qr) {
            console.log("[ISFEHKA CAFE] Getting QR from reprint data");
            return this.props.data.hka_cufe_qr;
        }
        
        const currentOrder = this.pos?.get_order();
        if (currentOrder?.hka_cufe_qr) {
            console.log("[ISFEHKA CAFE] Getting QR from current order");
            return currentOrder.hka_cufe_qr;
        }
        
        console.log("[ISFEHKA CAFE] No QR found");
        return null;
    }
});