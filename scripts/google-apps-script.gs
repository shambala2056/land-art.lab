/**
 * Land-art Space — order book.
 *
 * Paste this into the Apps Script editor of the Google Sheet that should hold
 * the orders, then deploy it as a Web App. Setup instructions are at the bottom
 * of this file.
 *
 * It does two things:
 *   action "order"   append a new row when an invoice is created
 *   action "status"  update that row when the bank reports the outcome
 *
 * The certificate columns are never written by this script. They are for a
 * person to fill in, and are the record of what was actually sent.
 */

/* Must match SHEETS_WEBHOOK_SECRET in Vercel. Replace before deploying. */
var SECRET = 'PUT-THE-SAME-LONG-RANDOM-STRING-HERE';

var SHEET_NAME = 'Orders';

var HEADERS = [
  'Created',            // when the invoice was raised
  'Reference',          // our payment reference — the key for everything
  'Name',
  'Email',
  'Cell',
  'Pits',
  'Seedlings',
  'Amount',
  'Currency',
  'Status',             // pending → paid / cancelled / expired / failed
  'Paid at',
  'Bank txn',
  'Method',
  'Certificate sent',   // ← filled in by a person: date the certificate went out
  'Sent by',            // ← who sent it
  'Notes'
];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    /* An Apps Script Web App deployed for "anyone" is a public URL. Without
       this check, anyone who found it could write rows into the order book. */
    if (!body.secret || body.secret !== SECRET) {
      return reply({ ok: false, error: 'unauthorised' });
    }

    var sheet = getSheet();

    if (body.action === 'order')  return reply(appendOrder(sheet, body));
    if (body.action === 'status') return reply(updateStatus(sheet, body));
    return reply({ ok: false, error: 'unknown action' });

  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  /* Write the header row once, and keep it frozen and bold so the book stays
     readable as it grows. */
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }
  return sheet;
}

function appendOrder(sheet, b) {
  /* Idempotent: the same reference is never appended twice, so a retried
     request cannot double-count an order. */
  var row = findRow(sheet, b.reference);
  if (row > 0) return { ok: true, duplicate: true, row: row };

  sheet.appendRow([
    new Date(),
    b.reference,
    b.name || '',
    b.email || '',
    b.cell || '',
    b.pits || '',
    b.seedlings || '',
    b.amount || '',
    b.currency || '',
    b.status || 'pending',
    '', '', '',      // paid at, bank txn, method — filled by the status call
    '', '', ''       // certificate sent, sent by, notes — filled by a person
  ]);
  return { ok: true, row: sheet.getLastRow() };
}

function updateStatus(sheet, b) {
  var row = findRow(sheet, b.reference);
  if (row < 1) {
    /* The order row should already exist. If it does not — the sheet was
       unreachable when the invoice was raised — record what we know rather
       than losing a payment that has actually been made. */
    sheet.appendRow([
      new Date(), b.reference, '', '', '', '', '', '', '',
      b.status || '', new Date(), b.txnId || '', b.method || '',
      '', '', 'Status arrived before the order row existed'
    ]);
    return { ok: true, recovered: true, row: sheet.getLastRow() };
  }

  sheet.getRange(row, 10).setValue(b.status || '');        // Status
  if (String(b.status) === 'paid') {
    sheet.getRange(row, 11).setValue(new Date());          // Paid at
  }
  if (b.txnId)  sheet.getRange(row, 12).setValue(b.txnId); // Bank txn
  if (b.method) sheet.getRange(row, 13).setValue(b.method);// Method
  return { ok: true, row: row };
}

/* Reference is column B. Read the column once rather than cell by cell — a
   sheet with a few thousand rows would otherwise take seconds per lookup. */
function findRow(sheet, reference) {
  if (!reference) return -1;
  var last = sheet.getLastRow();
  if (last < 2) return -1;
  var refs = sheet.getRange(2, 2, last - 1, 1).getValues();
  for (var i = 0; i < refs.length; i++) {
    if (String(refs[i][0]) === String(reference)) return i + 2;
  }
  return -1;
}

function reply(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * SETUP
 *
 * 1. Create a Google Sheet. Name it whatever you like — the tab this writes to
 *    is created automatically and is called "Orders".
 *
 * 2. In the sheet: Extensions → Apps Script. Delete whatever is in the editor
 *    and paste this whole file.
 *
 * 3. Replace SECRET at the top with a long random string. Generate one with:
 *       node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
 *
 * 4. Deploy → New deployment → gear icon → Web app.
 *       Execute as:        Me
 *       Who has access:    Anyone
 *    "Anyone" is required because Vercel's servers call this without a Google
 *    login. The SECRET is what actually protects it.
 *
 * 5. Authorise when prompted. Google will warn that the app is unverified —
 *    that is expected for your own script; choose Advanced → Go to project.
 *
 * 6. Copy the Web app URL. It ends in /exec.
 *
 * 7. In Vercel → Environment Variables, add both, ticking Production and
 *    Preview, then redeploy:
 *       SHEETS_WEBHOOK_URL     the /exec URL
 *       SHEETS_WEBHOOK_SECRET  the same string as SECRET above
 *
 * If you change this script later you must Deploy → Manage deployments → edit →
 * New version, or the old code keeps running.
 * ──────────────────────────────────────────────────────────────────────────── */
