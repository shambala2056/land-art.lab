/**
 * Land-art Space — order book.
 *
 * Paste this into the Apps Script editor of the Google Sheet that should hold
 * the orders, then deploy it as a Web App. Setup instructions are at the bottom
 * of this file.
 *
 * It does three things:
 *   action "order"   append a new row when an invoice is created
 *   action "status"  update that row when the bank reports the outcome
 *   on "paid"        email the certificate and stamp when it went, and to whom
 *
 * Certificates are sent from this script rather than from the server, because
 * the buyer's name and email are already in the row — nothing has to be passed
 * anywhere, and no key has to be stored. They go from the sheet owner's own
 * Google account, so they arrive looking like they came from you.
 *
 * A certificate is sent once. If "Certificate sent" already has a date the row
 * is skipped, so a repeated callback cannot send a second one. To send again,
 * clear that cell and use Land-art Space → Send certificate.
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
  'Certificate sent',   // date the certificate went out — written automatically
  'Sent by',            // "automatic", or the name of whoever sent it by hand
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
    '', '', ''       // certificate sent, sent by, notes
  ]);
  return { ok: true, row: sheet.getLastRow() };
}

/* ── Гэрчилгээ ───────────────────────────────────────────────────────────────
 * Төлбөр батлагдмагц гэрчилгээг худалдан авагчийн имэйл рүү илгээж, илгээсэн
 * огноог хүснэгтэд тэмдэглэнэ.
 *
 * Яагаад Vercel биш, эндээс илгээдэг вэ: нэр, имэйл нь энэ мөрөнд аль хэдийн
 * байгаа тул хаашаа ч дамжуулах шаардлагагүй, түлхүүр хадгалах ч хэрэггүй.
 * Мөн энэ нь ТАНЫ Google хаягаас илгээгддэг тул хүлээн авагчид танигдана.
 *
 * Хоёр удаа илгээхгүй: "Certificate sent" багана дүүрсэн бол алгасна. Callback
 * давтагдвал ч хүн хоёр гэрчилгээ авахгүй.
 */
function sendCertificate(sheet, row) {
  var v = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  var reference = v[1], name = v[2], email = v[3], cell = v[4],
      pits = v[5], seedlings = v[6], alreadySent = v[13];

  if (alreadySent) return { sent: false, reason: 'already sent' };
  if (!email) {
    sheet.getRange(row, 16).setValue('No email on the order — certificate not sent');
    return { sent: false, reason: 'no email' };
  }

  var subject = 'Your trees at Erdene — certificate ' + reference;
  var lines = [
    'Dear ' + (name || 'sponsor') + ',',
    '',
    'Thank you. Your sponsorship is confirmed.',
    '',
    '  Reference    ' + reference,
    '  Planting     ' + pits + ' pits, ' + seedlings + ' Siberian elm',
    (cell ? '  Cell         ' + cell : ''),
    '  Site         Erdene sum, Dornogovi, Mongolia',
    '',
    'The trees are planted in the first planting window after this confirmation,',
    'three seedlings to a pit, 1.5 m apart. They are irrigated and maintained for',
    'ten years, counted in full twice a year, and any that do not survive are',
    'replanted at our cost.',
    '',
    'We will write once a year with what the ground is doing.',
    '',
    'Land-art Space',
    'Shambala Carbon Offsets LLC',
    'hello@shambala.today',
    'https://www.land-art.space'
  ].filter(function (l) { return l !== ''; }).join('\n');

  try {
    MailApp.sendEmail({ to: email, subject: subject, body: lines, name: 'Land-art Space' });
  } catch (err) {
    /* Тэмдэглээд өнгөрнө — гэрчилгээ илгээгдээгүй нь төлбөрийг унагаах ёсгүй. */
    sheet.getRange(row, 16).setValue('Certificate failed: ' + String(err).slice(0, 180));
    return { sent: false, reason: String(err) };
  }

  sheet.getRange(row, 14).setValue(new Date());   // Certificate sent
  sheet.getRange(row, 15).setValue('automatic');  // Sent by
  return { sent: true };
}

/* Хүснэгтийн цэснээс гараар дахин илгээх. Нэг буюу хэд хэдэн мөрийг сонгоод
   Land-art Space → Send certificate. Аль хэдийн илгээсэн бол алгасна — дахин
   илгээхийн тулд "Certificate sent" нүдийг эхлээд цэвэрлэнэ. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Land-art Space')
    .addItem('Send certificate for selected rows', 'sendSelected')
    .addToUi();
}

function sendSelected() {
  var sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== SHEET_NAME) {
    SpreadsheetApp.getUi().alert('Switch to the "' + SHEET_NAME + '" tab first.');
    return;
  }
  var sel = sheet.getActiveRange();
  var sent = 0, skipped = 0;
  for (var r = sel.getRow(); r < sel.getRow() + sel.getNumRows(); r++) {
    if (r < 2) continue;
    var res = sendCertificate(sheet, r);
    if (res.sent) sent++; else skipped++;
  }
  SpreadsheetApp.getUi().alert('Certificates sent: ' + sent + '\nSkipped: ' + skipped);
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

  /* Төлбөр батлагдсан үед л гэрчилгээ явна. Цуцлагдсан, хугацаа нь дууссан,
     амжилтгүй болсон захиалгад явахгүй. */
  var cert = null;
  if (String(b.status) === 'paid') cert = sendCertificate(sheet, row);

  return { ok: true, row: row, certificate: cert };
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
 * 5. Authorise when prompted. It asks for two things: to edit this spreadsheet,
 *    and to send email as you — the second is what sends the certificates.
 *    Google will warn that the app is unverified; that is expected for your own
 *    script, so choose Advanced → Go to project.
 *
 *    Sending limits: 1,500 emails a day on Google Workspace, 100 on a personal
 *    Gmail account. Both are far above the volume here.
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
