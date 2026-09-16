const CONFIG = window.PORIKROMA_CONFIG || {};
const hasSupabase = CONFIG.supabaseUrl && !CONFIG.supabaseUrl.includes("YOUR-PROJECT")
  && CONFIG.supabaseAnonKey && !CONFIG.supabaseAnonKey.includes("YOUR_SUPABASE");

const sb = hasSupabase ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey) : null;

const PANDALS = {
  south: [
    "Behala Club Sarbojanin Durgotsav Committee","Behala Nutan Dal","Thakurpukur State Bank Park Sarbojanin",
    "Ajeya Sanghati","41 Pally Club","Vivekananda Park Athletic Club","Vivekananda Sporting Club",
    "Pally Unnayan Samity","Naktala Udayan Sangha","Kendua Shanti Sangha","Santoshpur Lake Pally",
    "Santoshpur Trikon Park","Rajdanga Naba Uday Sangha","Bose Pukur Sitala Mandir","Hindusthan Park",
    "Samajsebi","Shibmandir Sarbojanin","Mudiali Club","Pratapaditya Road Tricon Park","Badamtala Ashar Sangha",
    "Paddapukur Youth Association","Chakraberia Sarbojanin","Alipore Sarbojanin","25 Pally Club"
  ],
  north: [
    "Santosh Mitra Square","33 Pally Beleghata","Beleghata Sandhani","Mitali Club","DB Block Sarbojanin",
    "AK Block Salt Lake","EC Block Salt Lake","Telengabagan Sarbojanin","Ultadanga Karbagan",
    "Ultadanga Bidhan Sangha","Ultadanga Jagaran Sangha","Nalin Sarkar Street","Sikdar Bagan",
    "Kumartuli Park","Ahiritola Sarbojanin","Ahiritola Sarodotsab","Jagat Mukherjee Park",
    "Maniktala Chaltabagan","Chinar Park Adhibasibrinda","Aswininagar Bandhumahal",
    "Masterda Smriti Sangha","Kestopur Prafullakanan","Dum Dum Park Yubak Brinda","Dum Dum Bharat Chakra",
    "Dum Dum Park Sarbojanin","Shyamnagar Road Dum Dum Tarun Dal","Yuba Sangha Telipukur",
    "Bandhudal Sporting Club","Sovabazar Beniatola Sarbojanin","Attarpara Unnayan Samity"
  ]
};

let lang = "en";
let settings = { pass_price: 950, delivery_charge: 0, max_passes_per_booking: 10, available_passes: 1000 };

const t = {
  en: {
    home:"Home", book:"Book Pass", pandals:"Pandal List", map:"Map", about:"About", contact:"Contact",
    hero:"Experience Kolkata Durga Puja Like Never Before",
    sub:"Explore selected participating Durga Puja pandals with the Porikroma 2026 Pass and make your pandal-hopping experience more organized.",
    bookNow:"Book Your Pass", explore:"Explore Pandal List", pass:"Durga Puja Invitee Card 2026",
    how:"How it works", step1:"Choose your passes", step2:"Submit your booking", step3:"Pay by UPI and submit UTR", step4:"Wait for payment verification",
    selected:"Selected participating pandals", note:"Entry conditions can vary by participating Puja committee. Please check the latest information before visiting.",
    faq:"Frequently Asked Questions", contactTitle:"Contact Porikroma", email:"Email", send:"Send Message",
    status:"Check Booking Status", lookup:"Enter Booking ID and phone number"
  },
  bn: {
    home:"হোম", book:"পাস বুক করুন", pandals:"প্যান্ডেল তালিকা", map:"মানচিত্র", about:"আমাদের সম্পর্কে", contact:"যোগাযোগ",
    hero:"কলকাতার দুর্গাপূজা উপভোগ করুন নতুনভাবে",
    sub:"Porikroma 2026 Pass-এর মাধ্যমে নির্বাচিত অংশগ্রহণকারী দুর্গাপূজা প্যান্ডেল ঘুরুন এবং আপনার প্যান্ডেল-হপিং আরও সংগঠিত করুন।",
    bookNow:"পাস বুক করুন", explore:"প্যান্ডেল তালিকা দেখুন", pass:"দুর্গাপূজা ইনভাইটী কার্ড ২০২৬",
    how:"কীভাবে কাজ করে", step1:"পাস নির্বাচন করুন", step2:"বুকিং জমা দিন", step3:"UPI পেমেন্ট করে UTR দিন", step4:"পেমেন্ট যাচাইয়ের অপেক্ষা করুন",
    selected:"নির্বাচিত অংশগ্রহণকারী প্যান্ডেল", note:"প্রতিটি পূজা কমিটির প্রবেশের নিয়ম আলাদা হতে পারে। যাওয়ার আগে সর্বশেষ তথ্য যাচাই করুন।",
    faq:"সাধারণ প্রশ্ন", contactTitle:"Porikroma-র সঙ্গে যোগাযোগ", email:"ইমেল", send:"বার্তা পাঠান",
    status:"বুকিং স্ট্যাটাস দেখুন", lookup:"Booking ID ও ফোন নম্বর দিন"
  }
};

function escapeHtml(v="") {
  return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function money(n) { return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n); }
function setRoute(route) {
  location.hash = route;
  render(route);
}
function pageShell(content) { return `<div class="page">${content}</div>`; }

async function loadSettings() {
  if (!sb) return;
  const { data } = await sb.from("site_settings").select("key,value");
  if (data) data.forEach(x => { try { settings[x.key] = JSON.parse(x.value); } catch { settings[x.key] = x.value; } });
}

function homePage() {
  const x=t[lang];
  return pageShell(`
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">✦ PORIKROMA 2026 ✦</div>
        <h1>${x.hero}</h1>
        <p>${x.sub}</p>
        <div class="hero-actions"><a class="btn primary" href="#book">${x.bookNow}</a><a class="btn ghost" href="#pandals">${x.explore}</a></div>
        <div class="trust-row"><span>🎫 ₹${settings.pass_price} / pass</span><span>📍 Kolkata</span><span>📱 Mobile friendly</span></div>
      </div>
      <div class="hero-art"><div class="lotus">✦</div><div class="hero-card"><span>${x.pass}</span><strong>${money(settings.pass_price)}</strong><small>${x.selected}</small></div></div>
    </section>
    <section class="section">
      <div class="section-head"><div><div class="eyebrow">PORIKROMA</div><h2>${x.how}</h2></div></div>
      <div class="steps">
        ${[x.step1,x.step2,x.step3,x.step4].map((s,i)=>`<div class="step"><b>0${i+1}</b><h3>${s}</h3></div>`).join("")}
      </div>
    </section>
    <section class="section split">
      <div><div class="eyebrow">2026 PASS</div><h2>${x.pass}</h2><p class="large">A convenient way to organize your Kolkata Puja pandal-hopping plans.</p><a class="btn primary" href="#book">${x.bookNow}</a></div>
      <div class="info-card"><span class="big-icon">🪔</span><h3>${x.selected}</h3><p>${x.note}</p></div>
    </section>
    <section class="section"><div class="banner"><div><h2>${x.status}</h2><p>Check your booking after submitting your payment reference.</p></div><a class="btn light" href="#status">Check Status</a></div></section>
  `);
}

function bookPage() {
  return pageShell(`
    <div class="section-head centered"><div class="eyebrow">PORIKROMA 2026</div><h1>Book Your Pass</h1><p>₹${settings.pass_price} per pass</p></div>
    <form id="bookingForm" class="form-card">
      <div class="grid2">
        <label>Full Name *<input name="customer_name" required maxlength="100"></label>
        <label>Phone Number *<input name="phone" required inputmode="tel" pattern="[0-9+ ()-]{8,20}"></label>
        <label>Email *<input name="email" type="email" required maxlength="150"></label>
        <label>Number of Passes *<input id="qty" name="quantity" type="number" min="1" max="${settings.max_passes_per_booking}" value="1" required></label>
      </div>
      <label>Address <textarea name="address" id="address" rows="3" placeholder="Required for delivery"></textarea></label>
      <label class="check"><input type="checkbox" name="delivery" id="delivery"> I need the passes delivered to my location</label>
      <div class="price-box"><div><span>Subtotal</span><strong id="subtotal">${money(settings.pass_price)}</strong></div><div><span>Delivery</span><strong id="deliveryPrice">${money(0)}</strong></div><div class="total"><span>Total Payable</span><strong id="total">${money(settings.pass_price)}</strong></div></div>
      <button class="btn primary full" type="submit">Continue to UPI Payment</button>
      <p class="form-note">Your booking is not confirmed until payment is verified by Porikroma.</p>
      <div id="bookingMsg"></div>
    </form>
  `);
}

function updatePrice() {
  const q=Math.max(1,Math.min(settings.max_passes_per_booking,Number(document.querySelector("#qty")?.value||1)));
  const delivery=document.querySelector("#delivery")?.checked;
  const sub=q*Number(settings.pass_price);
  const d=delivery?Number(settings.delivery_charge):0;
  if(document.querySelector("#subtotal")) document.querySelector("#subtotal").textContent=money(sub);
  if(document.querySelector("#deliveryPrice")) document.querySelector("#deliveryPrice").textContent=money(d);
  if(document.querySelector("#total")) document.querySelector("#total").textContent=money(sub+d);
}
async function createBooking(e) {
  e.preventDefault();
  const f=new FormData(e.target);
  const quantity=Number(f.get("quantity"));
  const delivery=f.get("delivery")==="on";
  if(quantity<1 || quantity>settings.max_passes_per_booking) return showMsg("bookingMsg","Invalid quantity.","error");
  if(delivery && !String(f.get("address")||"").trim()) return showMsg("bookingMsg","Address is required for delivery.","error");
  if(!sb) return showMsg("bookingMsg","Demo mode: connect Supabase in js/config.js before accepting real bookings.","error");
  const btn=e.target.querySelector("button[type=submit]"); btn.disabled=true; btn.textContent="Creating booking…";
  const {data,error}=await sb.rpc("create_booking",{
    p_customer_name:f.get("customer_name"), p_phone:f.get("phone"), p_email:f.get("email"),
    p_address:f.get("address")||"", p_quantity:quantity, p_delivery_required:delivery
  });
  btn.disabled=false; btn.textContent="Continue to UPI Payment";
  if(error) return showMsg("bookingMsg",error.message,"error");
  const b=Array.isArray(data)?data[0]:data;
  sessionStorage.setItem("lastBooking",JSON.stringify(b));
  location.hash="payment";
  render("payment");
}
function paymentPage() {
  const b=JSON.parse(sessionStorage.getItem("lastBooking")||"null");
  if(!b) return pageShell(`<section class="section centered"><h1>No booking found</h1><a class="btn primary" href="#book">Start booking</a></section>`);
  const qr=CONFIG.upiQrUrl ? `<img class="qr" src="${escapeHtml(CONFIG.upiQrUrl)}" alt="UPI QR">` : `<div class="qr-placeholder">UPI QR<br><small>Add QR URL in js/config.js</small></div>`;
  return pageShell(`<section class="section narrow"><div class="section-head centered"><div class="eyebrow">BOOKING ${escapeHtml(b.booking_id)}</div><h1>Pay via UPI</h1><p>Total: <strong>${money(b.total_amount)}</strong></p></div>
    <div class="payment-card">${qr}<div class="upi-row"><span>UPI ID</span><strong>${escapeHtml(CONFIG.upiId||"Not configured")}</strong><button class="copy" id="copyUpi">Copy</button></div>
      <p>After payment, enter the UTR/transaction reference below. Payment will remain pending until an admin verifies it.</p>
      <form id="paymentForm"><label>UTR / Transaction ID *<input name="utr" required maxlength="80"></label><button class="btn primary full">Submit Payment Reference</button><div id="paymentMsg"></div></form>
    </div></section>`);
}
async function submitPayment(e) {
  e.preventDefault(); const b=JSON.parse(sessionStorage.getItem("lastBooking")||"null"); const utr=new FormData(e.target).get("utr");
  if(!sb||!b) return;
  const {error}=await sb.from("bookings").update({transaction_reference:utr,payment_status:"Submitted",booking_status:"Payment Submitted"}).eq("id",b.id);
  if(error) return showMsg("paymentMsg",error.message,"error");
  sessionStorage.removeItem("lastBooking"); sessionStorage.setItem("successBooking",JSON.stringify({booking_id:b.booking_id,total_amount:b.total_amount}));
  location.hash="success"; render("success");
}
function successPage() {
  const b=JSON.parse(sessionStorage.getItem("successBooking")||"null");
  return pageShell(`<section class="section narrow centered"><div class="success-icon">✓</div><div class="eyebrow">PORIKROMA 2026</div><h1>Booking Submitted</h1><p>Your payment reference has been submitted for verification.</p>${b?`<div class="success-card"><span>Booking ID</span><strong>${escapeHtml(b.booking_id)}</strong><span>Amount</span><strong>${money(b.total_amount)}</strong><span>Status</span><strong>Payment Submitted</strong></div>`:""}<a class="btn primary" href="#status">Check Booking Status</a></section>`);
}
function statusPage() {
  return pageShell(`<section class="section narrow"><div class="section-head centered"><div class="eyebrow">PORIKROMA 2026</div><h1>${t[lang].status}</h1><p>${t[lang].lookup}</p></div><form id="statusForm" class="form-card"><label>Booking ID *<input name="booking_id" placeholder="POR-2026-000001" required></label><label>Phone Number *<input name="phone" required></label><button class="btn primary full">Find Booking</button><div id="statusMsg"></div></form><div id="statusResult"></div></section>`);
}
async function lookupBooking(e) {
  e.preventDefault(); if(!sb) return showMsg("statusMsg","Connect Supabase first.","error");
  const f=new FormData(e.target);
  const {data,error}=await sb.from("bookings_public").select("*").eq("booking_id",f.get("booking_id")).eq("phone",f.get("phone")).maybeSingle();
  if(error||!data) return showMsg("statusMsg","Booking not found. Check your Booking ID and phone number.","error");
  document.querySelector("#statusResult").innerHTML=`<div class="result-card"><h3>${escapeHtml(data.booking_id)}</h3><p><span>Passes</span><strong>${data.quantity}</strong></p><p><span>Amount</span><strong>${money(data.total_amount)}</strong></p><p><span>Payment</span><strong>${escapeHtml(data.payment_status)}</strong></p><p><span>Booking</span><strong>${escapeHtml(data.booking_status)}</strong></p></div>`;
}
function pandalsPage() {
  const make=(title,arr)=>`<div class="pandal-group"><h2>${title}</h2><div class="pandal-grid">${arr.map((p,i)=>`<article class="pandal"><span>${String(i+1).padStart(2,"0")}</span><h3>${escapeHtml(p)}</h3><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p+", Kolkata")}">Directions ↗</a></article>`).join("")}</div></div>`;
  return pageShell(`<section class="section"><div class="section-head"><div class="eyebrow">PORIKROMA MAP</div><h1>Pandal List 2026</h1><p>Only pandals confirmed as participating should be marketed as included in the pass.</p></div>${make("South Kolkata",PANDALS.south)}${make("North Kolkata",PANDALS.north)}</section>`);
}
function mapPage() {
  return pageShell(`<section class="section"><div class="section-head"><div class="eyebrow">PORIKROMA MAP</div><h1>Explore Kolkata Pandals</h1><p>Use the direction links on the Pandal List to open locations in Google Maps. Exact coordinates can be added from the admin dashboard.</p></div><div class="map-box"><div class="map-pin">📍</div><h2>Kolkata Durga Puja</h2><p>Choose a pandal from the list to navigate.</p><a class="btn primary" href="#pandals">View Pandal List</a></div></section>`);
}
function aboutPage() { return pageShell(`<section class="section narrow"><div class="eyebrow">ABOUT PORIKROMA</div><h1>Organize your Puja pandal-hopping experience.</h1><p class="large">Porikroma 2026 is designed to make exploring selected participating Durga Puja pandals across Kolkata easier to plan.</p><div class="info-card"><h3>Important</h3><p>Participation and entry conditions may change. The website should only show a pandal as included after participation has been verified.</p></div></section>`); }
function contactPage() { return pageShell(`<section class="section narrow"><div class="section-head centered"><div class="eyebrow">PORIKROMA</div><h1>${t[lang].contactTitle}</h1><p>Email: <a href="mailto:porikromap@gmail.com">porikromap@gmail.com</a></p></div><form id="contactForm" class="form-card"><label>Name *<input name="name" required></label><label>Phone<input name="phone"></label><label>Email *<input name="email" type="email" required></label><label>Message *<textarea name="message" rows="5" required></textarea></label><button class="btn primary full">${t[lang].send}</button><div id="contactMsg"></div></form></section>`); }
function faqPage() {
  const faqs=[
    ["What is the Porikroma 2026 Pass?","It is a pass for the selected participating pandals shown by Porikroma. Entry conditions depend on each participating Puja committee."],
    ["How can I book?","Open Book Pass, enter your details and quantity, then follow the UPI payment instructions."],
    ["How is payment verified?","You submit a UTR/transaction reference. An admin verifies the payment before the booking is confirmed."],
    ["Can I get delivery?","If delivery is enabled, select delivery during booking. Charges are configured by the administrator."],
    ["What if a pandal changes its rules?","Participation and entry conditions can change. Check the latest information before visiting."]
  ];
  return pageShell(`<section class="section narrow"><div class="eyebrow">HELP</div><h1>${t[lang].faq}</h1><div class="faq">${faqs.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></section>`);
}
function legalPage(type) {
  const titles={privacy:"Privacy Policy",terms:"Terms & Conditions",refund:"Refund / Cancellation Policy"};
  return pageShell(`<section class="section narrow"><div class="eyebrow">PORIKROMA 2026</div><h1>${titles[type]}</h1><p>This is a starter policy page and should be reviewed and customized for the actual business, payment provider and applicable law before launch.</p><h3>Information</h3><p>Booking information may include name, phone, email, address, quantity and payment reference. Use it only for booking, support, delivery/collection and necessary business operations.</p><h3>Entry</h3><p>Participation and entry conditions are subject to participating Puja committees and may change.</p><h3>Contact</h3><p>Email: porikromapass@gmail.com</p></section>`);
}

function showMsg(id,msg,type="info"){const el=document.getElementById(id);if(el)el.innerHTML=`<div class="msg ${type}">${escapeHtml(msg)}</div>`;}

async function sendContact(e){
  e.preventDefault(); if(!sb)return showMsg("contactMsg","Connect Supabase first.","error");
  const f=new FormData(e.target);
  const {error}=await sb.from("contact_messages").insert({name:f.get("name"),phone:f.get("phone"),email:f.get("email"),message:f.get("message")});
  if(error)return showMsg("contactMsg",error.message,"error");
  e.target.reset(); showMsg("contactMsg","Message sent successfully.","success");
}

async function render(route){
  await loadSettings();
  const routes={home:homePage,book:bookPage,pandals:pandalsPage,map:mapPage,about:aboutPage,contact:contactPage,faq:faqPage,status:statusPage,payment:paymentPage,success:successPage,
    privacy:()=>legalPage("privacy"),terms:()=>legalPage("terms"),refund:()=>legalPage("refund")};
  document.querySelector("#app").innerHTML=(routes[route]||homePage)();
  document.querySelectorAll("[data-route]").forEach(a=>a.classList.toggle("active",a.dataset.route===route));
  document.querySelector("#mainNav").classList.remove("open");
  document.querySelector("#qty")?.addEventListener("input",updatePrice);
  document.querySelector("#delivery")?.addEventListener("change",updatePrice);
  document.querySelector("#bookingForm")?.addEventListener("submit",createBooking);
  document.querySelector("#paymentForm")?.addEventListener("submit",submitPayment);
  document.querySelector("#statusForm")?.addEventListener("submit",lookupBooking);
  document.querySelector("#contactForm")?.addEventListener("submit",sendContact);
  document.querySelector("#copyUpi")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(CONFIG.upiId||"");showMsg("paymentMsg","UPI ID copied.","success")}catch{}});
  updatePrice();
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelector("#menuBtn").addEventListener("click",()=>document.querySelector("#mainNav").classList.toggle("open"));
document.querySelector("#langBtn").addEventListener("click",()=>{lang=lang==="en"?"bn":"en";document.querySelector("#langBtn").textContent=lang==="en"?"বাংলা":"English";render((location.hash.slice(1)||"home"));});
window.addEventListener("hashchange",()=>render(location.hash.slice(1)||"home"));
render(location.hash.slice(1)||"home");
