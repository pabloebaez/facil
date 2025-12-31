<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\Company;
use App\Models\Customer;
use Illuminate\Support\Facades\Log;

class XmlUblGenerator
{
    /**
     * Generar XML UBL 2.1 para una factura
     */
    public function generate(Sale $sale): string
    {
        $company = $sale->company;
        $customer = $sale->customer;
        $items = $sale->items;

        // Obtener rango de numeración DIAN
        $documentNumberingService = new \App\Services\DocumentNumberingService();
        $range = $documentNumberingService->getActiveRange($company->id, 'invoice');

        // Generar UUID único para el documento
        $uuid = $this->generateUUID();

        // Fecha y hora de emisión
        $issueDate = $sale->created_at->format('Y-m-d');
        $issueTime = $sale->created_at->format('H:i:s');

        // Construir XML UBL 2.1
        $xml = new \DOMDocument('1.0', 'UTF-8');
        $xml->formatOutput = true;

        // Invoice (raíz)
        $invoice = $xml->createElementNS('urn:oasis:names:specification:ubl:schema:xsd:Invoice-2', 'Invoice');
        $invoice->setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:schemaLocation', 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2 ../xsd/maindoc/UBL-Invoice-2.1.xsd');
        $invoice->setAttribute('xmlns:ext', 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2');
        $invoice->setAttribute('xmlns:cac', 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2');
        $invoice->setAttribute('xmlns:cbc', 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2');
        $invoice->setAttribute('xmlns:ds', 'http://www.w3.org/2000/09/xmldsig#');
        $xml->appendChild($invoice);

        // cbc:UBLVersionID
        $this->addElement($xml, $invoice, 'cbc:UBLVersionID', '2.1');

        // cbc:CustomizationID
        $this->addElement($xml, $invoice, 'cbc:CustomizationID', '10');

        // cbc:ProfileID
        $this->addElement($xml, $invoice, 'cbc:ProfileID', 'DIAN 2.1');

        // cbc:ProfileExecutionID
        $this->addElement($xml, $invoice, 'cbc:ProfileExecutionID', '1');

        // cbc:ID (Número de factura)
        $this->addElement($xml, $invoice, 'cbc:ID', $sale->sale_number);

        // cbc:UUID
        $this->addElement($xml, $invoice, 'cbc:UUID', $uuid);

        // cbc:IssueDate
        $this->addElement($xml, $invoice, 'cbc:IssueDate', $issueDate);

        // cbc:IssueTime
        $this->addElement($xml, $invoice, 'cbc:IssueTime', $issueTime);

        // cbc:InvoiceTypeCode (Código de tipo de factura: 01 = Factura de venta)
        $invoiceTypeCode = $xml->createElement('cbc:InvoiceTypeCode');
        $invoiceTypeCode->setAttribute('listID', '01');
        $invoiceTypeCode->setAttribute('listAgencyID', 'CO');
        $invoiceTypeCode->setAttribute('listName', 'Tipo de Operación');
        $invoiceTypeCode->setAttribute('listSchemeURI', 'urn:oasis:names:specification:ubl:codelist:gc:InvoiceTypeCode-1.0');
        $invoiceTypeCode->nodeValue = '01';
        $invoice->appendChild($invoiceTypeCode);

        // cbc:DocumentCurrencyCode
        $this->addElement($xml, $invoice, 'cbc:DocumentCurrencyCode', 'COP');

        // cbc:LineCountNumeric
        $this->addElement($xml, $invoice, 'cbc:LineCountNumeric', count($items));

        // cac:Signature (Firma digital - se agregará después)
        // Por ahora se deja vacío, se firmará después

        // cac:AccountingSupplierParty (Emisor)
        $supplierParty = $xml->createElement('cac:AccountingSupplierParty');
        $party = $xml->createElement('cac:Party');
        
        // Identificación del emisor
        $partyIdentification = $xml->createElement('cac:PartyIdentification');
        $id = $xml->createElement('cbc:ID', $company->tax_id ?? '');
        $id->setAttribute('schemeID', '4');
        $id->setAttribute('schemeName', 'NIT');
        $partyIdentification->appendChild($id);
        $party->appendChild($partyIdentification);

        // Nombre del emisor
        $partyLegalEntity = $xml->createElement('cac:PartyLegalEntity');
        $this->addElement($xml, $partyLegalEntity, 'cbc:RegistrationName', $company->name);
        if ($company->address) {
            $registrationAddress = $xml->createElement('cac:RegistrationAddress');
            $this->addElement($xml, $registrationAddress, 'cbc:AddressLine', $company->address);
            $partyLegalEntity->appendChild($registrationAddress);
        }
        $party->appendChild($partyLegalEntity);
        $supplierParty->appendChild($party);
        $invoice->appendChild($supplierParty);

        // cac:AccountingCustomerParty (Receptor)
        if ($customer) {
            $customerParty = $xml->createElement('cac:AccountingCustomerParty');
            $party = $xml->createElement('cac:Party');
            
            // Identificación del receptor
            $partyIdentification = $xml->createElement('cac:PartyIdentification');
            $docType = $customer->doc_type ?? 'CC';
            $docNum = $customer->doc_num ?? '';
            $id = $xml->createElement('cbc:ID', $docNum);
            
            // Mapear tipo de documento
            $schemeMap = [
                'CC' => ['schemeID' => '1', 'schemeName' => 'Cédula de Ciudadanía'],
                'CE' => ['schemeID' => '2', 'schemeName' => 'Cédula de Extranjería'],
                'NIT' => ['schemeID' => '4', 'schemeName' => 'NIT'],
                'TI' => ['schemeID' => '3', 'schemeName' => 'Tarjeta de Identidad'],
            ];
            $scheme = $schemeMap[$docType] ?? $schemeMap['CC'];
            $id->setAttribute('schemeID', $scheme['schemeID']);
            $id->setAttribute('schemeName', $scheme['schemeName']);
            $partyIdentification->appendChild($id);
            $party->appendChild($partyIdentification);

            // Nombre del receptor
            $partyLegalEntity = $xml->createElement('cac:PartyLegalEntity');
            $this->addElement($xml, $partyLegalEntity, 'cbc:RegistrationName', $customer->name ?? 'Cliente Genérico');
            $party->appendChild($partyLegalEntity);
            $customerParty->appendChild($party);
            $invoice->appendChild($customerParty);
        }

        // cac:TaxTotal (Totales de impuestos)
        if ($sale->total_tax_amount > 0) {
            $taxTotal = $xml->createElement('cac:TaxTotal');
            $this->addElement($xml, $taxTotal, 'cbc:TaxAmount', number_format($sale->total_tax_amount, 2, '.', ''));
            $taxAmount = $xml->createElement('cbc:TaxAmount');
            $taxAmount->setAttribute('currencyID', 'COP');
            $taxAmount->nodeValue = number_format($sale->total_tax_amount, 2, '.', '');
            $taxTotal->appendChild($taxAmount);
            $invoice->appendChild($taxTotal);
        }

        // cac:LegalMonetaryTotal (Totales monetarios)
        $monetaryTotal = $xml->createElement('cac:LegalMonetaryTotal');
        $this->addElement($xml, $monetaryTotal, 'cbc:LineExtensionAmount', number_format($sale->subtotal, 2, '.', ''), ['currencyID' => 'COP']);
        if ($sale->total_discount_amount > 0) {
            $this->addElement($xml, $monetaryTotal, 'cbc:TaxExclusiveAmount', number_format($sale->subtotal_after_discounts, 2, '.', ''), ['currencyID' => 'COP']);
            $this->addElement($xml, $monetaryTotal, 'cbc:AllowanceTotalAmount', number_format($sale->total_discount_amount, 2, '.', ''), ['currencyID' => 'COP']);
        }
        if ($sale->total_tax_amount > 0) {
            $this->addElement($xml, $monetaryTotal, 'cbc:TaxInclusiveAmount', number_format($sale->final_total, 2, '.', ''), ['currencyID' => 'COP']);
        }
        $this->addElement($xml, $monetaryTotal, 'cbc:PayableAmount', number_format($sale->final_total, 2, '.', ''), ['currencyID' => 'COP']);
        $invoice->appendChild($monetaryTotal);

        // cac:InvoiceLine (Líneas de factura)
        foreach ($items as $index => $item) {
            $invoiceLine = $xml->createElement('cac:InvoiceLine');
            $this->addElement($xml, $invoiceLine, 'cbc:ID', $index + 1);
            $this->addElement($xml, $invoiceLine, 'cbc:InvoicedQuantity', number_format($item->quantity ?? 1, 2, '.', ''), ['unitCode' => $item->unit_label ?? 'C62']);
            
            $lineExtensionAmount = $xml->createElement('cbc:LineExtensionAmount');
            $lineExtensionAmount->setAttribute('currencyID', 'COP');
            $lineExtensionAmount->nodeValue = number_format($item->subtotal, 2, '.', '');
            $invoiceLine->appendChild($lineExtensionAmount);

            // cac:Item
            $itemElement = $xml->createElement('cac:Item');
            $this->addElement($xml, $itemElement, 'cbc:Description', $item->product_name);
            $invoiceLine->appendChild($itemElement);

            // cac:Price
            $price = $xml->createElement('cac:Price');
            $priceAmount = $xml->createElement('cbc:PriceAmount');
            $priceAmount->setAttribute('currencyID', 'COP');
            $priceAmount->nodeValue = number_format($item->price, 2, '.', '');
            $price->appendChild($priceAmount);
            $invoiceLine->appendChild($price);

            $invoice->appendChild($invoiceLine);
        }

        return $xml->saveXML();
    }

    /**
     * Agregar elemento al XML
     */
    protected function addElement(\DOMDocument $xml, \DOMElement $parent, string $name, ?string $value, array $attributes = []): void
    {
        if ($value === null) {
            return;
        }

        $element = $xml->createElement($name, htmlspecialchars($value, ENT_XML1, 'UTF-8'));
        
        foreach ($attributes as $attrName => $attrValue) {
            $element->setAttribute($attrName, $attrValue);
        }

        $parent->appendChild($element);
    }

    /**
     * Generar UUID único
     */
    protected function generateUUID(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
}














