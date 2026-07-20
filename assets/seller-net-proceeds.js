const $ = id => document.getElementById(id);
const form = $('calculator-form');
const storageKey = 'hannahSellerNetCalculatorV1';
const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});
const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function parseMoney(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseNonNegative(value) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatMoneyInput(input) {
  const value = parseMoney(input.value);
  input.value = Math.round(value).toLocaleString('en-US');
}

function currency(value) {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0);
}

function negativeCurrency(value) {
  return value > 0 ? `− ${currency(value)}` : currency(0);
}

function futureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function estimateTitlePremium(price) {
  if (price <= 0) return 0;
  if (price <= 25000) return 308;
  if (price <= 100000) {
    return Math.round(308 + ((price - 25000) / 75000) * (780 - 308));
  }
  if (price <= 1000000) return Math.round((price - 100000) * 0.00494 + 780);
  if (price <= 5000000) return Math.round((price - 1000000) * 0.00406 + 5226);
  if (price <= 15000000) return Math.round((price - 5000000) * 0.00335 + 21466);
  if (price <= 25000000) return Math.round((price - 15000000) * 0.00238 + 54966);
  if (price <= 50000000) return Math.round((price - 25000000) * 0.00143 + 78766);
  if (price <= 100000000) return Math.round((price - 50000000) * 0.00129 + 114516);
  return Math.round((price - 100000000) * 0.00116 + 179016);
}

function amountByMode(mode, value, salePrice) {
  const amount = parseNonNegative(value);
  if (mode === 'percent') return salePrice * amount / 100;
  if (mode === 'flat') return amount;
  return 0;
}

function taxProration() {
  if ($('taxMode').value === 'manual') return parseMoney($('manualTaxes').value);
  const annual = parseMoney($('annualTaxes').value);
  const dateValue = $('closingDate').value;
  if (!annual || !dateValue) return 0;
  const closing = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(closing.getTime())) return 0;
  const start = new Date(closing.getFullYear(), 0, 1, 12);
  const end = new Date(closing.getFullYear() + 1, 0, 1, 12);
  const day = Math.floor((closing - start) / 86400000) + 1;
  const daysInYear = Math.round((end - start) / 86400000);
  return annual * day / daysInYear;
}

function getValues(saleOverride = null) {
  const salePrice = saleOverride ?? parseMoney($('salePrice').value);
  const listingComp = amountByMode($('listingCompMode').value, $('listingCompValue').value, salePrice);
  const buyerComp = amountByMode($('buyerCompMode').value, $('buyerCompValue').value, salePrice);
  const sellerContribution = amountByMode(
    $('sellerContributionMode').value,
    $('sellerContributionValue').value,
    salePrice
  );

  let titlePolicy = 0;
  if ($('titleMode').value === 'auto') titlePolicy = estimateTitlePremium(salePrice);
  if ($('titleMode').value === 'custom') titlePolicy = parseMoney($('titleCustom').value);

  const mortgage = parseMoney($('mortgagePayoff').value);
  const secondLien = parseMoney($('secondLien').value);
  const escrow = parseMoney($('escrowFees').value);
  const survey = parseMoney($('surveyCost').value);
  const warranty = parseMoney($('homeWarranty').value);
  const hoa = parseMoney($('hoaFees').value);
  const taxes = taxProration();
  const admin = parseMoney($('adminFees').value);
  const repair = parseMoney($('repairCredit').value);
  const preClosing = parseMoney($('preClosingRepairs').value);
  const prep = parseMoney($('prepExpenses').value);
  const other = parseMoney($('otherExpenses').value);

  const payoff = mortgage + secondLien;
  const broker = listingComp + buyerComp;
  const closing = titlePolicy + escrow + survey + warranty + admin;
  const prorations = hoa + taxes;
  const otherCosts = sellerContribution + repair + preClosing + prep + other;
  const deductions = payoff + broker + closing + prorations + otherCosts;
  const net = salePrice - deductions;

  return {
    salePrice, mortgage, secondLien, payoff, listingComp, buyerComp, broker,
    titlePolicy, escrow, survey, warranty, hoa, taxes, admin, closing, prorations,
    sellerContribution, repair, preClosing, prep, other, otherCosts, deductions, net
  };
}

function setWidth(id, amount, salePrice) {
  const percentage = salePrice > 0 ? Math.max(0, Math.min(100, amount / salePrice * 100)) : 0;
  $(id).style.width = `${percentage}%`;
}

function updateResults() {
  const v = getValues();
  $('netResult').textContent = currency(v.net);
  $('netResult').classList.toggle('negative', v.net < 0);
  $('netPercent').textContent = v.salePrice > 0
    ? `${numberFormatter.format(v.net / v.salePrice * 100)}% of expected sale price`
    : 'Enter an expected sale price';

  $('salePriceResult').textContent = currency(v.salePrice);
  $('payoffResult').textContent = negativeCurrency(v.payoff);
  $('brokerResult').textContent = negativeCurrency(v.broker);
  $('closingResult').textContent = negativeCurrency(v.closing);
  $('prorationResult').textContent = negativeCurrency(v.prorations);
  $('otherResult').textContent = negativeCurrency(v.otherCosts);
  $('deductionsResult').textContent = negativeCurrency(v.deductions);

  setWidth('chartNet', Math.max(v.net, 0), v.salePrice);
  setWidth('chartPayoff', v.payoff, v.salePrice);
  setWidth('chartBroker', v.broker, v.salePrice);
  setWidth('chartClosing', v.closing + v.prorations, v.salePrice);
  setWidth('chartOther', v.otherCosts, v.salePrice);

  updateScenarioResults();
  saveState();
}

function updateScenarioDefaults(force = false) {
  const sale = parseMoney($('salePrice').value);
  if (force || !$('scenarioLow').dataset.edited) $('scenarioLow').value = Math.round(sale * .95).toLocaleString('en-US');
  if (force || !$('scenarioExpected').dataset.edited) $('scenarioExpected').value = Math.round(sale).toLocaleString('en-US');
  if (force || !$('scenarioHigh').dataset.edited) $('scenarioHigh').value = Math.round(sale * 1.05).toLocaleString('en-US');
}

function updateScenarioResults() {
  const low = getValues(parseMoney($('scenarioLow').value));
  const expected = getValues(parseMoney($('scenarioExpected').value));
  const high = getValues(parseMoney($('scenarioHigh').value));
  $('scenarioLowResult').textContent = currency(low.net);
  $('scenarioExpectedResult').textContent = currency(expected.net);
  $('scenarioHighResult').textContent = currency(high.net);
}

function updateModeControls() {
  const mapping = [
    ['listingCompMode', 'listingCompValue', 'listingCompSuffix'],
    ['buyerCompMode', 'buyerCompValue', 'buyerCompSuffix'],
    ['sellerContributionMode', 'sellerContributionValue', 'sellerContributionSuffix']
  ];
  mapping.forEach(([modeId, valueId, suffixId]) => {
    const mode = $(modeId).value;
    $(valueId).disabled = mode === 'none';
    $(suffixId).textContent = mode === 'percent' ? '%' : mode === 'flat' ? '$' : '—';
  });

  const titleMode = $('titleMode').value;
  $('titleCustom').disabled = titleMode !== 'custom';

  const manual = $('taxMode').value === 'manual';
  $('manualTaxesWrap').classList.toggle('hidden', !manual);
  $('annualTaxesWrap').classList.toggle('hidden', manual);
}

function stateObject() {
  const ids = [
    'propertyAddress','salePrice','closingDate','mortgagePayoff','secondLien',
    'listingCompMode','listingCompValue','buyerCompMode','buyerCompValue',
    'titleMode','titleCustom','escrowFees','surveyCost','homeWarranty','hoaFees',
    'taxMode','annualTaxes','manualTaxes','adminFees',
    'sellerContributionMode','sellerContributionValue','repairCredit',
    'preClosingRepairs','prepExpenses','otherExpenses','otherDescription',
    'scenarioLow','scenarioExpected','scenarioHigh'
  ];
  const data = {};
  ids.forEach(id => data[id] = $(id).value);
  return data;
}

function saveState() {
  try { localStorage.setItem(storageKey, JSON.stringify(stateObject())); } catch (error) {}
}

function loadState() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(storageKey)); } catch (error) {}
  if (data) {
    Object.entries(data).forEach(([id, value]) => {
      if ($(id)) $(id).value = value;
    });
    ['scenarioLow','scenarioExpected','scenarioHigh'].forEach(id => $(id).dataset.edited = 'true');
  } else {
    $('closingDate').value = futureDate(45);
    updateScenarioDefaults(true);
  }
}

function resetCalculator() {
  try { localStorage.removeItem(storageKey); } catch (error) {}
  form.reset();
  $('salePrice').value = '500,000';
  $('closingDate').value = futureDate(45);
  document.querySelectorAll('[data-money]').forEach(input => {
    if (!['salePrice','scenarioLow','scenarioExpected','scenarioHigh'].includes(input.id)) input.value = '0';
  });
  ['scenarioLow','scenarioExpected','scenarioHigh'].forEach(id => {
    delete $(id).dataset.edited;
  });
  updateScenarioDefaults(true);
  updateModeControls();
  updateResults();
  showToast('Calculator reset.');
}

function buildReport() {
  const v = getValues();
  const address = $('propertyAddress').value.trim() || 'Property address not entered';
  const closing = $('closingDate').value || 'Not entered';
  const otherDescription = $('otherDescription').value.trim();

  const rows = [
    ['Expected sale price', v.salePrice],
    ['Mortgage payoff', -v.mortgage],
    ['Second mortgage, HELOC or other lien', -v.secondLien],
    ['Listing broker compensation', -v.listingComp],
    ['Buyer broker compensation or seller contribution', -v.buyerComp],
    ["Owner's title policy", -v.titlePolicy],
    ['Escrow, title and settlement fees', -v.escrow],
    ['Survey', -v.survey],
    ['Home warranty', -v.warranty],
    ['HOA and related fees', -v.hoa],
    ['Estimated property-tax proration', -v.taxes],
    ['Other title or administrative fees', -v.admin],
    ['Seller-paid buyer closing-cost contribution', -v.sellerContribution],
    ['Repair allowance or credit', -v.repair],
    ['Seller-paid improvements or repairs', -v.preClosing],
    ['Moving, staging, cleaning or preparation', -v.prep],
    [otherDescription || 'Other seller expenses', -v.other]
  ];

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Seller Net Proceeds Estimate</title>
<style>
body{font-family:Arial,sans-serif;color:#191815;margin:42px;line-height:1.45}
h1,h2{font-family:Georgia,serif;margin:0}.top{border-bottom:3px solid #c7a958;padding-bottom:20px}
.meta{margin-top:12px;color:#666;font-size:12px}.net{margin:30px 0;padding:22px;background:#191815;color:#fff}
.net span{display:block;color:#d7bd75;font-size:11px;text-transform:uppercase;letter-spacing:.13em}
.net strong{display:block;margin-top:5px;font-family:Georgia,serif;font-size:44px}
table{width:100%;border-collapse:collapse}td{padding:9px 0;border-bottom:1px solid #ddd;font-size:12px}
td:last-child{text-align:right;font-weight:700}.total td{padding-top:15px;font-size:14px;border-top:2px solid #191815}
.disclaimer{margin-top:30px;padding-top:18px;border-top:1px solid #ccc;color:#666;font-size:9px}
.contact{margin-top:25px;font-size:11px}
@media print{body{margin:20px}}
</style></head>
<body>
<div class="top"><h1>Seller Net Proceeds Estimate</h1><div class="meta">${address}<br>Estimated closing date: ${closing}<br>Prepared: ${new Date().toLocaleDateString()}</div></div>
<div class="net"><span>Estimated Net Proceeds</span><strong>${currency(v.net)}</strong></div>
<table>${rows.map(([label, amount]) => `<tr><td>${label}</td><td>${amount < 0 ? '− ' : ''}${currency(Math.abs(amount))}</td></tr>`).join('')}
<tr class="total"><td>Total estimated deductions</td><td>− ${currency(v.deductions)}</td></tr>
<tr class="total"><td>Estimated net proceeds</td><td>${currency(v.net)}</td></tr></table>
<div class="contact"><strong>Hannah Mara, REALTOR® · Hannah Mara Realty · Full Circle Real Estate</strong><br>512-680-1171 · yourspacewithhannah@gmail.com</div>
<div class="disclaimer">This calculator is provided for general educational and planning purposes only. It is not a settlement statement, appraisal, comparative market analysis, mortgage payoff quote, tax calculation or guarantee of proceeds. Actual costs and proceeds depend on the contract, negotiated broker compensation, lender payoff, title-company charges, prorations, repairs, concessions and other transaction-specific expenses. Broker compensation is not set by law and is fully negotiable.</div>
</body></html>`;
}

function openPrintReport(saveAsPdf = false) {
  const report = window.open('', '_blank');
  if (!report) {
    showToast('Please allow pop-ups to create the report.');
    return;
  }
  report.document.open();
  report.document.write(buildReport());
  report.document.close();
  report.focus();
  setTimeout(() => {
    if (saveAsPdf) showToast('In the print dialog, choose “Save as PDF.”');
    report.print();
  }, 350);
}

function openLeadDialog() {
  $('leadAddress').value = $('propertyAddress').value;
  $('leadDialog').showModal();
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 3200);
}

document.querySelectorAll('[data-money]').forEach(input => {
  input.addEventListener('focus', () => {
    input.value = input.value.replace(/,/g, '');
    input.select();
  });
  input.addEventListener('blur', () => {
    formatMoneyInput(input);
    updateResults();
  });
  input.addEventListener('input', updateResults);
});

['listingCompValue','buyerCompValue','sellerContributionValue'].forEach(id => {
  $(id).addEventListener('input', updateResults);
});

['listingCompMode','buyerCompMode','titleMode','taxMode','sellerContributionMode'].forEach(id => {
  $(id).addEventListener('change', () => {
    updateModeControls();
    updateResults();
  });
});

$('salePrice').addEventListener('input', () => {
  updateScenarioDefaults(false);
  updateResults();
});

$('closingDate').addEventListener('change', updateResults);
$('otherDescription').addEventListener('input', saveState);
$('propertyAddress').addEventListener('input', saveState);

['scenarioLow','scenarioExpected','scenarioHigh'].forEach(id => {
  $(id).addEventListener('input', () => {
    $(id).dataset.edited = 'true';
    updateScenarioResults();
    saveState();
  });
});

$('printButton').addEventListener('click', () => openPrintReport(false));
$('pdfButton').addEventListener('click', () => openPrintReport(true));
$('resetButton').addEventListener('click', resetCalculator);
$('personalizedButton').addEventListener('click', openLeadDialog);
$('ctaPersonalizedButton').addEventListener('click', openLeadDialog);
$('dialogClose').addEventListener('click', () => $('leadDialog').close());

$('leadDialog').addEventListener('click', event => {
  const rect = $('leadDialog').getBoundingClientRect();
  if (
    event.clientX < rect.left || event.clientX > rect.right ||
    event.clientY < rect.top || event.clientY > rect.bottom
  ) $('leadDialog').close();
});

$('leadForm').addEventListener('submit', event => {
  event.preventDefault();
  const v = getValues();
  const subject = encodeURIComponent(`Personalized seller net sheet request — ${$('leadAddress').value || 'property'}`);
  const body = encodeURIComponent(
`Hi Hannah,

I would like a personalized seller net sheet.

Name: ${$('leadName').value}
Phone: ${$('leadPhone').value}
Email: ${$('leadEmail').value}
Preferred contact method: ${$('leadContactMethod').value}
Property address: ${$('leadAddress').value}
Expected sale price: ${currency(v.salePrice)}
Estimated mortgage and lien payoff: ${currency(v.payoff)}
Calculator estimated net proceeds: ${currency(v.net)}

Message:
${$('leadMessage').value}

I understand this calculator result is a preliminary planning estimate.`
  );
  window.location.href = `mailto:yourspacewithhannah@gmail.com?subject=${subject}&body=${body}`;
  $('leadDialog').close();
});

$('resultDate').textContent = new Date().toLocaleDateString();
$('year').textContent = new Date().getFullYear();
loadState();
updateModeControls();
document.querySelectorAll('[data-money]').forEach(formatMoneyInput);
updateScenarioDefaults(false);
updateResults();
