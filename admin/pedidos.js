(function(){
"use strict";
const admin=window.CafeAppAdmin,supabase=window.CafeAppSupabase,$=id=>document.getElementById(id);
let orders=[],selected=null;
const labels={pending:"Pendiente",confirmed:"Confirmado",preparing:"Preparando",ready:"Listo para entregar",out_for_delivery:"En reparto",delivered:"Entregado",cancelled:"Cancelado"};
const pay={bank_transfer:"Transferencia bancaria",card:"Tarjeta",bizum:"Bizum",cash:"Efectivo al recibir"};
const payStatus={pending:"Pendiente",paid:"Pagado",failed:"Fallido",refunded:"Reembolsado"};
function esc(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#039;",'"':"&quot;"}[c]))}
function money(v){return new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"}).format(Number(v||0))}
function date(v){return v?new Intl.DateTimeFormat("es-ES",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v)):"—"}
function setStatus(msg,error=false){const e=$("orders-status");e.textContent=msg||"";e.className=error?"admin-status error":"admin-status success";if(!msg)e.className="admin-status"}
async function load(){
 try{
  setStatus("");
  const {data,error}=await supabase.from("orders").select("id,order_number,user_id,status,payment_method,payment_status,subtotal,delivery_fee,total,notes,recipient_name,phone,address_line,postal_code,city,province,created_at,updated_at,order_items(id,product_id,product_name,unit_price,quantity,line_total)").order("created_at",{ascending:false});
  if(error)throw error; orders=data||[]; render(); stats();
 }catch(e){console.error(e);$("orders-body").innerHTML='<tr><td colspan="8" class="admin-empty admin-danger">No se pudieron cargar los pedidos.</td></tr>';setStatus(e.message||"Error al cargar pedidos.",true)}
}
function filtered(){const q=$("order-search").value.trim().toLowerCase(),s=$("status-filter").value;return orders.filter(o=>{const hay=[o.order_number,o.recipient_name,o.phone,o.city,o.postal_code].join(" ").toLowerCase();return (!q||hay.includes(q))&&(s==="all"||o.status===s)})}
function render(){const list=filtered();$("orders-count").textContent=`${list.length} ${list.length===1?"pedido":"pedidos"}`;$("orders-body").innerHTML=list.length?list.map(o=>`<tr><td><strong>#${esc(o.order_number)}</strong></td><td><div class="order-client"><strong>${esc(o.recipient_name)}</strong><span>${esc(o.phone)}</span></div></td><td><div class="order-product-list">${(o.order_items||[]).slice(0,3).map(i=>`<span>${i.quantity} × ${esc(i.product_name)}</span>`).join("")}${(o.order_items||[]).length>3?`<span>+ ${(o.order_items||[]).length-3} más</span>`:""}</div></td><td><strong>${money(o.total)}</strong></td><td>${esc(pay[o.payment_method]||o.payment_method)}<br><small>${esc(payStatus[o.payment_status]||o.payment_status)}</small></td><td><span class="order-status-pill status-${esc(o.status)}">${esc(labels[o.status]||o.status)}</span></td><td>${esc(date(o.created_at))}</td><td><button class="order-action" data-order="${esc(o.id)}" type="button" title="Gestionar"><i class="bi bi-eye"></i></button></td></tr>`).join(""):'<tr><td colspan="8" class="admin-empty">No hay pedidos con esos criterios.</td></tr>'}
function stats(){$("count-total").textContent=orders.length;$('count-pending').textContent=orders.filter(o=>o.status==='pending').length;$('count-preparing').textContent=orders.filter(o=>o.status==='preparing').length;$('count-delivery').textContent=orders.filter(o=>o.status==='out_for_delivery').length;$('count-delivered').textContent=orders.filter(o=>o.status==='delivered').length}
function open(o){selected=o;$("order-title").textContent=`Pedido #${o.order_number}`;$("order-status-edit").value=o.status;$("order-payment-status-edit").value=o.payment_status;$("order-detail").innerHTML=`<div class="order-detail"><div class="order-detail-grid"><div class="order-detail-box"><small>Cliente</small><strong>${esc(o.recipient_name)}</strong><div>${esc(o.phone)}</div></div><div class="order-detail-box"><small>Dirección</small><div>${esc(o.address_line)}, ${esc(o.postal_code)} ${esc(o.city)} · ${esc(o.province)}</div></div><div class="order-detail-box"><small>Método de pago</small><div>${esc(pay[o.payment_method]||o.payment_method)}</div></div><div class="order-detail-box"><small>Total</small><strong>${money(o.total)}</strong><div>Subtotal ${money(o.subtotal)} · Entrega ${money(o.delivery_fee)}</div></div></div><div class="order-items">${(o.order_items||[]).map(i=>`<div class="order-item"><span>${i.quantity} × ${esc(i.product_name)}<br><small>${money(i.unit_price)} / unidad</small></span><strong>${money(i.line_total)}</strong></div>`).join("")}</div>${o.notes?`<div class="order-detail-box" style="margin-top:16px"><small>Notas del cliente</small><div>${esc(o.notes)}</div></div>`:""}</div>`;$("order-modal").hidden=false}
function close(){selected=null;$("order-modal").hidden=true}
$("order-search").addEventListener("input",render);$("status-filter").addEventListener("change",render);$("refresh-orders").addEventListener("click",load);$("orders-body").addEventListener("click",e=>{const b=e.target.closest("[data-order]");if(b){const o=orders.find(x=>x.id===b.dataset.order);if(o)open(o)}});document.querySelectorAll("[data-close-order]").forEach(b=>b.addEventListener("click",close));
$("print-order").addEventListener("click",()=>{ if(selected && window.CafeAppInvoice) window.CafeAppInvoice.printOrder(selected); });
$("delete-order").addEventListener("click",async()=>{
 if(!selected)return;
 const orderNumber=selected.order_number;
 const confirmed=confirm(`¿Eliminar definitivamente el pedido #${orderNumber}?\n\nEsta acción borrará el pedido y sus líneas de pedido de la base de datos y no se puede deshacer.`);
 if(!confirmed)return;
 const b=$("delete-order");b.disabled=true;
 try{
  const {data,error}=await supabase.rpc("admin_delete_order",{p_order_id:selected.id});
  if(error){
   console.error("admin_delete_order:",error);
   throw new Error(error.message || error.details || "Supabase no pudo eliminar el pedido.");
  }
  if(!data){
   throw new Error("El servidor no confirmó la eliminación del pedido.");
  }
  orders=orders.filter(o=>o.id!==selected.id);
  close();render();stats();setStatus(`Pedido #${orderNumber} eliminado correctamente.`);
 }catch(e){console.error(e);setStatus(e.message||"No se pudo eliminar el pedido.",true)}finally{b.disabled=false}
});
$("save-order").addEventListener("click",async()=>{if(!selected)return;const b=$("save-order");b.disabled=true;try{const orderNumber=selected.order_number;const {data,error}=await supabase.rpc("admin_update_order_status",{p_order_id:selected.id,p_status:$("order-status-edit").value,p_payment_status:$("order-payment-status-edit").value});if(error)throw error;const idx=orders.findIndex(o=>o.id===selected.id);if(idx>=0)orders[idx]={...orders[idx],...data};close();render();stats();setStatus(`Pedido #${orderNumber} actualizado correctamente.`)}catch(e){console.error(e);setStatus(e.message||"No se pudo actualizar el pedido.",true)}finally{b.disabled=false}});
(async()=>{const user=await admin.requireAdmin();if(!user)return;$("admin-email").textContent=user.email||"Administrador";$("admin-logout").addEventListener("click",admin.logout);await load()})();
})();
