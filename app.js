const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const STORAGE={products:'diho-products',transactions:'diho-tx',members:'diho-members'};
const DEFAULT_PRODUCTS=[
 {name:'Teh Botol Sosro',sku:'0000089',price:5000,stock:25},
 {name:'Air Mineral',sku:'0000090',price:4000,stock:40},
 {name:'Mi Instan',sku:'0000091',price:3500,stock:50}
];
function read(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(v)?v:fallback}catch{return fallback}}
const state={products:read(STORAGE.products,DEFAULT_PRODUCTS),transactions:read(STORAGE.transactions,[]),members:read(STORAGE.members,[])};
let activePage='home',stream=null,scanLoop=null;
function persist(){localStorage.setItem(STORAGE.products,JSON.stringify(state.products));localStorage.setItem(STORAGE.transactions,JSON.stringify(state.transactions));localStorage.setItem(STORAGE.members,JSON.stringify(state.members));}
function money(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2600)}
function todayTx(){return state.transactions.filter(t=>new Date(t.date).toDateString()===new Date().toDateString())}
function showPage(page){
 stopCamera();activePage=page;
 $('#dashboard').hidden=page!=='home';$('#pageShell').hidden=page==='home';
 if(page==='home')return;
 const names={pos:'Front-Office (POS) & Transaksi',scan:'Scan UPC / Barcode',inventory:'Edit Barang & Inventaris',member:'Loyalitas & Membership',backoffice:'Manajemen Pusat (Back-Office)',reports:'Laporan Penjualan',security:'Keamanan & Backup'};
 $('#pageSubtitle').textContent=names[page]||'Kelola toko';
 const w=$('#workspace');
 if(page==='pos')renderPOS(w);
 if(page==='scan')renderScan(w);
 if(page==='inventory')renderInventory(w);
 if(page==='member')renderMembers(w);
 if(page==='backoffice')renderBackoffice(w);
 if(page==='reports')renderReports(w);
 if(page==='security')renderSecurity(w);
 window.scrollTo(0,0);
}
function renderPOS(w){
 let cart=[];
 w.innerHTML=`<h2>🛒 Front-Office (POS) & Transaksi</h2>
 <div class="formrow"><input id="posQuery" placeholder="Cari nama, UPC, barcode atau SKU..." autocomplete="off"><input id="posQty" type="number" min="1" value="1" style="max-width:90px;flex:0 0 90px"><button class="primary" id="addCart">Tambah</button></div>
 <div id="posMatches"></div><h3>Keranjang</h3><div id="cartRows" class="data-list"><div class="empty">Keranjang masih kosong.</div></div>
 <h3 id="cartTotal">Total: ${money(0)}</h3><button class="primary" id="checkout">Bayar & Simpan Transaksi</button>`;
 const drawMatches=()=>{const q=$('#posQuery').value.trim().toLowerCase();const found=q?state.products.filter(p=>[p.name,p.sku,p.upc,p.barcode].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,6):[];$('#posMatches').innerHTML=found.map(p=>`<button class="secondary match" data-sku="${esc(p.sku)}">${esc(p.name)} · ${esc(p.sku)} · Stok ${p.stock}</button>`).join('')};
 const draw=()=>{$('#cartRows').innerHTML=cart.length?cart.map((p,i)=>`<div class="data-row"><div><b>${esc(p.name)}</b><small>${p.qty} × ${money(p.price)}</small></div><b>${money(p.qty*p.price)}</b><button class="danger" data-remove="${i}">Hapus</button></div>`).join(''):'<div class="empty">Keranjang masih kosong.</div>';$('#cartTotal').textContent='Total: '+money(cart.reduce((a,p)=>a+p.qty*p.price,0))};
 $('#posQuery').oninput=drawMatches;
 $('#posMatches').onclick=e=>{const b=e.target.closest('[data-sku]');if(b){$('#posQuery').value=b.dataset.sku;addItem()}};
 function addItem(){const q=$('#posQuery').value.trim().toLowerCase();const p=state.products.find(x=>[x.sku,x.upc,x.barcode].some(v=>String(v||'').toLowerCase()===q)||x.name.toLowerCase()===q)||state.products.find(x=>x.name.toLowerCase().includes(q));const qty=Math.max(1,parseInt($('#posQty').value)||1);if(!p)return toast('Barang tidak ditemukan.');const inCart=cart.filter(x=>x.sku===p.sku).reduce((a,x)=>a+x.qty,0);if(p.stock<inCart+qty)return toast('Stok tidak cukup.');const existing=cart.find(x=>x.sku===p.sku);if(existing)existing.qty+=qty;else cart.push({...p,qty});draw();$('#posQuery').value='';$('#posMatches').innerHTML=''}
 $('#addCart').onclick=addItem;
 $('#cartRows').onclick=e=>{const b=e.target.closest('[data-remove]');if(b){cart.splice(+b.dataset.remove,1);draw()}};
 $('#checkout').onclick=()=>{if(!cart.length)return toast('Keranjang masih kosong.');const total=cart.reduce((a,p)=>a+p.qty*p.price,0);cart.forEach(item=>{const p=state.products.find(x=>x.sku===item.sku);if(p)p.stock-=item.qty});state.transactions.push({date:new Date().toISOString(),items:cart.map(x=>({...x})),total});persist();toast('Transaksi tersimpan: '+money(total));renderPOS(w)};
}
function renderInventory(w){
 w.innerHTML=`<h2>📦 Edit Barang & Inventaris</h2><form id="productForm"><div class="formrow"><input id="pname" placeholder="Nama barang" required><input id="psku" placeholder="SKU / barcode" required></div><div class="formrow"><input id="pupc" placeholder="UPC (opsional)"><input id="pprice" type="number" min="0" placeholder="Harga" required><input id="pstock" type="number" min="0" placeholder="Stok" required></div><button class="primary">Simpan Barang</button></form>
 <div class="formrow"><input id="inventorySearch" placeholder="Cari barang..."></div><div id="inventoryRows" class="data-list"></div>`;
 const draw=()=>{const q=$('#inventorySearch').value.toLowerCase();const rows=state.products.map((p,i)=>({...p,_i:i})).filter(p=>[p.name,p.sku,p.upc,p.barcode].some(v=>String(v||'').toLowerCase().includes(q)));$('#inventoryRows').innerHTML=rows.length?rows.map(p=>`<div class="data-row"><div><b>${esc(p.name)}</b><small>SKU: ${esc(p.sku)} · UPC: ${esc(p.upc||'-')} · Stok: ${p.stock} · ${money(p.price)}</small></div><div><button class="secondary" data-edit="${p._i}">Edit</button> <button class="danger" data-delete="${p._i}">Hapus</button></div></div>`).join(''):'<div class="empty">Barang tidak ditemukan.</div>'};
 $('#inventorySearch').oninput=draw;
 $('#productForm').onsubmit=e=>{e.preventDefault();const name=$('#pname').value.trim(),sku=$('#psku').value.trim(),upc=$('#pupc').value.trim(),price=Number($('#pprice').value),stock=Number($('#pstock').value);if(!name||!sku||price<0||stock<0)return toast('Periksa kembali data barang.');const old=state.products.find(p=>p.sku===sku);if(old){old.name=name;old.upc=upc;old.price=price;old.stock=stock}else state.products.push({name,sku,upc,barcode:sku,price,stock});persist();e.target.reset();draw();toast('Data barang disimpan.')};
 $('#inventoryRows').onclick=e=>{const d=e.target.closest('[data-delete]'),b=e.target.closest('[data-edit]');if(d){if(confirm('Hapus barang ini?')){state.products.splice(+d.dataset.delete,1);persist();draw()}}if(b){const p=state.products[+b.dataset.edit];$('#pname').value=p.name;$('#psku').value=p.sku;$('#pupc').value=p.upc||'';$('#pprice').value=p.price;$('#pstock').value=p.stock;toast('Ubah data lalu tekan Simpan Barang.')}};
 draw();
}
function renderMembers(w){
 w.innerHTML=`<h2>⭐ Loyalitas & Membership</h2><form id="memberForm"><div class="formrow"><input id="mname" placeholder="Nama member" required><input id="mphone" placeholder="Nomor telepon" required><button class="primary">Daftarkan</button></div></form><div id="memberRows" class="data-list"></div>`;
 const draw=()=>$('#memberRows').innerHTML=state.members.length?state.members.map((m,i)=>`<div class="data-row"><div><b>${esc(m.name)}</b><small>${esc(m.phone)} · ${m.points||0} poin</small></div><button class="danger" data-delmember="${i}">Hapus</button></div>`).join(''):'<div class="empty">Belum ada member terdaftar.</div>';
 $('#memberForm').onsubmit=e=>{e.preventDefault();state.members.push({name:$('#mname').value.trim(),phone:$('#mphone').value.trim(),points:0});persist();e.target.reset();draw();toast('Member berhasil didaftarkan.')};
 $('#memberRows').onclick=e=>{const b=e.target.closest('[data-delmember]');if(b){state.members.splice(+b.dataset.delmember,1);persist();draw()}};draw();
}
function renderBackoffice(w){
 w.innerHTML=`<h2>🏢 Manajemen Pusat (Back-Office)</h2><div class="statline"><div class="statbox"><small>Total barang</small><strong>${state.products.length}</strong></div><div class="statbox"><small>Total member</small><strong>${state.members.length}</strong></div></div><p>Ekspor data toko untuk dipindahkan atau disimpan sebagai arsip.</p><button class="primary" id="exportJSON">Ekspor data JSON</button><h3>Ringkasan stok</h3><p>Jumlah seluruh unit stok: <b>${state.products.reduce((a,p)=>a+(Number(p.stock)||0),0)}</b></p>`;
 $('#exportJSON').onclick=()=>download('diho-backup.json',JSON.stringify(state,null,2),'application/json');
}
function renderReports(w){
 const total=state.transactions.reduce((a,t)=>a+(Number(t.total)||0),0);
 w.innerHTML=`<h2>📊 Laporan Penjualan</h2><div class="statline"><div class="statbox"><small>Total penjualan</small><strong>${money(total)}</strong></div><div class="statbox"><small>Jumlah transaksi</small><strong>${state.transactions.length}</strong></div><div class="statbox"><small>Penjualan hari ini</small><strong>${money(todayTx().reduce((a,t)=>a+t.total,0))}</strong></div><div class="statbox"><small>Transaksi hari ini</small><strong>${todayTx().length}</strong></div></div><button class="primary" id="exportCSV">Ekspor laporan CSV</button><div class="data-list">${state.transactions.slice().reverse().map(t=>`<div class="data-row"><div><b>${new Date(t.date).toLocaleString('id-ID')}</b><small>${(t.items||[]).length} jenis barang</small></div><b>${money(t.total)}</b></div>`).join('')||'<div class="empty">Belum ada transaksi.</div>'}</div>`;
 $('#exportCSV').onclick=()=>{const rows=[['Tanggal','Total'],...state.transactions.map(t=>[t.date,t.total])];download('laporan-diho.csv',rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n'),'text/csv;charset=utf-8')};
}
function renderSecurity(w){
 w.innerHTML=`<h2>🔐 Keamanan & Backup</h2><p>Data barang, transaksi, dan member disimpan di penyimpanan lokal browser pada perangkat ini.</p><div class="formrow"><button class="primary" id="backup">Buat Backup</button><label class="secondary" style="display:inline-flex;align-items:center">Pulihkan Backup<input id="restore" type="file" accept="application/json" hidden></label></div><p><small>Simpan file backup di tempat aman. Memulihkan backup akan mengganti data lokal saat ini.</small></p>`;
 $('#backup').onclick=()=>download('diho-backup.json',JSON.stringify(state,null,2),'application/json');
 $('#restore').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.products)||!Array.isArray(d.transactions)||!Array.isArray(d.members))throw Error();if(!confirm('Ganti data lokal dengan isi backup ini?'))return;state.products=d.products;state.transactions=d.transactions;state.members=d.members;persist();toast('Backup berhasil dipulihkan.');renderSecurity(w)}catch{toast('File backup tidak valid.')}};r.readAsText(f)};
}
function renderScan(w){
 w.innerHTML=`<h2>▥ Scan UPC / Barcode</h2><p>Gunakan kamera untuk membaca barcode, atau masukkan kode secara manual.</p><div class="camera-box"><video id="camera" playsinline muted></video><div class="formrow"><button class="primary" id="startCamera">Aktifkan Kamera</button><button class="secondary" id="stopCamera">Matikan Kamera</button></div><form id="manualScan" class="formrow"><input id="scanCode" placeholder="Masukkan UPC / barcode"><button class="primary">Cari Barang</button></form><div id="scanResult" class="data-list"><div class="empty">Hasil pemindaian akan muncul di sini.</div></div></div>`;
 $('#startCamera').onclick=startCamera;$('#stopCamera').onclick=stopCamera;
 $('#manualScan').onsubmit=e=>{e.preventDefault();lookupCode($('#scanCode').value.trim())};
}
function lookupCode(code){
 const p=state.products.find(x=>[x.sku,x.upc,x.barcode].some(v=>String(v||'')===code));
 $('#scanResult').innerHTML=p?`<div class="data-row"><div><b>${esc(p.name)}</b><small>SKU: ${esc(p.sku)} · UPC: ${esc(p.upc||'-')} · Stok: ${p.stock}</small></div><b>${money(p.price)}</b></div>`:'<div class="empty">Barang dengan kode tersebut tidak ditemukan.</div>';
}
async function startCamera(){
 if(!('BarcodeDetector'in window)){toast('Browser belum mendukung pemindai barcode. Gunakan input manual.');return}
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});const v=$('#camera');v.srcObject=stream;await v.play();const detector=new BarcodeDetector();const tick=async()=>{if(!stream||activePage!=='scan')return;try{const codes=await detector.detect(v);if(codes.length){$('#scanCode').value=codes[0].rawValue;lookupCode(codes[0].rawValue);stopCamera();toast('Barcode terbaca.');return}}catch{}scanLoop=requestAnimationFrame(tick)};tick()}catch{toast('Kamera tidak dapat dibuka. Periksa izin kamera dan gunakan HTTPS.')}
}
function stopCamera(){if(scanLoop)cancelAnimationFrame(scanLoop);scanLoop=null;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}const v=$('#camera');if(v)v.srcObject=null}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function quickSearch(q){const query=q.trim().toLowerCase();if(!query)return;const found=state.products.filter(p=>[p.name,p.sku,p.upc,p.barcode].some(v=>String(v||'').toLowerCase().includes(query)));showPage('inventory');setTimeout(()=>{$('#inventorySearch').value=query;$('#inventorySearch').dispatchEvent(new Event('input'));if(!found.length)toast('Barang tidak ditemukan.')},0)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)showPage(b.dataset.page)});
$('#backHome').onclick=()=>showPage('home');
$('#quickSearch').onsubmit=e=>{e.preventDefault();quickSearch($('#quickQuery').value)};
$('#powerButton').onclick=()=>toast('Aplikasi DIHO KASIR PRO siap digunakan.');
if('serviceWorker'in navigator&&location.protocol!=='file:'){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}))}
showPage('home');
