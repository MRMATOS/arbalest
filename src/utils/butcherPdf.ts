import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ButcherOrderItem, ButcherOrder } from '../types/butcher';

/**
 * Generate PDF for butcher order
 * @param order - The order to print
 * @param items - Items to print (all or selected)
 * @returns The generated PDF document
 */
export function generateButcherOrderPDF(
    order: ButcherOrder,
    items: ButcherOrderItem[]
): jsPDF {
    const doc = new jsPDF();
    const now = new Date();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Pedido de Açougue', 105, 20, { align: 'center' });

    // Order info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const storeName = order.requester_store?.name || 'Loja';
    const orderNumber = order.order_number;

    doc.text(`Pedido: #${orderNumber}`, 14, 35);
    doc.text(`Loja: ${storeName}`, 14, 42);

    // Dates
    const createdAt = order.created_at ? new Date(order.created_at) : null;
    const submittedAt = order.submitted_at ? new Date(order.submitted_at) : null;

    let currentY = 49;
    if (createdAt) {
        doc.text(`Data do Pedido: ${formatDateTime(createdAt)}`, 14, currentY);
        currentY += 7;
    }
    if (submittedAt) {
        doc.text(`Data de Envio: ${formatDateTime(submittedAt)}`, 14, currentY);
        currentY += 7;
    }
    doc.text(`Data de Impressão: ${formatDateTime(now)}`, 14, currentY);
    currentY += 10;

    // Items table
    const tableData = items.map((item, index) => [
        (index + 1).toString(),
        item.product_name,
        item.product_code || '-',
        item.quantity.toString(),
        item.unit === 'bandeja' ? 'Bandejas' : 'Kg'
    ]);

    // Use autoTable function directly (not doc.autoTable)
    autoTable(doc, {
        startY: currentY,
        head: [['#', 'Produto', 'Código', 'Qtd', 'Unidade']],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [34, 197, 94], // Green
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 30, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 25, halign: 'center' }
        },
        styles: {
            fontSize: 10,
            cellPadding: 4
        }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
            `Página ${i} de ${pageCount} - Gerado em ${formatDateTime(now)}`,
            105,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    return doc;
}

/**
 * Generate and download PDF
 */
export function downloadButcherOrderPDF(
    order: ButcherOrder,
    items: ButcherOrderItem[]
): void {
    const doc = generateButcherOrderPDF(order, items);
    const filename = `pedido_${order.order_number}_${formatDateForFilename(new Date())}.pdf`;
    doc.save(filename);
}



function formatDateTime(date: Date): string {
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateForFilename(date: Date): string {
    return date.toISOString().slice(0, 10).replace(/-/g, '');
}
