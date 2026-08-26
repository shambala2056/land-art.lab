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
 *   on "paid"        email the certificate — OFF until SEND_CERTIFICATES is true
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

/* The shared secret lives in Script Properties, not in this file.
 *
 * It used to be a string on this line, which meant this file could never be
 * replaced wholesale: every update had to preserve one line by hand, and twice
 * that went wrong — once the quotes were lost and the secret parsed as a
 * number, once the line was replaced by the placeholder and the sheet stopped
 * accepting writes. A property survives every paste.
 *
 * Set it once: Project Settings (the gear, left) → Script Properties →
 * Add script property → SHEETS_WEBHOOK_SECRET → the same string as in Vercel.
 */
function secret() {
  return PropertiesService.getScriptProperties().getProperty('SHEETS_WEBHOOK_SECRET') || '';
}

/* Certificates are off until you are ready for them. Orders are still recorded
 * and still marked paid — nothing else changes. Set this to true, save, and
 * redeploy when you want them to start going out automatically. Until then the
 * "Certificate sent" column stays empty and the menu item is the only way to
 * send one, which is a reasonable way to try it on a single row first. */
var SEND_CERTIFICATES = false;

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
  'Notes',
  /* Added after the sheet was already in use, so they go on the end rather
     than beside Name and Email where they belong: inserting a column in the
     middle would leave every row already in the sheet one place out of step
     with its own headings. */
  'Certificate name',   // what is printed on the certificate — often not "Name"
  'Phone',
  'Tree numbers'        // e.g. AM-001 to AM-003 — issued when the payment clears
];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    /* An Apps Script Web App deployed for "anyone" is a public URL. Without
       this check, anyone who found it could write rows into the order book. */
    var want = secret();
    if (!want) {
      /* Refuse rather than accept anything: an empty property must not become
         an open door. */
      return reply({ ok: false, error: 'SHEETS_WEBHOOK_SECRET is not set in Script Properties' });
    }
    if (!body.secret || body.secret !== want) {
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
    return sheet;
  }

  /* A sheet that already has rows keeps the headings it was created with, so
     columns added to HEADERS later would never get a name — the values would
     arrive under blank cells and nobody would know what they were. Top up the
     missing ones. Only ever appends to the right, and only where the cell is
     empty, so a heading someone has renamed by hand is left alone. */
  var width = sheet.getLastColumn();
  if (width < HEADERS.length) {
    var missing = HEADERS.slice(width);
    var target = sheet.getRange(1, width + 1, 1, missing.length);
    target.setValues([missing]);
    target.setFontWeight('bold');
    sheet.autoResizeColumns(width + 1, missing.length);
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
    '', '', '',      // certificate sent, sent by, notes
    b.certName || '',
    b.phone || '',
    ''               // tree numbers — issued when the payment clears
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
      pits = v[5], seedlings = v[6], alreadySent = v[13],
      certName = v[16], trees = v[18];

  if (alreadySent) return { sent: false, reason: 'already sent' };
  if (!email) {
    sheet.getRange(row, 16).setValue('No email on the order — certificate not sent');
    return { sent: false, reason: 'no email' };
  }

  var subject = 'Your trees at Erdene — certificate ' + reference;
  var lines = [
    'Dear ' + (certName || name || 'sponsor') + ',',
    '',
    'Thank you. Your sponsorship is confirmed.',
    '',
    '  Reference    ' + reference,
    '  Planting     ' + pits + ' pits, ' + seedlings + ' Siberian elm',
    (cell ? '  Cell         ' + cell : ''),
    (trees ? '  Tree numbers ' + trees : ''),
    (certName ? '  Certificate  ' + certName : ''),
    '  Site         Erdene sum, Dornogovi, Mongolia',
    '',
    'The trees are planted in the first planting window after this confirmation,',
    'three seedlings to a pit, 1.5 m apart. They are irrigated and maintained for',
    'ten years, and any that do not survive are replanted at our cost.',
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
      '', '', 'Status arrived before the order row existed',
      '', '', b.trees || ''
    ]);
    return { ok: true, recovered: true, row: sheet.getLastRow() };
  }

  sheet.getRange(row, 10).setValue(b.status || '');        // Status
  if (String(b.status) === 'paid') {
    sheet.getRange(row, 11).setValue(new Date());          // Paid at
  }
  if (b.txnId)  sheet.getRange(row, 12).setValue(b.txnId); // Bank txn
  if (b.method) sheet.getRange(row, 13).setValue(b.method);// Method
  /* The numbers the buyer's certificates carry. They do not exist when the
     order row is written — they are handed out only once the money is real —
     so this is the first moment they can be recorded. */
  if (b.trees) sheet.getRange(row, 19).setValue(b.trees);  // Tree numbers

  /* Төлбөр батлагдсан үед л гэрчилгээ явна. Цуцлагдсан, хугацаа нь дууссан,
     амжилтгүй болсон захиалгад явахгүй. SEND_CERTIFICATES унтраалттай үед
     бүртгэл хэвийн үргэлжилнэ — зөвхөн захидал явахгүй. */
  /* suppressCertificate is set when a payment is being recovered long after it
     happened — a reconciliation sweep. Some of those were already answered by
     hand, and a second certificate leaves the buyer working out which is real.
     The row still turns paid; only the email is held back. */
  var cert = null;
  if (String(b.status) === 'paid' && !SEND_CERTIFICATES) {
    /* The switch at the top of this file. It was declared and then never
       consulted, so every paid row emailed a certificate whichever way it was
       set — which only stayed hidden while status updates were not reaching
       this script at all. They reach it now. */
    cert = { sent: false, reason: 'SEND_CERTIFICATES is off' };
  } else if (String(b.status) === 'paid' && !b.suppressCertificate) {
    cert = sendCertificate(sheet, row);
  } else if (String(b.status) === 'paid') {
    cert = { sent: false, reason: 'suppressed — recovered payment' };
    sheet.getRange(row, 16).setValue('Recovered by reconciliation — certificate not auto-sent');
  }

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
 * 3. Put a long random string in Script Properties as SHEETS_WEBHOOK_SECRET
 *    (Project Settings → Script Properties). Generate one with:
 *       node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
 *
 * 4. Deploy → New deployment → gear icon → Web app.
 *       Execute as:        Me
 *       Who has access:    Anyone
 *    "Anyone" is required because Vercel's servers call this without a Google
 *    login. The secret is what actually protects it.
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
 *       SHEETS_WEBHOOK_SECRET  the same string as the script property
 *
 * If you change this script later you must Deploy → Manage deployments → edit →
 * New version, or the old code keeps running.
 * ──────────────────────────────────────────────────────────────────────────── */
