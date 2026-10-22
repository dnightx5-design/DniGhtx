try{process.loadEnvFile()}catch(e){}
const express=require('express'),crypto=require('crypto'),fs=require('fs'),path=require('path');
const {createClient}=require('@libsql/client');
const services=require('./services');
const {ADMIN_PASSWORD,SESSION_SECRET,ANTHROPIC_API_KEY}=process.env;
if(!ADMIN_PASSWORD||!SESSION_SECRET){console.error('Set ADMIN_PASSWORD and SESSION_SECRET');process.exit(1)}
const SITE=(process.env.SITE_URL||'').replace(/\/$/,'');
const db=createClient({url:process.env.TURSO_DATABASE_URL||'file:dnightx.db',authToken:process.env.TURSO_AUTH_TOKEN});
const all=async(sql,args=[])=>{const r=await db.execute({sql,args});return r.rows.map(row=>Object.fromEntries(r.columns.map((c,i)=>[c,row[i]])))};
const run=(sql,args=[])=>db.execute({sql,args});
async function init(){
 await run(`CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,service TEXT,price INTEGER,name TEXT,contact TEXT,answers TEXT,summary TEXT,status TEXT DEFAULT 'New',created_at TEXT DEFAULT CURRENT_TIMESTAMP)`);
 for(const c of ["payment TEXT DEFAULT 'Unpaid'",'notes TEXT'])try{await run('ALTER TABLE orders ADD COLUMN '+c)}catch(e){}
}
const app=express();app.use(express.json({limit:'50kb'}));
const ah=fn=>(q,s,n)=>fn(q,s,n).catch(e=>{console.error(e);s.status(500).json({error:'Server error'})});
const home=fs.readFileSync(path.join(__dirname,'index.html'),'utf8').split('{{SITE_URL}}').join(SITE);
app.get(['/','/index.html'],(q,s)=>s.type('html').send(home));
app.get('/robots.txt',(q,s)=>s.type('text/plain').send('User-agent: *\nDisallow: /admin.html\nDisallow: /api/\nSitemap: '+SITE+'/sitemap.xml\n'));
app.get('/sitemap.xml',(q,s)=>s.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+SITE+'/</loc></url></urlset>'));
const FILES=['admin.html','logo.jpg','icon.png','esewa-qr.jpg'];app.get('/:f',(q,r,n)=>FILES.includes(q.params.f)?r.sendFile(path.join(__dirname,q.params.f)):n());
const hits={};const limit=(n,ms)=>(req,res,next)=>{const k=req.path+req.ip,t=Date.now();hits[k]=(hits[k]||[]).filter(x=>t-x<ms);if(hits[k].length>=n)return res.status(429).json({error:'Too many requests'});hits[k].push(t);next()};
const sign=v=>crypto.createHmac('sha256',SESSION_SECRET).update(v).digest('hex');
const eq=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&crypto.timingSafeEqual(x,y)};
const isAdmin=req=>{const m=/(?:^|; )sid=(\d+)\.([a-f0-9]+)/.exec(req.headers.cookie||'');return m&&+m[1]>Date.now()&&eq(sign(m[1]),m[2])};
const auth=(req,res,next)=>isAdmin(req)?next():res.status(401).json({error:'Unauthorized'});
const clean=s=>String(s||'').slice(0,1000);
const find=id=>services.find(s=>s.id===id);
const fix=(svc,answers)=>(Array.isArray(answers)?answers:[]).slice(0,svc.questions.length+2).map((a,i)=>({q:svc.questions[i]?svc.questions[i].q:clean(a.q).slice(0,300),k:svc.questions[i]?.k,a:clean(a.a)}));
const summarize=(svc,ans)=>`Service: ${svc.name} (NPR ${svc.price})\n`+ans.map(x=>`- ${x.q} ${x.a}`).join('\n');
async function ai(prompt){const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:process.env.ANTHROPIC_MODEL||'claude-sonnet-5-5',max_tokens:150,messages:[{role:'user',content:prompt}]})});const d=await r.json();return d.content?.[0]?.text?.trim()}
app.get('/api/services',(req,res)=>res.json(services.map(({questions,...s})=>s)));
app.post('/api/chat',limit(60,60000),ah(async(req,res)=>{
 const svc=find(req.body.service);if(!svc)return res.status(400).json({error:'Unknown service'});
 const ans=fix(svc,req.body.answers),n=svc.questions.length,i=ans.length;
 if(ans.some(a=>a.k==='advance'&&!/^yes/i.test(a.a)))return res.json({declined:true});
 if(i<n)return res.json({question:svc.questions[i]});
 if(i===n&&ANTHROPIC_API_KEY){try{const q=await ai(`You are an order assistant for a Nepali graphic design studio. Service: ${svc.name}. The customer answered:\n${ans.map(x=>x.q+' '+x.a).join('\n')}\nAsk ONE short, specific follow-up question about a missing detail that a designer would need. Reply with only the question.`);if(q)return res.json({question:{q:q.slice(0,300)}})}catch(e){console.error('AI error',e.message)}}
 res.json({done:true,summary:summarize(svc,ans)})}));
app.post('/api/orders',limit(10,600000),ah(async(req,res)=>{
 const svc=find(req.body.service);if(!svc)return res.status(400).json({error:'Unknown service'});
 const ans=fix(svc,req.body.answers);if(ans.length<svc.questions.length||ans.some(a=>!a.a))return res.status(400).json({error:'Incomplete order'});
 if(!/^yes/i.test(ans.find(a=>a.k==='advance').a))return res.status(400).json({error:'Advance payment must be accepted'});
 const name=ans.find(a=>a.k==='name').a.slice(0,100),contact=ans.find(a=>a.k==='contact').a.slice(0,100);
 const r=await run('INSERT INTO orders(service,price,name,contact,answers,summary) VALUES(?,?,?,?,?,?)',[svc.name,svc.price,name,contact,JSON.stringify(ans),summarize(svc,ans)]);
 res.json({id:Number(r.lastInsertRowid)})}));
app.get('/api/track',limit(20,600000),ah(async(req,res)=>{const o=(await all('SELECT id,service,status,payment,contact FROM orders WHERE id=?',[+req.query.id||0]))[0];
 if(!o||String(o.contact).trim().toLowerCase()!==clean(req.query.contact).trim().toLowerCase())return res.status(404).json({error:'No order found with those details'});res.json({id:o.id,service:o.service,status:o.status,payment:o.payment})}));
app.post('/api/admin/login',limit(5,600000),(req,res)=>{
 if(!eq(clean(req.body.password),ADMIN_PASSWORD))return res.status(401).json({error:'Wrong password'});
 const exp=String(Date.now()+864e5*7);res.setHeader('Set-Cookie',`sid=${exp}.${sign(exp)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${process.env.NODE_ENV==='production'?'; Secure':''}`);res.json({ok:true})});
app.post('/api/admin/logout',(req,res)=>{res.setHeader('Set-Cookie','sid=; HttpOnly; Path=/; Max-Age=0');res.json({ok:true})});
app.get('/api/admin/me',auth,(req,res)=>res.json({ok:true}));
app.get('/api/admin/orders',auth,ah(async(req,res)=>res.json((await all('SELECT * FROM orders ORDER BY id DESC')).map(o=>({...o,answers:JSON.parse(o.answers)})))));
app.patch('/api/admin/orders/:id',auth,ah(async(req,res)=>{const{status,payment,notes}=req.body,id=+req.params.id;
 if(status!==undefined){if(!['New','In Progress','Completed','Cancelled'].includes(status))return res.status(400).json({error:'Bad status'});await run('UPDATE orders SET status=? WHERE id=?',[status,id])}
 if(payment!==undefined){if(!['Unpaid','Advance paid','Fully paid'].includes(payment))return res.status(400).json({error:'Bad payment'});await run('UPDATE orders SET payment=? WHERE id=?',[payment,id])}
 if(notes!==undefined)await run('UPDATE orders SET notes=? WHERE id=?',[String(notes).slice(0,2000),id]);
 res.json({ok:true})}));
app.get('/api/admin/export.csv',auth,ah(async(req,res)=>{const q=v=>{v=String(v==null?'':v);if(/^[=+\-@]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};
 const rows=await all('SELECT * FROM orders ORDER BY id DESC');res.setHeader('Content-Type','text/csv');res.setHeader('Content-Disposition','attachment; filename=orders.csv');
 res.send(['id,service,price,name,contact,status,payment,created_at'].concat(rows.map(o=>[o.id,o.service,o.price,o.name,o.contact,o.status,o.payment,o.created_at].map(q).join(','))).join('\n'))}));
init().then(()=>app.listen(process.env.PORT||3000,()=>console.log('DniGhtX running'))).catch(e=>{console.error('Database error:',e.message);process.exit(1)});
