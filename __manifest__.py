# -*- coding: utf-8 -*-
{
    'name': 'ISFEHKA CAFE - Panama DGI Receipt Extension',
    'version': '18.0.1.0.0',
    'category': 'Accounting/Localizations',
    'summary': 'Panama DGI CAFE (Comprobante Auxiliar de Factura Electrónica) generation for receipts',
    'description': """
        Panama DGI CAFE Generation
        =========================
        
        This module extends the ISFEHKA electronic invoicing system to generate
        CAFE (Comprobante Auxiliar de Factura Electrónica) receipts with QR codes
        for Panama DGI compliance.
        
        Features:
        - QR code generation for CUFE validation
        - CAFE receipt templates for invoices
        - POS receipt integration with CAFE information
        - DGI web validation links
    """,
    'author': 'Independent Solutions',
    'website': 'https://www.isolpa.com',
    'license': 'OPL-1',
    'depends': [
        'base',
        'account',
        'point_of_sale',
        'isfehka',
    ],
    'data': [
        'views/report_invoice_cafe.xml',
    ],
    'assets': {
        'point_of_sale._assets_pos': [
            'isfehka_cafe/static/src/js/pos_order_cufe.js',
            'isfehka_cafe/static/src/xml/pos_ticket_cafe.xml',
        ],
    },
    'external_dependencies': {
        'python': ['qrcode'],
    },
    'installable': True,
    'auto_install': False,
    'application': False,
}
