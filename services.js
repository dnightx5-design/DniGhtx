const C={k:'name',q:'What is your name?'},T={k:'contact',q:'Your phone/WhatsApp or email so we can reach you?'};
const col={q:'Preferred colors?',o:['Neon cyan/green','Red/Black','Blue/White','Let designer decide']};
const dl={q:'Deadline?',o:['24 hours','2-3 days','1 week','Flexible']};
const ref={q:'Reference images or links? (paste a link or type "none")',o:['None']};
const style=(o)=>({q:'Preferred design style?',o});
const S=[
{id:'poster',name:'Poster Design',price:1050,desc:'Eye-catching posters for events, promos and campaigns.',icon:'🖼️',
 questions:[{q:'What type of poster?',o:['Event','Sale/Promotion','Movie/Music','Educational']},{q:'Size?',o:['A4','A3','Instagram 1080x1350','Custom']},{q:'Purpose of the poster?'},{q:'What text should appear on it?'},col,style(['Modern','Minimal','Bold/Neon','Traditional']),ref,dl,C,T]},
{id:'certificate',name:'Certificate Design',price:500,desc:'Elegant certificates for schools, events and companies.',icon:'🏅',
 questions:[{q:'Certificate type?',o:['Achievement','Participation','Completion','Appreciation']},{q:'Organization name?'},{q:'Recipient name(s)?'},{q:'Certificate wording?'},{q:'Size?',o:['A4 Landscape','A4 Portrait','Custom']},{q:'Signature and logo? (describe or say "will send")'},style(['Classic gold','Modern','Minimal','Formal']),dl,C,T]},
{id:'thumbnail',name:'Gaming Thumbnail',price:1100,desc:'High-CTR YouTube thumbnails for gamers.',icon:'🎮',
 questions:[{q:'Which game?'},{q:'Video title?'},{q:'Thumbnail style?',o:['Intense/Action','Funny','Clean','Neon']},{q:'Images to include (screenshots, face cam, logo)? Describe.'},{q:'Text on the thumbnail?'},dl,C,T]},
{id:'logo',name:'Logo Design',price:999,desc:'Memorable logos with brand-ready files.',icon:'✨',
 questions:[{q:'Business name?'},{q:'Business category?'},{q:'Preferred colors?',o:col.o},{q:'Logo style?',o:['Wordmark','Icon + text','Mascot','Minimal']},ref,dl,C,T]},
{id:'banner',name:'Banner Design',price:1000,desc:'Banners for social media, YouTube and websites.',icon:'🚩',
 questions:[{q:'Banner type?',o:['YouTube','Facebook','Website','Print']},{q:'Size?'},{q:'Text and brand name?'},col,style(['Modern','Minimal','Bold/Neon']),ref,dl,C,T]},
{id:'custom',name:'Custom Graphic Design',price:600,desc:'Anything else: menus, flyers, social posts, packaging.',icon:'🎨',
 questions:[{q:'What do you need designed?'},{q:'Size or format?'},{q:'Text/content to include?'},col,ref,dl,C,T]}
];

S.forEach(s=>{const i=s.questions.findIndex(q=>q.k==='name');s.questions.splice(i,0,{k:'advance',q:`Do you agree to pay 50% advance (NPR ${Math.ceil(s.price/2)}) through eSewa once we confirm your order? The rest is paid on delivery.`,o:['Yes, I agree','No']})});
module.exports=S;
