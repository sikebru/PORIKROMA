const C=window.PORIKROMA_CONFIG||{};
const ok=C.supabaseUrl&&!C.supabaseUrl.includes("YOUR-PROJECT")&&C.supabaseAnonKey&&!C.supabaseAnonKey.includes("YOUR_SUPABASE");
const sb=ok?window.supabase.createClient(C.supabaseUrl,C.supabaseAnonKey):null;
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function msg(id,x,kind="info"){const e=$(id);if(e)e.innerHTML=`<div class="msg ${kind}">${esc(x)}</div>`}
async function login(e){
 e.preventDefault(); if(!sb)return msg("#loginMsg","Configure Supabase first.","error");
 const f=new FormData(e.target); const {error}=await sb.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});
 if(error)return msg("#loginMsg",error.message,"error"); await start();
}
async function start(){
 const {data:{user}}=await sb.auth.getUser();
 if(!user){$("#loginBox").style.display="block";$("#dashboard").style.display="none";return;}
 const {data:admin}=await sb.from("admin_users").select("role").eq("user_id",user.id).maybeSingle();
 if(!admin)return msg("#loginMsg","This account is not an admin.","error");
 $("#loginBox").style.display="none";$("#dashboard").style.display="block"; await load();
}
async function load(){
 const {data:b,error}=await sb.from("bookings").select("*").order("created_at",{ascending:false}).limit(100);
 if(error)return msg("#loginMsg",error.message,"error");
 $("#stats").innerHTML=[["Bookings",b.length],["Pending",b.filter(x=>x.payment_status==="Submitted").length],["Confirmed",b.filter(x=>x.booking_status==="Confirmed").length],["Passes",b.reduce((a,x)=>a+x.quantity,0)]].map(x=>`<div class="step"><b>${x[0]}</b><h2>${x[1]}</h2></div>`).join("");
 $("#bookingRows").innerHTML=b.map(x=>`<tr><td>${esc(x.booking_id)}<small>${new Date(x.created_at).toLocaleString()}</small></td><td>${esc(x.customer_name)}<small>${esc(x.phone)}</small></td><td>${x.quantity}</td><td>${money(x.total_amount)}</td><td>${esc(x.payment_status)}</td><td>${esc(x.booking_status)}</td><td><select onchange="updateBooking('${x.id}',this.value)"><option value="">Change</option><option>Confirmed</option><option>Processing</option><option>Ready for Collection</option><option>Out for Delivery</option><option>Delivered</option><option>Cancelled</option></select></td></tr>`).join("");
 const {data:s}=await sb.from("site_settings").select("key,value");
 const o={};(s||[]).forEach(x=>o[x.key]=x.value);
 ["pass_price","delivery_charge","max_passes_per_booking","available_passes"].forEach(k=>{const e=$(`[name=${k}]`);if(e)e.value=o[k]??""});
}
window.updateBooking=async(id,status)=>{
 if(!status)return;
 const patch={booking_status:status};
 if(status==="Confirmed")patch.payment_status="Verified";
 const {error}=await sb.from("bookings").update(patch).eq("id",id);
 if(error)alert(error.message);else await load();
};
$("#loginForm").addEventListener("submit",login);
$("#adminLogout").addEventListener("click",async()=>{if(sb)await sb.auth.signOut();location.reload()});
$("#settingsForm").addEventListener("submit",async e=>{
 e.preventDefault();const f=new FormData(e.target);
 for(const k of ["pass_price","delivery_charge","max_passes_per_booking","available_passes"]){
   const {error}=await sb.from("site_settings").upsert({key:k,value:String(f.get(k)),updated_at:new Date().toISOString()});
   if(error)return msg("#settingsMsg",error.message,"error");
 }
 msg("#settingsMsg","Settings saved.","success");await load();
});
start();
