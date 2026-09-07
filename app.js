const $=id=>document.getElementById(id);let authMode='login';
function toast(s){$('toast').textContent=s;$('toast').style.display='block';setTimeout(()=>$('toast').style.display='none',2500)}
function toggleAuth(){authMode=authMode==='login'?'register':'login';$('registerBox').hidden=authMode!=='register';$('lemail').parentElement.hidden=authMode==='register'}
async function api(url,opt={}){const r=await fetch(url,{headers:{'Content-Type':'application/json'},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Có lỗi xảy ra');return d}
async function register(){try{await api('/api/register',{method:'POST',body:JSON.stringify({name:$('rname').value,email:$('remail').value,password:$('rpass').value})});toast('Đăng ký thành công');await boot()}catch(e){toast(e.message)}}
async function login(){try{await api('/api/login',{method:'POST',body:JSON.stringify({email:$('lemail').value,password:$('lpass').value})});toast('Đăng nhập thành công');await boot()}catch(e){toast(e.message)}}
async function logout(){await api('/api/logout',{method:'POST'});location.reload()}
async function boot(){try{const me=await api('/api/me');$('auth').hidden=true;$('app').hidden=false;$('logout').hidden=false;$('uname').textContent=me.name;$('points').textContent=me.points;loadTasks()}catch{}}
async function loadTasks(){const ts=await api('/api/tasks');$('tasks').innerHTML=ts.map(t=>`<article class="task"><div><h3>${escapeHtml(t.title)}</h3><div class="muted">${escapeHtml(t.description)}</div><div>+${t.points} điểm</div></div><button onclick="complete(${t.id})">Mở nhiệm vụ</button></article>`).join('')||'<p>Chưa có nhiệm vụ.</p>'}
async function complete(id){const t=(await api('/api/tasks')).find(x=>x.id===id);if(t)window.open(t.url,'_blank','noopener');if(!confirm('Bạn đã tự thực hiện nhiệm vụ và muốn xác nhận hoàn thành?'))return;try{const d=await api('/api/tasks/'+id+'/complete',{method:'POST'});toast('Đã cộng +'+d.points+' điểm');boot()}catch(e){toast(e.message)}}
async function rank(type='daily'){const d=await api('/api/leaderboard');const rows=d[type].map((x,i)=>`<div class="rankrow"><span>#${i+1}</span><span>${escapeHtml(x.name)}</span><b>${x.points} điểm</b></div>`).join('');$('ranking').innerHTML=rows||'<p>Chưa có dữ liệu.</p>'}
function show(v){$('home').hidden=v!=='home';$('rank').hidden=v!=='rank';if(v==='rank')rank()}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}boot();
