# Customer material bundles

Open **Inventory → Customer material bundles**. Order confirmation creates a
bundle from the accepted quote and notifies the warehouse with the customer's
name. The notification opens that customer's bundle page.

Select a customer to see all their installation orders and required materials.
Each order retains its own dispatch bundle so materials, delivery and warranty
remain linked to the correct installation site.

- Scan the unique serial on panels, inverters, batteries and other tracked units.
  Each accepted scan reserves the unit and links it to the bundle's project and
  customer. The serial appears beneath the material row.
- For loose materials, scan or enter the product SKU shown in the table. Enter
  the actual quantity, or leave quantity empty to count one unit. This supports
  fractional cable lengths as well as whole items.
- A barcode scanner that types into the field and sends Enter can submit scans.
  Manual serial/SKU entry also works.
- **Scan with camera** opens the phone or laptop camera and reads barcodes or QR
  codes locally in the browser. Allow camera access, keep the label in view, then
  check the detected code and quantity before selecting **Scan & link**. The camera
  stops after one read, when stopped manually, or when leaving the page. If the
  device has several cameras, select one from the camera list.
- Camera access needs HTTPS on the deployed website, or localhost for local
  development. Permission errors are shown beside the camera preview. USB and
  Bluetooth scanners can continue using the normal code field.
- Asset tags printed from the serial detail page now contain real Code 128
  barcodes encoding the exact serial number, with checksums and quiet zones.
- Incorrect serials, materials outside the bundle, reused tracked serials and
  quantities above the requirement are refused. Bundles awaiting stock become
  available after the missing materials are received.
- Dispatch becomes available after every required quantity is accounted for.
  Delivery confirmation continues to start warranties through the existing rules.

Warehouse staff and directors can scan and dispatch. Engineers can review the
bundles. Customer and sales accounts cannot open or submit warehouse operations.

The customer relationship is stored through `Serial.project.customer`; loose
materials are accounted for through the bundle's dispatch lines. No new database
migration is required.

Install updated dependencies with `pip install -r requirements.txt` from the
repository root, then `npm ci` and `npm run build` inside `frontend/`. The camera
decoder is loaded only when the camera is opened.
