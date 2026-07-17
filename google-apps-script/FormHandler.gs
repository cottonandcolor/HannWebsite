/**
 * Hannah Mara website form handler
 * --------------------------------
 * 1. Go to https://script.google.com while signed into yourspacewithhannah@gmail.com
 * 2. New project → paste this entire file into Code.gs
 * 3. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL
 * 5. Paste that URL into index.html as window.HANNAH_FORM_ENDPOINT
 */

var TO_EMAIL = 'yourspacewithhannah@gmail.com';

function doGet() {
  return ContentService
    .createTextOutput('Hannah Mara form endpoint is live.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    var subject = data._subject ||
      ('Website inquiry: ' + (data.inquiry || data.formType || 'General') + ' — ' + (data.name || 'Visitor'));

    var lines = [
      'New website lead',
      '----------------',
      'Name: ' + (data.name || ''),
      'Email: ' + (data.email || ''),
      'Phone: ' + (data.phone || ''),
      'Inquiry: ' + (data.inquiry || ''),
      'Address: ' + (data.address || ''),
      'Timeline: ' + (data.timeline || ''),
      'Area: ' + (data.area || ''),
      'Beds: ' + (data.beds || ''),
      'Baths: ' + (data.baths || ''),
      'Max price: ' + (data.max_price || ''),
      'Form: ' + (data.formType || ''),
      '',
      'Message:',
      (data.message || ''),
      '',
      'Sent from yourspacewithhannah.com'
    ];

    MailApp.sendEmail({
      to: TO_EMAIL,
      replyTo: data.email || TO_EMAIL,
      subject: subject,
      body: lines.join('\n')
    });

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
