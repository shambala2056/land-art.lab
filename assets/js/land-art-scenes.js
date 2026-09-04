/* Лэнд артын 3D дүр зургууд — BE HUMAN, ART N TECH, JACK'S COFFEE ба HEXAGON.
   index.html-ээс салгаж файл болгов: дэлгэцийн гогцооны хуудас (screen.html)
   мөн ижил кодыг ачаална. THREE-г өмнө нь ачаалсан байх ёстой. */
/* Шувуу — өмнө нь гурван хайрцаг байсан тул нисдэг цаас шиг харагддаг байв.
   Одоо: нуруу нь нисэх чиглэл (+z) дагуу сунасан бие, толгой, хушуу, сэрвээт
   сүүл, үзүүр рүүгээ нарийсаж арагшаа шүүрдсэн муруй далавч.
   Далавч ±x тэнхлэгээр дэлгэгдэж, үндэс дээрээ rotation.z-ээр дэвнэ. */
window.__bird3d=function(T,color,L){
  const M=new T.MeshStandardMaterial({color:color,roughness:.92,side:T.DoubleSide});
  function wingGeo(){
    const s=new T.Shape();
    s.moveTo(0,-.17);
    s.bezierCurveTo(.36,-.22,.72,-.19,1.00,-.055);      // урд ирмэг — арагшаа шүүрдэнэ
    s.bezierCurveTo(1.04,-.02,1.03,.012,.96,.028);      // үзүүр
    s.bezierCurveTo(.62,.055,.30,.105,0,.17);           // хойд ирмэг — үндэс рүүгээ өргөснө
    s.lineTo(0,-.17);
    const g=new T.ShapeGeometry(s,12); g.rotateX(-Math.PI/2); return g;
  }
  function tailGeo(){
    const s=new T.Shape();
    s.moveTo(0,-.075); s.lineTo(0,.075);
    s.lineTo(.20,.185); s.lineTo(.13,0); s.lineTo(.20,-.185);   // сэрвээт төгсгөл
    s.lineTo(0,-.075);
    const g=new T.ShapeGeometry(s,1); g.rotateX(-Math.PI/2); return g;
  }
  const b=new T.Group();
  const body=new T.Mesh(new T.SphereGeometry(.10,10,8),M);
  body.scale.set(.92,1.00,3.10); b.add(body);                    // нуруу z дагуу сунана
  const head=new T.Mesh(new T.SphereGeometry(.072,8,7),M);
  head.position.set(0,.030,.285); b.add(head);
  const beak=new T.Mesh(new T.ConeGeometry(.022,.072,6),M);
  beak.rotation.x=Math.PI/2; beak.position.set(0,.020,.355); b.add(beak);
  const tail=new T.Mesh(tailGeo(),M);
  tail.rotation.y=Math.PI/2;                                     // сүүл арагшаа (-z) сунана
  tail.position.set(0,0,-.28); b.add(tail);
  const wr=new T.Mesh(wingGeo(),M);
  const wl=new T.Mesh(wingGeo(),M); wl.scale.x=-1;
  wr.position.set(.055,.02,.02); wl.position.set(-.055,.02,.02);
  b.add(wr); b.add(wl);
  b.scale.setScalar((L||1)/.62);                                 // L = хуучин биеийн урт
  return {g:b,wl:wl,wr:wr};
};
/* ═══════════ HEXAGON — ХУУЛЖ АВАХ JS (эхлэл) ═══════════ */
/* Дөрвөн улирал: навчны өнгө, титмийн хэмжээ, гэрэл, газрын өнгө өөрчлөгдөнө */
const SEASONS=[
  {n:'Spring',dh:+.010,ds:1.02,dl:1.16,leaf:.70,sun:'#FFF6E2',si:1.50,hemi:.54,
   fog:'#F2F0EA',snow:0,grn:'#86A44E',bug:1},
  {n:'Summer',dh: .000,ds:1.00,dl:1.00,leaf:1.00,sun:'#FFF2D4',si:1.60,hemi:.50,
   fog:'#F2F0EA',snow:0,grn:'#7D9A46',bug:1},
  {n:'Autumn',dh:-.135,ds:1.20,dl:1.08,leaf:.86,sun:'#FFE7B6',si:1.44,hemi:.52,
   fog:'#F3EEE0',snow:0,grn:'#95924A',bug:.4},
  {n:'Winter',dh:-.020,ds:0.28,dl:0.88,leaf:0.00,sun:'#EDF2FF',si:1.10,hemi:.66,
   fog:'#EDEFF3',snow:1,grn:'#C9CBC8',bug:0}
];

/* JACK'S COFFEE-ийн тэмдгийн битмаск. Модулийн ХАМГИЙН ГАДНА хүрээнд байх
   ёстой: HEXAGON (56-1447 мөрийн IIFE) ба лэнд артын дүр зургууд (1452-оос
   эхлэх IIFE) хоёр нь ТУСДАА хүрээ тул нэгнийх нь дотор зарлавал нөгөө нь
   харахгүй. Өмнө нь HEXAGON-ы дотор байсан бөгөөд лэнд артын IIFE эхлэх
   үедээ ReferenceError өгч, BE HUMAN, ART N TECH хоёр огт баригдахгүй
   байсан. */
const JACKS_SHAPE=(function(){
      const MW=130, MH=150;
      const B64="AAAAAAAEAAAcAAAAAAAAAAAAAAAAA4AAB4AAAAAAAAAAAAAAAAPwAAPgAAAAAAAAAAAAAAAA/gAA/AAAAAAAAAAAAAAAAD+AAH8AAAAAAAAAAAAAAAAP4AAf4AAAAAAAAAAAAAAAB/wAD/gAAAAAAAAAAAAAAAH/gAP/AAAAAAAAAAAAAAAAf/AA/8AAAAAAAAAAAAAAAB/8AH/wAAAAAAAAAAAAAAAH/4Af/gAAAAAAAAAAAAAAA//gD/+AAAAAAAAAAAAAAAD//AP/8AAAAAAAAAAAAAAAP/8A//wAAAAAAAAAAAAAAA//4H//AAAAAAAAAAAAAAAD//wf/+AAAAAAAAAAAAAAAP//D//4AAAAAAAAAAAAAAB//+P//wAAAAAAAAAAAAAAD//////AAAAAAAAAAAAAAAP/////+AAAAAAAAAAAAAAB//////4AAAAAAAAAAAAAAD//////gAAAAAAAAAAAAAAf//////AAAAAAAAAAAAAAB//////8AAAAAAAAAAAAAAH//////wAAAAAAAAAAAAAAf//////AAAAAAAAAAAAAAB//////+AAAAAAAAAAAAAAH//////4AAAAAAAAAAAAAAf//////gAAAAAAAAAAAAAB///////AAAAAAAAAAAAAAH//////8AAAAAAAAAAAAAAf//////wAAAAAAAAAAAAAB///////AAAAAAAAAAAAAAH//////+AAAAAAAAAAAAAAf//////4AAAAAAAAAAAAAB///////gAAAAAAAAAAAAAH///////AAAAAAAAAAAAAAf//////4AAAAAAAAAAAAAB///////wAAAAAAAAAAAAAH///////AAAAAAAAAAAAAAf//////8AAAAAAAAAAAAAB///////4AAAAAAAAAAAAAH///////AAAAAAAAAAAAAAf//////+AAAAAAAAAAAAAB///////4AAAAAAAAAAAAAH///////gAAAAAAAAAAAAAf//////+AAAAAAAAAAAAAB///////8AAAAAAAAAAAAAH///7///gAA////4AAAAAAf//8H+D+AAH////wAAAAAB///wP4P8AAf////AAAAAAH///A/A/wAB////8AAAAAAf//8D+B/AAH////wAAAAAB///wPwP8AAf////AAAAAAH///B/g/wAB////8AAAAAAf//+H/H/AAH////wAAAAAB///////8AAf////AAAAAAH///////wAB////8AAAAAAf///////AAH////wAAAAAB///////8AAf////AAAAAAH///////wAB////8AAAAAA////////gAP////3//f//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////7/////////////////////v////////////////////+/////////////////////z/////////////////////P////////////////////8/////////////////////j////////////////////8P////////////////////w////////////////////+D////////////////////wP///////////////////+A////////////////////wD////////////////////AP///////////////////wA///////////////////+AD///////////////////wAP//////////////////8AA///////////////////AAB//////////////////gAACtLbc3///////////+AAAAAAAAAA/////////8AAAAAAAAAAAB/////////gAAAAAAAAAAAH////////+AAAAAAAAAAAAf////////4AAAAAAAAAAAB/////////wAAAAAAAAAAAP/////////gAAAAAAAAAAB//////////AAAAAAAAAAAH/////////+AAAAAAAAAAA//////////8AAAAAAAAAAH//////////4AAAAAAAAAA///////////wAAAAAAAAAH///////////gAAAAAAAAA////////////AAAAAAAAAH///////////+AAAAAAAAA////////////8AAAAAAAAH////////////4AAAAAAAA/////////////wAAAAAAAP/////////////gAAAAAAB//////////////AAAAAAAf/////////////+AAAAAAH//////////////8AAAAAD///////g///////4AAAAB///////+B///////wAAAL////////wD///////wAAf////////+AH///////gAD/////////4AP///////AAP/////////AAf//////+AA/////////4AA///////8AD/////////AAB///////4AP////////4AAD///////wA/////////gAAH///////gD////////8AAAP///////AP////////gAAAf//////+A////////8AAAA///////8D////////gAAAB///////4P///////8AAAAD///////w////////gAAAAH///////D///////4AAAAAP//////8P///////AAAAAAf//////w///////4AAAAAA//////+D///////AAAAAAB//////wP//////wAAAAAAD/////+A//////8AAAAAAAH/////gD//////gAAAAAAAP////8AP/////4AAAAAAAAf////AA/////+AAAAAAAAA////4AD/////wAAAAAAAAB////AAP////8AAAAAAAAAD///4AA////+AAAAAAAAAAH///AAD////gAAAAAAAAAAP//wAAP///wAAAAAAAAAAAf/+AAA///wAAAAAAAAAAAA//wAAD//wAAAAAAAAAAAAB/8AAAD8AAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAH8AAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAAAAAAAAAIAAAAA=";
      let bits=null;
      function unpack(){
        const raw=atob(B64), a=new Uint8Array(MW*MH);
        for(let i=0;i<a.length;i++) a[i]=(raw.charCodeAt(i>>3)>>(7-(i&7)))&1;
        return a;
      }
      return function(g,W,H){
        if(!bits) bits=unpack();
        g.fillStyle='#ffffff'; g.fillRect(0,0,W,H);
        g.fillStyle='#000000';
        const cw=W/MW, ch=H/MH;
        for(let y=0;y<MH;y++){
          let run=-1;
          for(let x=0;x<=MW;x++){
            const on = x<MW && bits[y*MW+x];
            if(on && run<0) run=x;
            else if(!on && run>=0){ g.fillRect(run*cw, y*ch, (x-run)*cw+0.5, ch+0.5); run=-1; }
          }
        }
      };
    })();

/* ── JACK'S нүдний тарилтын зохиомж — хоёр дүр зураг хуваалцана ────────────
 * Энэ нь HEXAGON-ы plantJacksCell дотор байсан кодыг тэр чигээр нь гаргасан
 * бөгөөд одоо хоёр газраас дуудагдана: HEXAGON-ы A-01 нүд, мөн лэнд артын
 * хэсэг дэх Jack's-ийн тусдаа дүр зураг. Хоёулаа НЭГ эх сурвалжаас цэгээ
 * авдаг тул хэзээ ч салж явахгүй — нэгийг нь өөрчилбөл нөгөө нь дагана.
 *
 * JACKS_SHAPE-тэй ижил шалтгаанаар энд, IIFE-үүдээс дээш байрлана: доорх хоёр
 * хаалттай хамрах хүрээ хоёулаа үүнийг харах ёстой.
 *
 * Буцаах утга нь зөвхөн ЦЭГҮҮД — {x, z, hedge}. Мод хэрхэн зурагдах нь дуудсан
 * дүр зургийн хэрэг: HEXAGON өөрийн instance-даа, projects өөрийнхөө загвараар
 * тарина. Тиймээс энэ функц ямар ч рендерээс хамааралгүй.
 */
window.__jacksCell = (function(){
  /* Тайлбарт бичсэн 10,000 модыг зурагт нь ч тарина: 126×145 нь тэмдэгт 9,891,
     хашаанд ~38 өгч, нийт 9,929 — бичсэн тооноос 0.7%-ийн зөрүүтэй. */
  function mask(){
    const MW=126,MH=145;
    const cv=document.createElement('canvas'); cv.width=MW; cv.height=MH;
    const g=cv.getContext('2d');
    g.fillStyle='#ffffff'; g.fillRect(0,0,MW,MH);
    g.fillStyle='#000000'; g.strokeStyle='#000000';
    g.lineJoin='round'; g.lineCap='round';
    /* Нэрээр нь шууд дуудна, window-оор биш: JACKS_SHAPE нь дээд түвшний
       const бөгөөд тийм зарлал глобал ЛЕКСИК хамрах хүрээнд ордог болохоос
       window объектод шинж чанар болж суудаггүй. window.JACKS_SHAPE нь
       undefined байсан тул энэ функц ачаалахад л унаж байв. */
    JACKS_SHAPE(g,MW,MH);
    const d=g.getImageData(0,0,MW,MH).data;
    const on=new Uint8Array(MW*MH);
    for(let i=0;i<MW*MH;i++) on[i]= d[i*4]<120 ? 1 : 0;

    /* ── Муурын нүдийг нээх ─────────────────────────────────────────────
       Маскад нүд нь нүх боловч ердөө долоон пиксел өргөн буюу газар дээр
       ~70 см. Модны титэм түүнээс өргөн тул ургахдаа нүдийг бүрхэж, царай
       цул ногоон болдог. Энэ нь эх кодод аль хэдийн тэмдэглэгдсэн асуудал:
       "10,000 титэм … нүд, мөчрийн хоорондох цоорхойг бүрхэж, тэмдэг нэг
       цул ногоон болно."

       Тарихаас өмнө нүхийг өргөсгөж шийднэ. Захаас дүүргэж гадна талын
       хоосон зайг тэмдэглэвэл үлдсэн хоосон нь дотоод нүх — өөрөөр хэлбэл
       нүд. Тэдгээрээс EYE_CLEAR пикселийн дотор байгаа модыг хасна.

       EYE_CLEAR-ийн утга санамсаргүй биш. Хоёр нүдний хооронд ердөө зургаан
       пикселийн зай бий тул хэмжив:

           K=2  →  нүд 11 px,  гүүрт 3 мод
           K=3  →  нүд 14 px,  гүүрт 1 мод      ← дээд хязгаар
           K=4  →  нүд 16 px,  гүүр АЛГА, хоёр нүд нийлж нэг ангархай болно

       Иймд 3. Гадна контур хөндөгдөхгүй — элэгдэл зөвхөн дотоод нүхнээс
       дотогш явна, гадна талын хоосон зайнаас биш. */
    const outside=new Uint8Array(MW*MH), st=[];
    for(let x=0;x<MW;x++){ st.push(x); st.push((MH-1)*MW+x); }
    for(let y=0;y<MH;y++){ st.push(y*MW); st.push(y*MW+MW-1); }
    while(st.length){
      const i=st.pop();
      if(on[i]||outside[i]) continue;
      outside[i]=1;
      const x=i%MW, y=(i-x)/MW;
      if(x>0) st.push(i-1);
      if(x<MW-1) st.push(i+1);
      if(y>0) st.push(i-MW);
      if(y<MH-1) st.push(i+MW);
    }
    const EYE_CLEAR=3, pts=[];
    for(let y=0;y<MH;y++) for(let x=0;x<MW;x++){
      if(!on[y*MW+x]) continue;
      let nearHole=false;
      for(let dy=-EYE_CLEAR; dy<=EYE_CLEAR && !nearHole; dy++){
        const yy=y+dy; if(yy<0||yy>=MH) continue;
        for(let dx=-EYE_CLEAR; dx<=EYE_CLEAR; dx++){
          const xx=x+dx; if(xx<0||xx>=MW) continue;
          if(dx*dx+dy*dy>EYE_CLEAR*EYE_CLEAR) continue;
          const j=yy*MW+xx;
          if(!on[j] && !outside[j]){ nearHole=true; break; }
        }
      }
      if(!nearHole) pts.push({u:(x+.5)/MW-.5, v:(y+.5)/MH-.5});
    }
    return pts;
  }
  let cached=null;
  /* rad — зургаалжны радиус. HEXAGON дээр h.radius*.92 өгдөг. */
  return function(rad){
    const apo=rad*0.8660254, out=[];
    /* 1 · хашаа — зургаалжны зургаан ирмэгийн дагуу хайлаас */
    const corner=function(k){const a=Math.PI/180*(60*k-90);
      return {x:rad*Math.cos(a), z:rad*Math.sin(a)};};
    const step=rad*0.16;
    for(let k=0;k<6;k++){
      const a=corner(k), b=corner((k+1)%6);
      const len=Math.hypot(b.x-a.x,b.z-a.z), n=Math.max(2,Math.round(len/step));
      for(let i=0;i<n;i++){
        const t=i/n;
        out.push({x:a.x+(b.x-a.x)*t, z:a.z+(b.z-a.z)*t, hedge:.62});   // хашаа — арай өндөр
      }
    }
    /* 2 · тэмдэг — хашааны дотор, эсийн 62%-д багтаана.
       Мод бүрийн титэм өндрөөсөө хамаарч томордог тул 10,000 титэм 2032 он
       гэхэд нүд, мөчрийн хоорондох цоорхойг бүрхэж, тэмдэг нэг цул ногоон
       болно. Модыг цөөлөх нь буруу — энэ бол урлагийн бүтээл. Оронд нь
       тайруулж барина: тэмдгийн мод намхан, хашааных арай өндөр. */
    const fit=apo*1.24;                       // тэмдгийн өндөр
    if(!cached) cached=mask();
    cached.forEach(function(p){
      out.push({x:p.u*fit*0.867, z:p.v*fit, hedge:.45});               // тэмдэг — тайруулсан
    });
    return out;
  };
})();

(function(){
"use strict";

/* ---------- өгөгдөл ---------- */
/* rad = sqrt(талбай / 400) — нүдний хэмжээ бодит талбайгаа зөв илэрхийлнэ.
   Ингэснээр 400 м² нүд 25 м² нүднээс яг 16 дахин том харагдана.
   n нь тухайн нүдэнд зурагдах модны тоо — мөн талбайд шууд хамааралтай. */
/* rad = sqrt(талбай / 400) — нүдний хэмжээ бодит талбайгаа зөв илэрхийлнэ.
   h нь нимгэн хөрсний давхарга — өргөгдсөн суурь биш. Зургаан талт хэлбэрийг
   зөвхөн тарьсан мод өөрөө үүсгэнэ. */
const PAD=0.07;
/* Хэмжээ, тоо, байрлал бүгд HEXAGON SHAPE.png-ээс уншигдсан: талбай дээр бодитоор
   тарьсан 54 зургаалжин. Тогтмол зөгийн үүр биш, өөр өөр хэмжээтэй тархсан хэлбэр.
   rad — хамгийн том зургаалжныг 1 болгосон харьцаа; талбай нь радиусын квадратаар
   гарна (₮100,000/м², мод 3/м²). */
/* Нүх нь хоёр тийшээ 1.5 м зайтай тул нэг нүх 2.25 м² эзэлнэ, дотор нь 3
   суулгац. Урьд нь 1 м²-т 1 нүх, 3 мод гэж бичсэн байсан нь 0.58 м зай
   шаардах бөгөөд хайлаасанд боломжгүй — өөрөөр хэлбэл тарьж чадахгүй модыг
   тоолж, түүнийхээ төлөө үнэ авч байжээ. Тоонуудыг талбайгаас гаргана, гараар
   бичихгүй: ингэснээр нэгж үнээс хэзээ ч салахгүй. */
const SPACING=1.5, AREA_PER_PIT=SPACING*SPACING, SEEDS_PER_PIT=3;
const PIT_PRICE_MNT=100000;                     /* 1 нүх = ₮100,000 = $30 */
function sz(rad,area,n){
  const pots=Math.floor(area/AREA_PER_PIT);
  return {rad:rad,h:PAD,area:area,pots:pots,trees:pots*SEEDS_PER_PIT,
          price:pots*PIT_PRICE_MNT,n:n};
}
const SIZES={
  A:sz(1.000,400,263), B:sz(0.805,260,170), C:sz(0.550,120,80),
  D:sz(0.470,90,58),   E:sz(0.337,45,44),   F:sz(0.172,12,14)
};
/* [x, y, class] — хамгийн том зургаалжны радиусыг нэгж болгосон нормчилсон байрлал */
const SHAPE=[[-3.5764,1.0969,'A'],[1.7086,1.3346,'A'],[-1.0171,2.6433,'A'],[3.3162,-2.7075,'B'],[-5.0352,0.1615,'B'],[0.18,0.5734,'B'],[-0.8746,4.3662,'B'],[-0.4271,-1.9448,'C'],[1.3021,-1.8147,'C'],[-3.8427,-0.369,'C'],[1.4678,-0.1359,'C'],[0.4255,3.9604,'C'],[-2.6239,4.3019,'C'],[3.4772,-3.9643,'D'],[1.4779,-2.8245,'D'],[3.1652,-1.4717,'D'],[-2.3281,0.3938,'D'],[2.9329,0.609,'D'],[-0.894,1.213,'D'],[3.8001,1.786,'D'],[2.4768,2.7478,'D'],[2.7672,-4.4452,'E'],[-0.3256,-2.8523,'E'],[4.5629,-2.5821,'E'],[0.4162,-1.6095,'E'],[-1.244,-1.5901,'E'],[4.559,-1.3989,'E'],[2.0393,-1.2502,'E'],[3.0955,-0.5974,'E'],[0.1599,-0.5587,'E'],[2.4652,-0.2342,'E'],[-1.5839,0.7345,'E'],[3.7374,0.9397,'E'],[0.2559,2.2948,'E'],[0.7569,3.0645,'E'],[-1.8797,3.7723,'E'],[2.6766,-5.0259,'F'],[4.4142,-3.8249,'F'],[2.8097,-3.7506,'F'],[-0.2575,-3.437,'F'],[-0.9854,-2.4884,'F'],[0.7546,-2.3227,'F'],[5.0174,-2.2042,'F'],[5.0352,-1.7713,'F'],[-2.1755,-1.5878,'F'],[-1.7992,-1.3679,'F'],[1.4887,-1.062,'F'],[2.4737,-0.8289,'F'],[-1.0613,0.52,'F'],[-4.8788,1.1704,'F'],[-4.8796,1.5971,'F'],[0.7941,2.0702,'F'],[3.2596,2.6053,'F'],[-2.8833,5.0259,'F']];
const COUNT={A:3,B:4,C:6,D:8,E:15,F:18};
/* Дэд бүтцийн долоон нүд — тарилтгүй, тоног төхөөрөмжтэй */
/* Дэд бүтэц D ангид (90 м²) — тэнд яг найман нүд байгаагаас долоог нь эзэлнэ */
const THEMED={
  /* JACK'S COFFEE — хамгийн том ангийн нүд (A, 400 м²). Шувууны хоргодох
     байгууламж мөн энд байрлана: тэмдгийн эргэн тойрны чөлөөнд үүрний хайрцаг,
     усны цэг. Жижиг D нүдэнд тэмдэг уншигдахгүй байсан тул томд нь шилжив. */
  'AH':["Small Cup, Big Impact",'birds',"The Jack's Coffee land art: 10,000 Siberian elm "+
    "planted in the form of the company's mark, with nest boxes and a pond on the same cell — "+
    "canopy, shelter and water together, so the ground returns as habitat and not as a "+
    "plantation."],
  'E':['Solar field · 100 kW','energy','100 kW installed capacity — irrigation pumps, lighting, sensor network and battery reserve'],
  /* "Fog" биш: энэ бол эх газрын цөл, эрэг орчмынх биш — манан бараг байхгүй,
     шүүдэр, цан л байна. Мөн энэ нь усны эх үүсвэр биш нэмэлт: эх үүсвэр нь
     гүний худаг. */
  'J':['Water harvesting','water','Dew and hoarfrost capture with covered storage — a supplement to the borehole, not a supply'],
  'S':['Recycling and compost','waste','Sorting bays and a shaded composting yard — the compost returns to the planting pits'],
  'AD':['Research station','research','Weather and soil sensors, biodiversity monitoring'],
  /* D-05 сул боллоо: шувууны хоргодох газар A-01 руу нүүсэн тул энэ нүд
     энгийн тарилтын нүд болж, ивээн тэтгэхэд нээлттэй болов. */
  'AK':['Pollinator cell','insect','A nesting bank and forage for the bees native to this ground — no hives; see BUILD.insect for why'],
  /* Гэр, ангийн ширээ, тоглоомын талбай хасагдав: энэ нүд одоо зөвхөн хайлаас.
     COP17-ийн Цэнхэр бүсийн төлөөлөгчдийн павильоноор ирсэн хүн бүрд нэг мод
     бэлэглэсэн бөгөөд хэн эзэмшиж буйг жижиг тугууд заана. */
  'AR':['The delegation grove','community','Elm only — one tree for each participant from the COP17 Blue Zone delegation pavilion, with small flags for the delegations, organisations and companies that hold them']
};
/* Түншүүд өмнөх зэрэглэлдээ хамгийн ойр шинэ ангид шилжсэн */
const PARTNERS={'K':'EFES GROUP','P':'YVES ROCHER','R':'TIMBERLAND',
  'AM':'АРГА БИЛИГ',
  'B':'KHARKHORUM',
  /* EFES Group-ийн дөрвөн компани тус тусдаа хөрөнгө оруулсан тул тус бүр
     өөрийн нүд, өөрийн тугтай. Хамгийн жижиг анги (F, 12 м²).
     Талбайн өмнөд захын нүднүүд (F-01..F-04, төвөөс 43–73 м) дээр байхад
     тугнууд хэтэрхий жижиг харагдаж, аль компанийх нь ялгарахгүй байв. Иймд
     төвд хамгийн ойр дөрвөн F нүд рүү шилжүүлэв (14–28 м), дөрвөн өөр зүг рүү
     тарсан тул бие биенээ халхлахгүй. */
  'AJ':'EFES INTERNATIONAL','X':'EFES CONSTRUCTION',
  'AQ':'EFEC SUPERMARKET','N':'KHULAN UUL'};
/* CELL CODES. One letter per hexagon — A…Z then AA…BB, which is exactly 54.
   Ordered across the ground, north-west to south-east, so neighbouring cells
   carry neighbouring letters: the point of lettering them is that a cell can be
   found and reported on in the field, and letters that jumped between size
   classes would not do that.
   Indexed by position in SHAPE, so this file and the other one that walks SHAPE
   cannot drift apart. The size class is no longer readable from the code, so
   pit counts are stated per cell rather than derived from the letter. */
const LETTERS=["AH","AM","AS","K","AB","AL","BA","P","R","AC","AE","AY","AZ","E","J","S","AD","AN","AK","AR","AV","B","H","L","Q","O","T","Y","AA","W","AF","AI","AO","AT","AU","AX","A","F","D","C","G","I","U","V","M","N","X","Z","AJ","AG","AP","AQ","AW","BB"];
const CELLS=[];
(function(){
  SHAPE.forEach(function(h,idx){
    const key=h[2], S=SIZES[key];
    const code=LETTERS[idx], th=THEMED[code];
    CELLS.push({code:code,sizeKey:key,S:S,themed:!!th,cat:th?th[1]:'flora',
      name:th?th[0]:'Elm woodland',
      role:th?th[2]:S.area+' m² — '+S.pots+' pits at 1.5 m spacing, '+S.trees+
        ' elms, ten years of maintenance and irrigation',
      pots:th?0:S.pots, trees:th?0:S.trees,
      partner:PARTNERS[code]||null});
  });
})();
const TOT_TREES=CELLS.reduce(function(s,c){return s+c.trees;},0);
const TOT_POTS =CELLS.reduce(function(s,c){return s+c.pots;},0);
const fmt=function(n){return n.toLocaleString('en-US');};

const BEATS=[
  {cam:{r:104,theta:1.571,phi:.34},g:0.00,y:'2026',l:'before planting',num:'(01)',
   h:'Starting point',
   p:'Bare gravel surface. Rainfall is <b>about 100 mm a year</b>; evaporation runs several times higher.'},
  {cam:{r:60,theta:1.30,phi:.52},g:0.00,y:'2026',l:'phase 0 · survey',num:'(02)',
   h:'Phase 0 · Survey and Set-out',
   p:'<b>Site conditions decide cell placement, not the design drawing.</b> Hydrogeology fixes '+
     'where the borehole goes; soil analysis across five or six zones allocates species to '+
     'ground — salinity and depth to groundwater decide where tamarix is viable and where elm is '+
     'not; the topographic survey finds the low and elevated ground. All 54 cells are then set '+
     'out by GPS into a register of ID, type, size and coordinates.',
   mini:['5–6 soil zones','54 cells set out by GPS','gate · issued for construction']},
  {cam:{r:34,theta:1.10,phi:.78},g:0.00,y:'2026',l:'phase 1 · water + power',num:'(03)',
   h:'Phase 1 · Water and Power',
   p:'No cell, built or planted, is commissioned before the borehole produces and the pump has '+
     'permanent power — this is the critical path from day one. Drilling runs on temporary diesel '+
     'plant, so <b>the borehole and the solar array are built in parallel</b>: until the array is '+
     'energised the borehole is a hole, not a water source. Then storage, the dew-capture field, '+
     'and the trunk main out to every cell.',
   mini:['gate · pressure at every cell head','borehole ∥ solar array']},
  {cam:{r:44,theta:1.44,phi:.70},g:0.02,y:'2027',l:'phase 2 · enclosure + soil',num:'(04)',
   h:'Phase 2 · Enclosure and Soil',
   p:'Three hectares of perimeter fence certify livestock exclusion. The greenhouse and compost '+
     'yard follow — <b>production infrastructure, not amenity</b>: they supply seedlings and soil '+
     'amendment to every planting cell, and deferring them forces all stock to be bought in and '+
     'trucked across severely desertified terrain at higher cost and lower establishment. '+
     'Propagation starts; beds are cultivated zone by zone.',
   mini:['3 ha fenced','propagation running','beds prepared']},
  {cam:{r:26,theta:1.95,phi:.92},g:0.06,y:'2027',l:'phase 3 · buildings',num:'(05)',
   h:'Phase 3 · Buildings',
   p:'Every building is finished <b>before the first tree goes in</b>. Construction traffic '+
     'through established cells causes losses that get attributed to the planting programme but '+
     'are caused by the build. The hub is weathertight and serviced, the laboratory fitted out '+
     'with baseline measurement capability, and the community dormitory ready for staff and the '+
     'youth cohorts.',
   mini:['hub · laboratory','community dormitory','baseline measurement']},
  {cam:{r:40,theta:1.62,phi:.80},g:0.22,y:'2028',l:'phase 4 · pioneers',num:'(06)',
   h:'Phase 4 · Pioneer Planting',
   p:'Planted strictly in hardiness order, working from the windward edge inward. <b>Saxaul</b> · '+
     '<i>Haloxylon ammodendron</i> on the windward perimeter and elevated ground, stabilising sand '+
     'and cutting wind at ground level; <b>caragana</b> · <i>Caragana</i> spp. in the second rank, '+
     'fixing nitrogen; <b>tamarix</b> · <i>Tamarix</i> spp. on the saline and low-lying ground '+
     'nothing else will hold.',
   mini:['windward edge inward','nitrogen fixed','sand movement logged']},
  {cam:{r:32,theta:2.20,phi:.94},g:0.46,y:'2029',l:'phase 5 · secondary',num:'(07)',
   h:'Phase 5 · Secondary Planting',
   p:'One to two growing seasons after the pioneers establish: flowering species beside the shrub '+
     'cells, <b>Siberian elm</b> · <i>Ulmus pumila</i> in the sheltered interior, and <b>Mongolian '+
     'chives</b> · <i>Allium mongolicum</i> as understorey in partial shade. Elm is the signature '+
     'species and the most demanding — placed behind the saxaul and caragana ranks it inherits '+
     'their wind shelter and their nitrogen, which is what the <b>80% survival target</b> rests on.',
   mini:['elm · sheltered interior','understorey planted','first survival census']},
  /* Энэ үе шат бол А-01 нүд өөрөө: шувууны хоргодох байр + Jack's-ийн тэмдэг.
     Тул камер талбайн төв рүү бус тэр нүд рүү тольдож, dwell секунд тэндээ
     хүлээнэ — тэмдэг нь уншигдах хугацаа гарна. */
  {cam:{r:19,theta:2.42,phi:0.96},look:{x:-44.4,z:13.6},dwell:4.0,
   g:0.68,y:'2031',l:'phase 6 · habitat',num:'(08)',
   h:'Phase 6 · Habitat Structures',
   p:'Structures do not attract fauna on their own — <b>forage must precede colonisation</b>. '+
     'The nesting bank goes in only once the flowering species are in flower; the bird hotel '+
     'only once the canopy gives adjacent cover and the insect populations exist to feed on. '+
     'The cell in view '+
     'is <b>A-01, Small Cup, Big Impact</b> — the Jack\'s Coffee mark in 10,000 elms, with the '+
     'nest boxes and pond set in the open ground inside it.',
   mini:['nesting bank after first flowering','bird hotel after canopy','cell A-01']},
  /* Сүүлийн үе — газрын түвшний ташуу өнцөг. Дээрээс харсан төлөвлөгөө нь
     хэлбэрийг сайн харуулдаг ч тугууд шугам болж хавтгайрч, ямар компанийн
     туг болох нь уншигдахгүй байв. Камерыг тугны оройтой ойролцоо өндөрт
     (r·cos(phi)+2 ≈ 18) буулгаж, талбай дээгүүр ташуу харуулав: тугууд бүтэн
     өргөнөөрөө, ард нь бүрхэвч харагдана. */
  {cam:{r:31.5,theta:1.571,phi:1.30},g:0.86,y:'2032',l:'phase 7 · monitoring',num:'(09)',
   h:'Phase 7 · Monitoring and Reporting',
   p:'Running continuously since the laboratory was commissioned. Irrigation is telemetered and '+
     'solar-powered; <b>every planted cell is assessed once a year</b>; NDVI and land '+
     'cover are read annually against the pre-planting baseline and ground-truthed; soil organic '+
     'carbon is cored every three years to an accredited laboratory; pollinators, decomposers, '+
     'small mammals and nesting birds are surveyed annually.',
   mini:['assessment · annual','NDVI · annual','soil carbon · every 3 years']}
];
/* Лавлагааны хэлбэр цагираган торлолоос бараг хоёр дахин өргөн (хагас алгасал
   31.7 м → 62.4 м) тул хэсгүүдийн камерын зайг мөн хэмжээгээр татна. Тус бүрийг
   гараар засахын оронд нэг коэффициентээр — өнцөг, харьцаа нь хэвээр үлдэнэ. */
const CAMK=1.97;
BEATS.forEach(function(b){ b.cam.r*=CAMK; });


/* JACK'S COFFEE аль эсэд байгаа. Модулийн хүрээнд байх ёстой: openCell нь
   init3D-ээс гадна тодорхойлогддог тул дотор нь зарлавал нүд дарах бүрд
   ReferenceError өгч, дэлгэрэнгүй цонх огт нээгдэхгүй болно. */
const JACKS_CELL='AH';

/* ---------- дэлгэрэнгүй ---------- */
const D=document.getElementById('hx-detail');
/* pt нь дарсан цэгийн 3D байрлал. Байвал цонхыг тухайн нүдний дэргэд гаргана;
   байхгүй үед (эсвэл нарийн дэлгэц дээр) хуучин ёсоор доод хэсэгт наана. */
function placePanel(pt){
  D.style.left=''; D.style.top='';
  if(!pt || !cam || !rend || window.innerWidth<900){ D.classList.remove('at'); return; }
  D.classList.add('at');
  const v=pt.clone().project(cam), r=rend.domElement.getBoundingClientRect();
  const px=r.left+(v.x*.5+.5)*r.width, py=r.top+(-v.y*.5+.5)*r.height;
  const w=D.offsetWidth, h=D.offsetHeight, M=16, G=22;
  /* Нүдний баруун талд байрлуулна; багтахгүй бол зүүн тийш эргүүлнэ. Дараа нь
     цонхны хүрээнд шахна — үзэгдэх хэсгээс гарвал агуулга алдагдана. */
  let x=px+G; if(x+w>window.innerWidth-M) x=px-G-w;
  D.style.left=Math.max(M,Math.min(x,window.innerWidth-M-w))+'px';
  D.style.top =Math.max(M,Math.min(py-h/2,window.innerHeight-M-h))+'px';
}
function openCell(c,pt){
  document.getElementById('hxDcode').textContent=c.code;
  document.getElementById('hxDname').textContent=c.partner||c.name;
  document.getElementById('hxDrole').textContent=c.role;
  const st=document.getElementById('hxDst');
  if(c.partner){st.className='st taken';st.textContent='Claimed · '+c.partner;}
  else if(c.themed){st.className='st';st.textContent='Project infrastructure — not offered for sponsorship';}
  else{st.className='st';st.textContent='Available — ten years of maintenance and irrigation included';}
  /* JACK'S COFFEE-ийн тайлбар зөвхөн өөрийнх нь эс дээр. Энэ эс дээр "Claim a
     cell" ч, "not offered for sponsorship" ч утгагүй: оролцох арга нь кофе
     худалдаж авах явдал тул төлөвийн мөрийг нуугаад худалдан авах товчийг
     үлдээнэ. */
  const jx=document.getElementById('hxDjacks'), cl=document.getElementById('hxDclaim');
  const isJacks=(c.code===JACKS_CELL);
  if(jx) jx.hidden=!isJacks;
  if(cl) cl.hidden=isJacks;
  st.hidden=isJacks;
  /* Хүснэгт нь эсийн ерөнхий тоонуудыг харуулдаг — Jack's дээр тэдгээр нь
     утгагүй болно (нүд нь дэд бүтэц тул нүх, мод нь "—", талбай нь хоёр нүдэнд
     давхардана). Оронд нь бүтээлийн өөрийн хэмжигдэхүүнүүд:
     10,000 мод ÷ 2,500 м² = яг 4 мод/м², тэмдгийн хүрээ 63×73 м. */
  const KV=isJacks
    ? [['Elms','10,000'],['Planted','0.25 ha'],['Mark','63 × 73 m'],['Density','4 / m²']]
    : [['Area',c.S.area+' m²'],['Pits',c.themed?'—':fmt(c.pots)],
       ['Elms',c.themed?'—':fmt(c.trees)],['Class',c.sizeKey+' · '+c.S.area+' m²']];
  ['hxDk1','hxDk2','hxDk3','hxDk4'].forEach(function(id,i){
    const el=document.getElementById(id); if(el) el.textContent=KV[i][0]; });
  ['hxDarea','hxDpots','hxDtrees','hxDsize'].forEach(function(id,i){
    const el=document.getElementById(id); if(el) el.textContent=KV[i][1]; });
  placePanel(pt);
  D.classList.add('open');
}
/* Хуудсанд энэ самбар байхгүй байж болно (жишээ нь дэлгэцийн горим) —
   хамгаалалтгүй бол энэ мөр файлыг бүхэлд нь зогсоож, нэг ч дүр зураг
   баригдахгүй. */
(function(){ var x=document.getElementById('hxDx');
  if(x) x.onclick=function(){D.classList.remove('open');}; })();

/* ---------- бичвэрийн солилт ---------- */
const capEl=document.getElementById('hxCap');
let capIdx=-1;
function setCap(i){
  if(i===capIdx) return;
  capIdx=i;
  const b=BEATS[i];
  capEl.classList.add('out');
  setTimeout(function(){
    /* Year and title in one box, the prose and chips in another, so the strip under the
       scene can be set as two columns on a wide screen instead of leaving its right half
       empty. Stacked, the boxes read in the same order as before. */
    capEl.innerHTML='<div class="hx-caphead"><div class="yr">'+b.y+' · '+b.l+'</div>'+
      '<h3>'+b.num+' '+b.h+'</h3></div><div class="hx-capbody"><p>'+b.p+'</p>'+
      (b.mini?'<div class="mini">'+b.mini.map(function(m){return '<span>'+m+'</span>';}).join('')+'</div>':'')+'</div>';
    capEl.classList.remove('out');
  },180);
}

/* ---------- 3D ---------- */
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
const host=document.getElementById('hxCanvas');
const stageEl=document.getElementById('hxStage');
const stickyEl=document.getElementById('hxSticky');
let scene,cam,rend,clock,ray,pointer,hexes=[],trunkIM,leafIM,TREES=[],TPARTS=[],LPARTS=[],INFRA=[],dummy;
let infra=0, SITE=null;
/* lx/lz — камерын харах цэг. Анхдагчаар талбайн төв (0,0); тодорхой нүд рүү
   тольдох үед л шилжинэ, тул бусад үе шат яг хуучнаараа хэвээр байна. */
let camS={r:126,theta:.5,phi:.62,lx:0,lz:0}, camT={r:126,theta:.5,phi:.62,lx:0,lz:0};
let season=1, paintLeaves=null, sunL=null, hemiL=null, groundM=null, SNOW=null;
let DT=0, lastT=0;
/* Эхлэх төлөв нь сүүлийн он: дүр зураг бэлэн үр дүнгээ харуулж зогсоно */
let drag=null,dragTheta=0,moved=0,beatF=0,growth=0,visible=false;
const SC=function(hex){return window.THREE?new THREE.Color(hex).convertSRGBToLinear():null;};
const SAND=window.THREE?SC('#CFC2A4'):null;
const GREEN=window.THREE?SC('#7D9A46'):null;

/* PITCH нь хамгийн том зургаалжны радиусыг метр рүү хөрвүүлнэ: A нүд 400 м²,
   тогтмол зургаалжны талбай = 2.598·R² тул R = √(400/2.598) = 12.41 м. */
const PITCH=12.41;
const SLOTS=SHAPE.map(function(h){return{x:h[0]*PITCH, z:h[1]*PITCH};});
const rnd=function(s){let v=Math.abs(Math.round(s*9301+49297))%233280;
  return function(){v=(v*9301+49297)%233280;return v/233280;};};

function size(){return {w:host.clientWidth||stickyEl.clientWidth,
                        h:host.clientHeight||stickyEl.clientHeight};}


function init3D(){
  dummy=new THREE.Object3D();
  SNOW=SC('#E9EBEC');
  scene=new THREE.Scene();
  scene.fog=new THREE.Fog(SC('#F2F0EA').getHex(),210,470);
  const s=size();
  cam=new THREE.PerspectiveCamera(42,s.w/s.h,.5,600);
  rend=new THREE.WebGLRenderer({antialias:true,alpha:true});
  rend.setPixelRatio(Math.min(devicePixelRatio,2));
  /* updateStyle=false — эс бөгөөс inline хэмжээ CSS-ийг дарж, дүрс нь
     доорх бичвэрийн зурвасыг халхална */
  rend.setSize(s.w,s.h,false);
  /* Өнгөний зай — үүнгүйгээр бүх өнгө хавтгай, хиймэл харагдана */
  rend.outputEncoding=THREE.sRGBEncoding;
  rend.shadowMap.enabled=true; rend.shadowMap.type=THREE.PCFSoftShadowMap;
  host.appendChild(rend.domElement);

  /* Тэнгэрийн сэрүүн дүүргэлт сул, нарны шууд туяа хүчтэй.
     Ингэснээр сүүдэр гүн, гэрэлтсэн тал тод болж эзэлхүүн үүснэ. */
  const hemi=new THREE.HemisphereLight(0xFFFFFF,0xFFFFFF,.5);
  hemi.color.copy(SC('#D8E6FF')); hemi.groundColor.copy(SC('#C2B394'));
  scene.add(hemi); hemiL=hemi;
  const sun=new THREE.DirectionalLight(0xFFFFFF,1.6);
  sun.color.copy(SC('#FFF2D4')); sunL=sun;
  sun.position.set(42,84,28); sun.castShadow=true; sun.shadow.mapSize.set(window.__laShadowMap||2048,window.__laShadowMap||2048);
  sun.shadow.bias=-0.0006;
  const d=62;
  sun.shadow.camera.left=-d;sun.shadow.camera.right=d;
  sun.shadow.camera.top=d;sun.shadow.camera.bottom=-d;sun.shadow.camera.far=210;
  scene.add(sun);

  groundM=new THREE.MeshStandardMaterial({color:SC('#CBBEA0'),roughness:1});
  /* Дугуй биш хавтгай: дугуйн ирмэг нь дээрээс харахад элсэн дискний зах болж
     харагдана. Мананд уусах хэмжээний том хавтгай өгвөл суурь дэлгэцийг бүтэн
     дүүргэнэ (манан 210…470 тул 900 нэгж хангалттай). */
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,900),groundM);
  ground.rotation.x=-Math.PI/2; ground.position.y=-.02; ground.receiveShadow=true;
  scene.add(ground);

  /* ── Түншийн туг ─────────────────────────────────────────────────────────
     Эс худалдаж авсан компани бүр өөрийн тугтай. Даавуу нь салхинд намирна:
     тор бүхий хавтгайн орой бүрийг синусын хоёр давалгаагаар хөдөлгөнө —
     нэг нь урт, нэг нь богино — тул хэмнэл давтагдсан мэт харагдахгүй. Мачтаас
     хол байх тусам далайц нэмэгдэнэ, яг л жинхэнэ даавуу шиг. Хоёр талаас нь
     харагдах ёстой тул DoubleSide. */
  /* Логоны харьцааг мэдэж байх ёстой: Timberland_M.svg-д width/height байхгүй,
     зөвхөн viewBox — ийм SVG-г зурган текстур болгоход хөтөч 300×150 гэж таамаглаж,
     лого сунана. Харьцааг эрэлтийн газрын зургийн PARTNERS өгөгдлөөс авав. */
  const FLAG_LOGOS={
    'K':{url:'assets/images/partner/hexagon-cells/EFES-GROUP_L.png',  ar:1.41},
    'P':{url:'assets/images/partner/hexagon-cells/Yves-Rocher_M.webp',ar:4.65},
    'R':{url:'assets/images/partner/hexagon-cells/Timberland_M.svg',  ar:5.70},
    'AM':{url:'assets/images/partner/hexagon-cells/АРГА БИЛИГ.jpg', ar:1.0},
    'AJ':{url:'assets/images/partner/hexagon-cells/EFES-INTERNATIONAL_S.jpg', ar:3.02},
    'X':{url:'assets/images/partner/hexagon-cells/EFES-CONSTRUCTION_S.png',  ar:1.51},
    'AQ':{url:'assets/images/partner/hexagon-cells/EFEC-SUPERMARKET_S.png',   ar:2.76},
    'N':{url:'assets/images/partner/hexagon-cells/KHULAN-UUL_S.png',         ar:3.67},
    /* JACK'S COFFEE — A-01. Гар дээрх лого нь ЦАГААН дүрстэй (харанхуй
       дэвсгэрт зориулсан) тул цагаан даавуун дээр үл харагдана; иймд хэлбэрийг
       хөндөхгүй, зөвхөн бэхийг тодруулсан хувилбар үүсгэв. off нь тугийг эсийн
       ТӨВӨӨС зөөнө — тэр төвд Jack's-ийн тэмдэг тарьсан байдаг тул мачт нь
       тэмдгийн дундуур гарах ёсгүй. Цөөрөм (-1.05,.58) талаас эсрэг зүгт. */
    'AH':{url:'assets/images/partner/hexagon-cells/JACKS-COFFEE_A.png', ar:0.546,
            off:{x:0.56,z:-0.60}}
  };
  const FLAGS=[];
  window.__hexFlags=FLAGS;
  /* Нэг эс = нэг эзэн гэсэн дүрэм D-07-д хамаарахгүй: төлөөлөгчдийн нүдэн дэх
     модыг COP17-ийн Цэнхэр бүсээр ирсэн хүн бүр эзэмшинэ. Тиймээс тэнд ганц том
     туг биш, жижиг тугуудын цагираг. Компаниудын тугууд өөрсдийн эс дээрээ
     хэвээр — энд давхардуулахгүй. */
  const DLG='assets/images/partner/delegations/';
  const CELL_FLAG_SETS={
    /* Герман, Францын туг хасагдав: зөвшөөрлийг GIZ, AVSF буюу БАЙГУУЛЛАГУУД
       өгсөн, тэдний улс өгөөгүй. Улсын тугийг гишүүнчлэлийн тэмдэг болгон
       тавих нь тухайн улс дэмжсэн гэсэн утга үүсгэнэ. Байгууллагын лого тэр
       утгыг үүсгэхгүй — тэд өөрсдөө зөвшөөрсөн. */
    'AR':[
      {url:DLG+'mongolia.png',     ar:2.000},
      {url:DLG+'saudi-arabia.png', ar:1.500},
      {url:DLG+'giz.png',          ar:3.840},
      {url:DLG+'avsf.png',         ar:2.899},
      {url:DLG+'arbori.png',       ar:3.200},
      {url:DLG+'mmse.png',         ar:4.375},
      /* Түншийн зурвасын логонууд ЦАГААН дэвсгэргүй — бараан хэсэгт зориулсан.
         Цагаан даавуун дээр үл харагдах тул бэхэн хувилбарыг тусад нь хийв. */
      {url:DLG+'plastic-center.png', ar:2.595},
      {url:DLG+'ongo-nemye.png',     ar:2.050},
      {url:DLG+'oim.png',            ar:1.027},
      {url:DLG+'fpwc.png',           ar:3.394}
    ]
  };
  /* Логог цагаан даавуун дээр буулгана: PNG-үүд тунгалаг дэвсгэртэй тул шууд
     наавал туг цоорхойтой харагдана. Canvas дээр нийлүүлбэл хэвлэсэн туг шиг. */
  function clothTexture(spec,W,H,done){
    const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    const x=cv.getContext('2d');
    x.fillStyle='#FFFFFF'; x.fillRect(0,0,W,H);
    /* Цайвар элсэн дэвсгэр дээр цагаан даавуу уусдаг — ирмэгийг тодруулна */
    x.strokeStyle='#15160F'; x.lineWidth=Math.max(3,W*0.012);
    x.strokeRect(x.lineWidth/2,x.lineWidth/2,W-x.lineWidth,H-x.lineWidth);
    x.fillStyle='#B2D135'; x.fillRect(0,0,Math.max(6,W*0.028),H);
    const tex=new THREE.CanvasTexture(cv);
    const img=new Image();
    img.onload=function(){
      const pad=W*0.09, aw=W-pad*2, ah=H-pad*2;
      const s=Math.min(aw/spec.ar,ah), dw=s*spec.ar, dh=s;
      x.drawImage(img,(W-dw)/2,(H-dh)/2,dw,dh);
      tex.needsUpdate=true;
    };
    img.onerror=function(){ /* лого ирэхгүй бол цагаан туг үлдэнэ */ };
    img.src=spec.url;
    done(tex);
  }
  /* Мачт, даавуу, текстур — байрлал ба өндрийг гаднаас нь өгнө. Ингэснээр нэг
     эсэд нэг ч, зургаа ч туг босгоход ижил код ажиллана. */
  function placeFlag(spec,x,z,y,poleH,sizeH){
    /* Даавууны хэмжээ мачтын өндрөөс ТУСДАА: ар эгнээг өндөрлөхөд туг нь
       томроод, хоёр эгнээ өөр өөр хэмжээтэй мэт харагдаж байв. */
    const bh=sizeH||poleH, cw=bh*0.62, ch=bh*0.34;
    const g=new THREE.Group();
    g.position.set(x,y,z);

    const pole=new THREE.Mesh(new THREE.CylinderGeometry(poleH*.012,poleH*.016,poleH,6),
      new THREE.MeshStandardMaterial({color:SC('#8A8578'),roughness:.6,metalness:.3}));
    pole.position.y=poleH/2; g.add(pole);

    const mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85,
      side:THREE.DoubleSide});
    const cloth=new THREE.Mesh(new THREE.PlaneGeometry(cw,ch,14,8),mat);
    /* Мачт нь даавууны зүүн ирмэг дээр — тиймээс хагас өргөнөөр нь хойш нь зөөнө */
    cloth.position.set(cw/2,poleH-ch*0.62,0);
    g.add(cloth);
    scene.add(g);

    clothTexture(spec,512,Math.round(512*ch/cw),function(tx){
      if(THREE.SRGBColorSpace && tx.colorSpace!==undefined) tx.colorSpace=THREE.SRGBColorSpace;
      else if(THREE.sRGBEncoding && tx.encoding!==undefined) tx.encoding=THREE.sRGBEncoding;
      mat.map=tx; mat.needsUpdate=true;
    });

    FLAGS.push({group:g,cloth:cloth,base:cloth.geometry.attributes.position.array.slice(),
      cw:cw,phase:FLAGS.length*1.7});
  }
  /* Ганц эзэнтэй эсийн туг эсээсээ хавьгүй өргөн (даавуу нь эсийн радиусаас том)
     — нэг ширхэг байхад асуудалгүй, зургаа болоход бие бие рүүгээ орно. Тиймээс
     цагираг биш, эгнээ: 3×2 сүлжээ, даавууны өргөнөөр зайлуулж, ар талынхыг нь
     өндөрлөнө. Тугууд уншигч руу эргэдэг (wave-г үз) тул сүлжээ аль ч өнцгөөс
     ижил уншигдана. */
  function makeFlagCluster(p,S,specs){
    /* Дөрөв хүртэл бол хоёр багана — нарийн байж, талбайн ирмэгээс халихгүй.
       Түүнээс олон бол гурав: есөн тугийг хоёр баганаар өрвөл таван эгнээ
       гүн болж, урдах эгнээ ардахаа бүрэн далдална. */
    const n=specs.length, cols=Math.min(n<=4?2:3,n), rows=Math.ceil(n/cols);
    /* Ганц тугийн 0.42 нь эсэд багтаж байсан ч уншигдахгүй байв: талбайн
       өнцгөөс лого хэдхэн пиксел болно. Уншигдах нь эхний шаардлага тул
       0.72 — сүлжээ нь эсээсээ халина, яг л ганц туг хальдагтай адил. */
    const poleH=Math.max(3.0,PITCH*0.72), cw=poleH*0.62;
    const gx=cw*1.18, gz=poleH*0.42;
    for(let i=0;i<n;i++){
      const cx=i%cols, cz=Math.floor(i/cols);
      placeFlag(specs[i],
        p.x+(cx-(cols-1)/2)*gx,
        p.z+(cz-(rows-1)/2)*gz,
        S.h, poleH*(1+cz*0.30), poleH);
    }
  }
  function makeFlag(c,p,S){
    const set=CELL_FLAG_SETS[c.code];
    if(set) return makeFlagCluster(p,S,set);
    const spec=FLAG_LOGOS[c.code]; if(!spec) return;
    const poleH=Math.max(3.2,PITCH*1.15);
    /* Анхдагчаар эсийн төвд. off байвал эсийн радиусын хувиар зөөнө. */
    const cr=PITCH*S.rad*0.9;
    placeFlag(spec,p.x+(spec.off?spec.off.x*cr:0),p.z+(spec.off?spec.off.z*cr:0),S.h,poleH);
  }
  function wave(t){
    for(let i=0;i<FLAGS.length;i++){
      const F=FLAGS[i], pos=F.cloth.geometry.attributes.position, a=pos.array, b=F.base;
      /* Туг бүр УНШИГЧ РУУ эргэнэ. Өмнө нь бүгд салхины нэг чиглэлд харж байсан тул
         талбайн хажуу талын тугууд камерт ирмэгээрээ харагдаж, ямар компанийн туг
         болох нь танигдахгүй байв. Голынх нь л уншигдана. Салхины найгалт хэвээр,
         зөвхөн суурь өнцөг нь камераас тооцогдоно. */
      const dx=cam.position.x-F.group.position.x, dz=cam.position.z-F.group.position.z;
      F.group.rotation.y=Math.atan2(dx,dz)+Math.sin(t*.55+F.phase)*.08;
      for(let v=0;v<a.length;v+=3){
        /* x нь мачтаас хойших зай (0…cw) — далайц түүнтэй хамт өснө */
        const k=Math.max(0,b[v]+F.cw/2)/F.cw;
        a[v+2]=b[v+2]+(Math.sin(t*3.1+b[v]*2.2+F.phase)*.16
                      +Math.sin(t*1.7+b[v+1]*1.4+F.phase)*.09)*k*F.cw*.5;
        a[v+1]=b[v+1]+Math.sin(t*2.3+b[v]*1.8+F.phase)*.04*k*F.cw*.5;
      }
      pos.needsUpdate=true;
      F.cloth.geometry.computeVertexNormals();
    }
  }
  window.__hexFlagWave=wave;

  CELLS.forEach(function(c,i){
    const S=c.S, p=SLOTS[i];
    const radius=PITCH*S.rad*.9;
    const geo=new THREE.CylinderGeometry(radius,radius*.97,S.h,6,1);
    const mat=new THREE.MeshStandardMaterial({color:SAND.clone(),roughness:.9});
    const m=new THREE.Mesh(geo,mat);
    m.position.set(p.x,S.h/2,p.z);
    /* Эргэлтгүй: CylinderGeometry-ийн анхны орой 90°-д, өөрөөр хэлбэл оройгоороо
       дээшээ (pointy-top) — HEXAGON SHAPE.png дээрх чиглэл яг ийм. π/6-ээр
       эргүүлбэл хавтгай талаараа дээшээ харна. */
    m.rotation.y=0; m.castShadow=false; m.receiveShadow=true;
    scene.add(m);
    hexes.push({mesh:m,mat:mat,c:c,i:i,x:p.x,z:p.z,top:S.h,radius:radius});
    /* Туг нь лого тодорхойлогдсон бүх эсэд гарна. Урьд нь зөвхөн c.partner
       байхыг шалгадаг байсан тул A-01 (төслийн бүтээл, худалдаанд байхгүй)
       туггүй үлдэж байв. */
    if(c.partner || FLAG_LOGOS[c.code] || CELL_FLAG_SETS[c.code]) makeFlag(c,p,S);
  });

  /* --- модны байрлал (дэд бүтцийн нүдэнд мод тарихгүй) --- */
  /* ── JACK'S COFFEE · D-05 ─────────────────────────────────────────────────
     Бүтээл нь тусдаа талбай байхаа больж, шувууны хоргодох эс дотор орлоо.
     Хоёр хэлбэр зэрэг уншигдах ёстой: зургаалжны ирмэгээр хайлаас "хашаа"
     болж эргэн тарина, дотор нь Jack's-ийн тэмдэг. Тэмдгийг SHAPES.jacks
     маскаас уншиж, эсийн дотор багтаана.
     Тайлбар дахь 10,000 мод ба 2,500 м² нь бүтээлийн баримт — энд зөвхөн
     зурагдах хэлбэр өөрчлөгдөнө. */
  /* Маск ба зохиомжийн код энэ функцээс гарч, файлын дээд талын __jacksCell
     руу шилжсэн — лэнд артын хэсэг дэх Jack's-ийн тусдаа дүр зураг мөн адил
     түүнийг дуудна. Энд байлгавал зөвхөн энэ IIFE хардаг байсан. */
  function plantJacksCell(h){
    const R=rnd(h.i*17+5), cf=PITCH/3.05;
    /* Хашаа ба тэмдгийн зохиомж нь файлын дээд талын __jacksCell дотор.
       Лэнд артын хэсэг дэх Jack's-ийн тусдаа дүр зураг яг үүнийг дуудна —
       нэг эх сурвалж, хоёр газар. Энд өөрчлөлт хийвэл тэнд ч дагана. */
    window.__jacksCell(h.radius*.92).forEach(function(p){
      TREES.push({x:h.x+p.x, z:h.z+p.z, base:h.top,
        H:(0.42+R()*0.22)*cf*(p.hedge||.5), off:R()*.34, sway:R()*6.28, spin:R()*6.28, e:0});
    });
  }

  hexes.forEach(function(h){
    if(h.c.code===JACKS_CELL){ plantJacksCell(h); return; }
    if(h.c.themed) return;
    const R=rnd(h.i*17+5), n=h.c.S.n, rad=h.radius*.86;
    /* Модны өндөр үнэмлэхүй нэгжээр бичигдсэн бөгөөд хуучин 3.05-ийн алгасалд
       тохируулагдсан байсан. Лавлагааны хэлбэрт алгасал 12.41 болсон тул тэр
       харьцаагаар татахгүй бол мод нүдний дотор үл үзэгдэх толбо болно. */
    const cf=PITCH/3.05;              // мод хаана ч ижил хэмжээтэй
    /* Тарилт нь сүлжээ биш, ГҮХ. Талбай дээр зэрэгцээ шулуун ховил ухаж, ховил
       бүрийн дагуу мод тарина — мөр бүрийн урт нь зургаалжны ирмэгээр тасарч,
       хэлбэрийг мод өөрсдөө зурна. Нүдийг rotation.y=π/6-ээр эргүүлсэн тул дээд,
       доод ирмэг нь z тэнхлэгт хөндлөн: эхний ба сүүлийн ховил яг ирмэг дээр
       таарч, зургаалжин цэвэр уншигдана.
       Оройнууд (±rad,0) ба (±rad/2,±apo)-д тул мөрийн хагас өргөн шугамаар
       багасна: w(z) = rad·(1 − |z| / (2·apo)). */
    /* Оройгоороо дээш харсан зургаалжин: орой (0,±rad)-д, хажуугийн хавтгай тал нь
       x = ±apo дээр. Тиймээс ховил z = −rad…+rad хооронд явж, хагас өргөн нь дунд
       бүсдээ тогтмол, орой руугаа шугамаар нарийсна:
         |z| ≤ rad/2  →  w = apo
         |z| > rad/2  →  w = 2·apo·(rad − |z|)/rad */
    const apo=rad*0.8660254;
    const d=Math.sqrt(2.598*rad*rad/n);           // ховил хоорондын = ховил доторх алхам
    const rows=Math.max(1,Math.round(2*rad/d));
    for(let j=0;j<=rows;j++){
      const z=-rad+(2*rad-rows*d)/2+j*d;
      const w=Math.abs(z)<=rad/2 ? apo : 2*apo*(rad-Math.abs(z))/rad;
      if(w<=0) continue;
      const cols=Math.max(0,Math.round(2*w/d));
      for(let i=0;i<=cols;i++){
        const x=-w+(2*w-cols*d)/2+i*d;
        /* Хэлбэлзэлгүй: ухсан ховил шулуун, мод нь ховилын алхмаар яг суудаг. */
        TREES.push({x:h.x+x, z:h.z+z, base:h.top,
          H:(0.42+R()*0.22)*cf, off:R()*.34, sway:R()*6.28, spin:R()*6.28, e:0});
      }
    }
  });

  /* --- хайлаасны бүтэц ---
     Иш нь намхан хэсэгтээ сэрээлж, олон нимгэн мөчир титэм рүү сунана.
     Навчийг битүү бөмбөлөг биш, тунгалаг ирмэгтэй давхаргаар зурна. */
  const BR=[
    {oy:0,   len:.46, rad:.050, tx:0,    tz:0},
    {oy:.36, len:.44, rad:.032, tx:0,    tz:.44},
    {oy:.40, len:.40, rad:.029, tx:.38,  tz:-.26},
    {oy:.46, len:.34, rad:.023, tx:-.34, tz:-.12},
    {oy:.54, len:.30, rad:.017, tx:.20,  tz:.62},
    {oy:.58, len:.28, rad:.015, tx:-.52, tz:.30},
    {oy:.60, len:.26, rad:.014, tx:.48,  tz:-.48},
    {oy:.64, len:.24, rad:.012, tx:-.24, tz:-.60},
    {oy:.68, len:.22, rad:.011, tx:.62,  tz:.16},
    {oy:.70, len:.20, rad:.010, tx:-.14, tz:.70}
  ];
  /* rho — төвөөс хол, oy — өндөр, r — хэмжээ, dark — гүн сүүдэрт эсэх */
  const LEAF=[
    {rho:.06,oy:.78,r:.34,d:1},{rho:.14,oy:.68,r:.32,d:1},
    {rho:.10,oy:.86,r:.30,d:0},{rho:.20,oy:.74,r:.31,d:1},
    {rho:.38,oy:.82,r:.28,d:0},{rho:.42,oy:.70,r:.29,d:0},
    {rho:.46,oy:.62,r:.27,d:1},{rho:.40,oy:.88,r:.25,d:0},
    {rho:.52,oy:.76,r:.26,d:0},{rho:.56,oy:.66,r:.24,d:0},
    {rho:.64,oy:.72,r:.22,d:0},{rho:.66,oy:.58,r:.21,d:1},
    {rho:.60,oy:.84,r:.20,d:0},{rho:.70,oy:.62,r:.19,d:0}
  ];
  TREES.forEach(function(tr,ti){
    BR.forEach(function(f,fi){
      TPARTS.push({t:ti,oy:f.oy,len:f.len,rad:f.rad,
        tx:f.tx*(0.7+0.6*Math.abs(Math.sin(ti*3.1+fi))),
        tz:f.tz*(0.7+0.6*Math.abs(Math.cos(ti*2.3+fi))),
        thin:fi>3});
    });
    LEAF.forEach(function(c,ci){
      const a=tr.spin+ci*2.39+Math.sin(ti+ci)*.4;
      const j=Math.abs(Math.sin(ti*1.7+ci*3.3));
      LPARTS.push({t:ti,
        ox:Math.cos(a)*c.rho*.88*(0.85+0.3*j),
        oz:Math.sin(a)*c.rho*.88*(0.85+0.3*j),
        oy:c.oy+(j-.5)*.05,
        r:c.r*(0.86+0.3*j), d:c.d, ph:a});
    });
  });

  /* --- навчны бүтэц: өнгөгүй, зөвхөн хэлбэр ба нягтрал.
         Өнгийг доорх instance color өгнө — ингэснээр өнгө хяналттай болно. --- */
  function leafTexture(){
    const cv=document.createElement('canvas'); cv.width=cv.height=128;
    const g=cv.getContext('2d');
    for(let i=0;i<160;i++){
      const a=Math.random()*Math.PI*2;
      const rr=Math.pow(Math.random(),.52)*58;
      const x=64+Math.cos(a)*rr, y=64+Math.sin(a)*rr*.94;
      const s=2.2+Math.random()*4.4;
      const v=Math.round(168+Math.random()*87);           // 168–255 саарал
      g.fillStyle='rgba('+v+','+v+','+v+','+(.72+Math.random()*.28)+')';
      g.beginPath(); g.ellipse(x,y,s,s*.66,Math.random()*3.14,0,6.283); g.fill();
    }
    const tx=new THREE.CanvasTexture(cv);
    tx.encoding=THREE.sRGBEncoding;
    tx.anisotropy=rend.capabilities.getMaxAnisotropy();
    return tx;
  }

  const tg=new THREE.CylinderGeometry(.55,1,1,5); tg.translate(0,.5,0);
  trunkIM=new THREE.InstancedMesh(tg,
    new THREE.MeshStandardMaterial({color:0xFFFFFF,roughness:.95}),TPARTS.length);
  leafIM=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),
    new THREE.MeshStandardMaterial({map:leafTexture(),alphaTest:.42,
      side:THREE.DoubleSide,roughness:.92,metalness:0}),LPARTS.length);
  trunkIM.castShadow=true; trunkIM.receiveShadow=true;
  leafIM.castShadow=true; leafIM.receiveShadow=true;
  scene.add(trunkIM); scene.add(leafIM);

  const col=new THREE.Color();
  TPARTS.forEach(function(p,i){
    // холтос: цайвар саарал-бор, мөчир рүүгээ бараан
    const l=(p.thin?.30:.46)+Math.sin(i*7.1)*.045;
    col.setHSL(.095,.12,Math.max(.16,Math.min(.62,l))).convertSRGBToLinear();
    trunkIM.setColorAt(i,col);
  });
  trunkIM.instanceColor.needsUpdate=true;
  paintLeaves=function(){
   const S=SEASONS[season];
   LPARTS.forEach(function(p,i){
    /* Байгалийн навч зөвхөн гэрэлтэй, харанхуй гэж ялгарахгүй — өнгө нь ч
       өөрчлөгддөг. Наранд шаравтар ногоон, сүүдэрт хөхөвтөр гүн ногоон. */
    const sun=p.d?0:1;
    const lift=(p.oy-.55)/.40;                        // 0…1
    const v=Math.sin(i*4.7), w=Math.sin(i*2.9);
    const hue=.255-.028*sun-.012*lift+v*.010+S.dh;    // улирлаар шилжинэ
    const sat=(.30+.13*sun+.05*lift+w*.035)*S.ds;
    const lig=(.17+.20*lift+.11*sun+v*.028)*S.dl;
    col.setHSL((hue+1)%1,Math.max(.05,Math.min(.62,sat)),
                    Math.max(.08,Math.min(.60,lig))).convertSRGBToLinear();
    leafIM.setColorAt(i,col);
   });
   leafIM.instanceColor.needsUpdate=true;
  };
  paintLeaves();

  /* ==== ДЭД БҮТЭЦ ====
     Материал бүгд одоо байгаа багцаас: цайвар, саарал, мод, элс.
     Ганц шинэ өнгө нь нарны хавтангийн бүдэг ноорхой цэнхэр. */
  const M={
    pale:new THREE.MeshStandardMaterial({color:SC('#F2EADA'),roughness:.86}),
    grey:new THREE.MeshStandardMaterial({color:SC('#BDB3A2'),roughness:.9}),
    dark:new THREE.MeshStandardMaterial({color:SC('#46525A'),roughness:.55,metalness:.12}),
    wood:new THREE.MeshStandardMaterial({color:SC('#A98C63'),roughness:.95}),
    wood2:new THREE.MeshStandardMaterial({color:SC('#C4A87C'),roughness:.95}),
    watr:new THREE.MeshStandardMaterial({color:SC('#6F9C90'),roughness:.35,metalness:.05}),
    leaf:new THREE.MeshStandardMaterial({color:SC('#6E8A42'),roughness:.9}),
    bush:new THREE.MeshStandardMaterial({color:SC('#5F8438'),roughness:.95}),
    grav:new THREE.MeshStandardMaterial({color:SC('#C6BCA4'),roughness:1}),
    clay:new THREE.MeshStandardMaterial({color:SC('#C1795A'),roughness:.9}),
    lime:new THREE.MeshStandardMaterial({color:SC('#9DBF4C'),roughness:.9}),
    skin:new THREE.MeshStandardMaterial({color:SC('#E0BC94'),roughness:.9})
  };
  const bx=function(w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
    o.castShadow=true;o.receiveShadow=true;return o;};
  const cy=function(r1,r2,h,sg,m){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,sg),m);
    o.castShadow=true;o.receiveShadow=true;return o;};
  const sp=function(r,m){const o=new THREE.Mesh(new THREE.SphereGeometry(r,8,6),m);
    o.castShadow=true;o.receiveShadow=true;return o;};
  const put=function(o,x,y,z){o.position.set(x,y,z);return o;};

  /* Тоног төхөөрөмжийн доор л хайрган суурь — үлдсэн нь зүлэг */
  const pad=function(g,r,x,z){
    const p=cy(r,r,.05,18,M.grav); p.castShadow=false;
    return g.add(put(p,x||0,.025,z||0));
  };
  /* Нүд бүрийн захаар бут, цэцэг — тоног төхөөрөмж ногоон дунд суух */
  /* Бут бүгд нэг төрөл, нэг хэмжээ: өмнө нь дөрвөн өөр хэмжээ, гурав тутамд нэгэнд
     нь ишлэг цэцэг нэмэгддэг байсан нь байгууламжийн эргэн тойрныг эмх замбараагүй
     харагдуулж байв. Ижил бут жигд тойрог үүсгэвэл байгууламж өөрөө тодрох болно. */
  /* Ургамлын цагираг бүр зургаалжны ДОТОР үлдэх ёстой: төвөөс хавтгай тал
     хүртэл 1.68 нэгж (радиусын 0.866). Өмнө нь бүгд 2.00–2.05 хүрч, бут нь
     хөрш нүдний талбай дээр гарч зогсож байв. Дээд хязгаар 1.55. */
  const garden=function(g,n,r0,r1){
    const s=.22;
    for(let i=0;i<n;i++){
      const a=i*2.399, rr=r0+(((i*7)%5)/4)*(r1-r0);
      g.add(put(sp(s,M.bush),Math.cos(a)*rr,s*.78,Math.sin(a)*rr));
    }
  };

  const BUILD={
    energy:function(g){                                   // 100 кВт нарны талбай
      pad(g,1.55); garden(g,14,1.40,1.55);
      const pn=[];
      for(let r=0;r<4;r++)for(let c=0;c<4;c++){
        const x=(c-1.5)*.72, z=(r-1.5)*.62;
        g.add(put(cy(.032,.032,.34,6,M.grey),x,.17,z));
        const pv=new THREE.Group(); pv.position.set(x,.38,z); g.add(pv); pn.push(pv);
        pv.add(bx(.64,.045,.42,M.dark));
        pv.add(put(bx(.46,.015,.27,M.grey),0,.038,-.015));
      }
      // хувиргуур, батарейн шүүгээ
      g.add(put(bx(.34,.52,.28,M.pale),1.16,.26,.36));
      g.add(put(bx(.38,.05,.32,M.grey),1.16,.54,.36));
      g.add(put(bx(.34,.52,.28,M.pale),1.16,.26,-.14));
      g.add(put(bx(.38,.05,.32,M.grey),1.16,.54,-.14));
      return function(t){
        // 16 хавтан нэгэн зэрэг нар дагана
        const a=-.52+Math.sin(t*.20)*.40;
        for(let i=0;i<pn.length;i++) pn[i].rotation.x=a;
      };
    },
    water:function(g){                                    // ус — гадаргуу дээр давалгаа
      /* Нүд бол зургаалжин: төвөөс хавтгай тал хүртэл 1.68 нэгж (радиусын 0.866).
         Ургамлын цагираг 2.00 хүрч байсан нь зургаалжны талыг давж, дэлбээ нь
         хөрш нүд рүү гарч байв. Цагирагийг 1.55-д барьж, бүхэлд нь дотор оруулав. */
      pad(g,.62,-.55,-.30); garden(g,16,1.15,1.55);
      g.add(put(cy(.36,.36,.95,14,M.pale),-.55,.48,-.30));
      g.add(put(cy(.40,.30,.26,14,M.grey),-.55,1.08,-.30));
      g.add(put(cy(.03,.03,.9,6,M.grey),-.16,.45,-.30));
      g.add(put(cy(.74,.74,.06,16,M.grey),.42,.02,.30));
      g.add(put(cy(.67,.67,.10,16,M.watr),.42,.05,.30));
      for(let i=0;i<3;i++)
        g.add(put(cy(.02,.02,.34,5,M.leaf),.42+Math.cos(i*2.1)*.52,.17,.30+Math.sin(i*2.1)*.52));
      const rings=[];
      for(let i=0;i<3;i++){
        const m=new THREE.MeshBasicMaterial({color:SC('#CDE4DC'),transparent:true,
          opacity:0,side:THREE.DoubleSide});
        const r=new THREE.Mesh(new THREE.RingGeometry(.60,.70,24),m);
        r.rotation.x=-Math.PI/2; r.position.set(.42,.105,.30);
        g.add(r); rings.push(r);
      }
      return function(t){ rings.forEach(function(r,i){
        const u=((t*.42+i/3)%1);
        r.scale.setScalar(.20+u*.80);
        r.material.opacity=.55*(1-u)*(1-u);
      });};
    },
    waste:function(g){                                    // компостын хашлага, дардас
      pad(g,1.05); garden(g,16,1.20,1.55);
      /* Модон хашлага — үйлдвэрийн биш, цэцэрлэгийн компост шиг.
         Object3D.add нь нэмсэн зүйлээ биш ЭЦГИЙГ нь буцаадаг тул эргэлтийг
         хананд нь өгөх ёстой; өмнө нь бүлэг өөрөө эргэж, дөрвөн хана
         дөрвөлжин үүсгэхийн оронд зэрэгцээ зогсож байв. */
      for(let i=0;i<4;i++){
        const a=i*Math.PI/2;
        /* Хананы нимгэн тэнхлэг (дотоод +z) нь гадагшаа харсан нормаль дагуу
           байх ёстой: rotation.y = π/2 − a. −a нь ханыг радиусын дагуу зогсоож,
           дөрвөлжин үүсгэхийн оронд гадагш цухуйлгана. */
        const w=bx(1.46,.30,.07,M.wood2); w.rotation.y=Math.PI/2-a;
        g.add(put(w,Math.cos(a)*.72,.16,Math.sin(a)*.72));
      }
      /* Сүүдрэвч. Энд компостыг хязгаарлагч нь тэжээл биш чийг: наранд задгай
         байгаа овоолго сүүдэрт байгаагаас 10–15°C халуун байж, боловсорч
         амжихаасаа өмнө хатна. */
      for(let i=0;i<4;i++){
        const px=(i%2?1:-1)*.78, pz=(i<2?-1:1)*.78;
        g.add(put(cy(.035,.035,.78,6,M.wood),px,.39,pz));
      }
      /* Сийрэг сараалж, битүү дээвэр биш: сүүдэр өгөхөд хангалттай, доорх
         савнууд налуу өнцгөөс харагдахаар хангалттай задгай. */
      for(let i=0;i<6;i++)
        g.add(put(bx(1.72,.03,.055,M.wood2),0,.79,-.73+i*.29));
      for(let i=0;i<3;i++){
        const x=(i-1)*.42;
        g.add(put(bx(.30,.44,.30,i===1?M.leaf:(i===0?M.grey:M.wood)),x,.22,-.35));
        g.add(put(bx(.34,.06,.34,M.dark),x,.47,-.35));
      }
      const cr=[];
      for(let i=0;i<2;i++)for(let j=0;j<2;j++){
        const c=put(bx(.32,.26,.30,M.wood),(i-.5)*.40+.55,.13+(i+j)%2*.26,(j-.5)*.38+.42);
        g.add(c); cr.push(c);
      }
      return function(t){ cr.forEach(function(c,i){
        c.position.y=c.userData.y0!==undefined?c.userData.y0:(c.userData.y0=c.position.y);
        c.position.y+=Math.max(0,Math.sin(t*.7+i*1.6))*.10;
        c.rotation.y=Math.sin(t*.35+i)*.14;
      });};
    },
    research:function(g){                                 // модон асар, салхины аяга
      pad(g,.90,.25,.25); garden(g,14,1.45,1.55);
      g.add(put(bx(1.0,.46,.78,M.pale),.25,.23,.25));
      for(let i=0;i<2;i++){                                // хоёр налуутай модон дээвэр
        const r=bx(.66,.06,.94,M.wood2);
        r.rotation.z=(i?1:-1)*.62; g.add(put(r,.25+(i?.27:-.27),.60,.25));
      }
      g.add(put(bx(.20,.30,.03,M.wood),.25,.15,.65));
      g.add(put(cy(.03,.03,1.5,6,M.grey),-.62,.75,-.28));
      const sp=new THREE.Group(); sp.position.set(-.62,1.48,-.28); g.add(sp);
      for(let i=0;i<3;i++){const a=i*2.09;
        sp.add(put(bx(.20,.015,.015,M.grey),Math.cos(a)*.10,0,Math.sin(a)*.10));
        sp.add(put(cy(.055,.055,.05,8,M.pale),Math.cos(a)*.20,0,Math.sin(a)*.20));}
      const bl=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),
        new THREE.MeshBasicMaterial({color:SC('#C6D96A'),transparent:true,opacity:1}));
      bl.position.set(-.62,1.56,-.28); g.add(bl);
      return function(t){ sp.rotation.y=t*1.9;
        bl.material.opacity=.25+.75*Math.pow(Math.max(0,Math.sin(t*1.6)),6); };
    },
    birds:function(g){                                    // шувуу тойрон нисэнэ
      /* Энэ эсийн гол хэсгийг Jack's-ийн тэмдэг эзэлж байгаа тул үүрний шонгууд
         төвөөс гарч, хашааны дотор талын чөлөө рүү — зургаалжны булангуудад
         шилжив. Усны цэг мөн адил хажуу тийш. Тэмдгийг дарахгүй. */
      /* Хайргын талбайг нүдний ГОЛООС зайлуулав: тэнд Jack's-ийн тэмдэг байгаа тул
         төв дэх дугуй хавтан нь тэмдэг дээр саарал тойрог болж буудаг. Усны цэгийн
         доор нь шилжүүлэв — байх ёстой газартаа. */
      pad(g,.42,-1.05,.58); garden(g,12,1.30,1.55);
      const NEST=[[0,1.34],[2.09,1.34],[4.19,1.34]];     // өнцөг, радиус
      NEST.forEach(function(n){
        const x=Math.cos(n[0])*n[1], z=Math.sin(n[0])*n[1];
        g.add(put(cy(.032,.032,.92,6,M.wood),x,.46,z));
        g.add(put(bx(.20,.24,.18,M.pale),x,1.03,z));
        g.add(put(bx(.26,.05,.24,M.grey),x,1.17,z));
      });
      g.add(put(cy(.28,.28,.05,14,M.grey),-1.05,.01,.58));
      g.add(put(cy(.23,.23,.07,14,M.watr),-1.05,.04,.58));
      const birds=[];
      for(let i=0;i<5;i++){
        const bd=window.__bird3d(THREE,SC('#4A463F'),.11), b=bd.g;
        bd.wl.castShadow=true; bd.wr.castShadow=true;
        b.userData={wl:bd.wl,wr:bd.wr,r:.85+i*.20,h:1.55+i*.20,sp:.42+i*.07,ph:i*1.31};
        g.add(b); birds.push(b);
      }
      return function(t){ birds.forEach(function(b){
        const d=b.userData, a=t*d.sp+d.ph;
        b.position.set(Math.cos(a)*d.r, d.h+Math.sin(a*2.1)*.16, Math.sin(a)*d.r);
        b.rotation.y=-a;
        const f=Math.sin(t*6.5+d.ph)*.62;
        d.wr.rotation.z=f; d.wl.rotation.z=-f;
      });};
    },
    insect:function(g){                                   // уугуул тоос хүртээгчид
      /* Зөгийн үүр байхгүй болов — санаатайгаар.
         Зөгий (Apis mellifera) Монголд уугуул биш, 1959 оноос хойш оруулж
         ирсэн, ямар ч бүл −16…−32°C өвлийг хүний асаргаагүйгээр давдаггүй, тус
         улсын зөгийн аж ахуй ойт хээрт байдаг — цөлд биш. Дээрээс нь өндөр
         нягтралтай зөгийн үүр ойролцоох зэрлэг зөгийн илрэлтийг 55% хүртэл
         бууруулж, нөлөө нь 600–1,100 м-т хүрдэг: 3 га талбайг бүхэлд нь
         хамарна. Өөрөөр хэлбэл үүр нь энэ нүдний зорилгыг өөрийг нь сарниулна.
         Оронд нь зүйлүүдийн ~70% нь хөрсөнд үүрлэдэг уугуул зөгийд
         зориулав: өмнө зүг харсан элсэн хана, хөндөгдөөгүй нүцгэн газар,
         богино улирлыг дүүргэх тэжээлийн цэцэг. */
      pad(g,1.12,0,.22); garden(g,20,1.26,1.55);

      /* Үүрлэх хана — нарлаг, босоо, ил задгай нүүр; ард нь налуу элс */
      g.add(put(bx(1.66,.42,.44,M.grav),0,.21,-.70));
      const back=bx(1.66,.07,.70,M.grav); back.rotation.x=-.55;
      g.add(put(back,0,.33,-1.02));
      for(let i=0;i<12;i++){                              // үүрний амсарууд
        const h=cy(.020,.020,.06,6,M.dark); h.rotation.x=Math.PI/2;
        g.add(put(h,-.70+i*.127,.20+((i*5)%3)*.07,-.475));
      }

      /* Тэжээл — улирал богино тул хэд хэдэн зүйл, өөр өөр хугацаанд цэцэглэнэ */
      const petal=[M.lime,M.clay,M.pale];
      for(let i=0;i<26;i++){
        const a=i*2.399, r=.30+(((i*3)%5)/4)*.72;
        const x=Math.cos(a)*r, z=.26+Math.sin(a)*r*.72;
        g.add(put(cy(.012,.012,.20,4,M.leaf),x,.10,z));
        g.add(put(sp(.035,petal[i%3]),x,.21,z));
      }

      const bm=new THREE.MeshBasicMaterial({color:SC('#6A5C2E')});
      const bees=[];
      for(let i=0;i<5;i++){
        const b=new THREE.Mesh(new THREE.SphereGeometry(.022,6,5),bm);
        b.userData={ph:i*.9, sp:.9+i*.11, r:.30+(i%4)*.18};
        g.add(b); bees.push(b);
      }
      return function(t){ bees.forEach(function(b){
        const d=b.userData, a=t*d.sp+d.ph;
        b.position.set(Math.cos(a)*d.r+Math.sin(t*2+d.ph)*.12,
                       .22+Math.abs(Math.sin(a*.7))*.34,
                       .10+Math.sin(a)*d.r+Math.cos(t*1.7+d.ph)*.12);
      });};
    },
    community:function(g){                                // гэр, тоглоомын талбай, хүүхдүүд
      pad(g,.52,-.45,-.20); pad(g,.40,.60,.28); garden(g,20,1.35,1.55);
      const tops=[];
      [[-.45,-.20,.40],[.60,.28,.30]].forEach(function(p){
        g.add(put(cy(p[2],p[2],.30,16,M.pale),p[0],.15,p[1]));
        g.add(put(cy(p[2]*1.06,.04,.26,16,M.grey),p[0],.43,p[1]));
        g.add(put(bx(.12,.20,.02,M.clay),p[0],.10,p[1]+p[2]));
        tops.push([p[0],p[1]]);
      });
      // модон ширээ, сандал
      g.add(put(bx(.62,.05,.34,M.wood2),-.10,.34,.95));
      for(let i=0;i<2;i++){
        g.add(put(bx(.60,.04,.14,M.wood2),-.10,.19,.95+(i?.30:-.30)));
        g.add(put(bx(.05,.19,.05,M.wood),-.34,.09,.95+(i?.30:-.30)));
        g.add(put(bx(.05,.19,.05,M.wood),.14,.09,.95+(i?.30:-.30)));
      }
      // ганхуур
      const sw=new THREE.Group(); sw.position.set(1.05,0,-.70); g.add(sw);
      sw.add(put(bx(.05,.90,.05,M.wood),-.34,.45,0));
      sw.add(put(bx(.05,.90,.05,M.wood),.34,.45,0));
      sw.add(put(bx(.78,.05,.05,M.wood),0,.90,0));
      const seat=new THREE.Group(); seat.position.set(0,.90,0); sw.add(seat);
      seat.add(put(bx(.03,.52,.03,M.wood),-.11,-.26,0));
      seat.add(put(bx(.03,.52,.03,M.wood),.11,-.26,0));
      seat.add(put(bx(.28,.04,.14,M.wood2),0,-.52,0));
      // хүүхдүүд
      const kidM=[M.clay,M.lime,M.watr,M.pale];
      const kids=[];
      for(let i=0;i<4;i++){
        const k=new THREE.Group();
        k.add(put(bx(.14,.20,.10,kidM[i%4]),0,.30,0));
        k.add(put(sp(.09,M.skin),0,.47,0));
        const lg1=bx(.05,.20,.05,M.wood); lg1.geometry.translate(0,-.10,0);
        const lg2=bx(.05,.20,.05,M.wood); lg2.geometry.translate(0,-.10,0);
        lg1.position.set(-.04,.20,0); lg2.position.set(.04,.20,0);
        k.add(lg1); k.add(lg2);
        const ar1=bx(.04,.17,.04,kidM[i%4]); ar1.geometry.translate(0,-.085,0);
        const ar2=bx(.04,.17,.04,kidM[i%4]); ar2.geometry.translate(0,-.085,0);
        ar1.position.set(-.10,.40,0); ar2.position.set(.10,.40,0);
        k.add(ar1); k.add(ar2);
        k.scale.setScalar(1.15);
        g.add(k);
        kids.push({k:k,lg1:lg1,lg2:lg2,ar1:ar1,ar2:ar2,
          r:.55+i*.16,sp:.85+i*.18,ph:i*1.6});
      }
      const puffs=[];
      tops.forEach(function(p,ti){
        for(let i=0;i<3;i++){
          const m=new THREE.MeshBasicMaterial({color:SC('#E8E4D8'),transparent:true,opacity:0});
          const s=new THREE.Mesh(new THREE.SphereGeometry(.07,7,6),m);
          s.userData={x:p[0],z:p[1],ph:(ti*3+i)/6};
          g.add(s); puffs.push(s);
        }
      });
      return function(t){
        puffs.forEach(function(s){
          const u=((t*.3+s.userData.ph)%1);
          s.position.set(s.userData.x+u*.10,.48+u*.85,s.userData.z-u*.06);
          s.scale.setScalar(.5+u*1.6);
          s.material.opacity=.42*(1-u)*(1-u*.4);
        });
        seat.rotation.x=Math.sin(t*1.55)*.44;
        kids.forEach(function(d,i){
          const a=t*d.sp+d.ph;
          d.k.position.set(Math.cos(a)*d.r-.10,Math.abs(Math.sin(t*4.4+d.ph))*.09,
                           Math.sin(a)*d.r+.30);
          d.k.rotation.y=-a-Math.PI/2;
          const s0=Math.sin(t*4.4+d.ph);
          d.lg1.rotation.x=s0*.85; d.lg2.rotation.x=-s0*.85;
          d.ar1.rotation.x=-s0*.75; d.ar2.rotation.x=s0*.75;
        });
      };
    }
  };

  hexes.forEach(function(h){
    if(!h.c.themed) return;
    const g=new THREE.Group();
    g.position.set(h.x,h.top,h.z);
    g.rotation.y=(h.i%6)*.4;
    const fn=BUILD[h.c.cat]?BUILD[h.c.cat](g):null;
    g.scale.setScalar(.001);
    scene.add(g);
    INFRA.push({g:g,anim:fn,cell:h.c,radius:h.radius});
  });

  /* ==== ТАЛБАЙ ДАЯАРХ ХӨДӨЛГӨӨН ====
     Долоон нүдэн доторх жижиг хөдөлгөөн холоос харагдахгүй. Тиймээс
     бүх талбайг хамарсан дөрвөн үзэгдэл нэмнэ. */
  const find=function(code){
    for(let i=0;i<hexes.length;i++) if(hexes[i].c.code===code) return hexes[i];
    return hexes[0];
  };
  const HR=find('AD');                        // судалгааны станц шинэ ангидаа

  /* 1. Хиймэл дагуулын хяналт — судалгааны цэгээс тархах сканнердах цагираг */
  const swMat=new THREE.MeshBasicMaterial({color:SC('#9CC24A'),transparent:true,
    opacity:0,side:THREE.DoubleSide});
  const sweep=new THREE.Mesh(new THREE.RingGeometry(.965,1,96),swMat);
  sweep.rotation.x=-Math.PI/2; sweep.position.set(HR.x,7.5,HR.z);
  sweep.frustumCulled=false; scene.add(sweep);
  const beamMat=new THREE.MeshBasicMaterial({color:SC('#9CC24A'),transparent:true,opacity:.16});
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.10,.34,26,10,1,true),beamMat);
  beam.position.set(HR.x,13+HR.top,HR.z); scene.add(beam);

  /* 3. Шувууны сүрэг — цөөхөн, өндөрт */
  const bMat=new THREE.MeshStandardMaterial({color:SC('#454138'),roughness:.9});
  const FLOCK=[];
  for(let i=0;i<4;i++){
    const bd=window.__bird3d(THREE,SC('#454138'),.62), b=bd.g;
    b.userData={wl:bd.wl,wr:bd.wr,r:12+((i*9)%20),h:10+((i*4)%7),sp:.13+((i%4)*.03),ph:i*1.9};
    b.visible=false; scene.add(b); FLOCK.push(b);
  }

  /* 3б. Говийн амьтад — нүдний гадаргуу дээр, нам түвшинд.
        Талбай хашаатай тул зээр, аргаль, хулан ороход хүндрэлтэй.
        Тиймээс тоос хүртээгч, туулай, үнэг — бодит хэмжилтийн зүйлүүд. */
  const sandM=new THREE.MeshStandardMaterial({color:SC('#C2B194'),roughness:.95});
  const foxM =new THREE.MeshStandardMaterial({color:SC('#A87A50'),roughness:.9});
  const WILD=[];
  const hostCells=hexes.filter(function(h){
    return !h.c.themed&&(h.c.sizeKey==='A'||h.c.sizeKey==='B'||h.c.sizeKey==='C'||h.c.sizeKey==='D');});

  function addWild(o){WILD.push(o);scene.add(o.g);o.g.visible=false;}

  // туулай — бөөрөнхий бие, урт чих, үсрэх хөл
  for(let i=0;i<3;i++){
    const hc=hostCells[(i*11+3)%hostCells.length], g=new THREE.Group();
    const body=sp(.16,sandM); body.scale.set(1.15,.84,.80); body.position.set(0,.16,0); g.add(body);
    const rump=sp(.13,sandM); rump.scale.set(1,.98,.92); rump.position.set(-.13,.17,0); g.add(rump);
    const head=sp(.095,sandM); head.position.set(.20,.22,0); g.add(head);
    const snout=sp(.05,sandM); snout.scale.set(1.4,.8,.8); snout.position.set(.27,.19,0); g.add(snout);
    const mkEar=function(z){const eg=new THREE.BoxGeometry(.035,.22,.018);
      eg.translate(0,.11,0); const e=new THREE.Mesh(eg,sandM); e.castShadow=true;
      e.position.set(.19,.27,z); g.add(e); return e;};
    const earL=mkEar(-.045), earR=mkEar(.045);
    const tail=sp(.05,M.pale); tail.position.set(-.25,.20,0); g.add(tail);
    const mkLeg=function(x,w,ht){const lg=new THREE.BoxGeometry(w,ht,w*.9);
      lg.translate(0,-ht/2,0); const l=new THREE.Mesh(lg,sandM); l.castShadow=true;
      l.position.set(x,.15,0); g.add(l); return l;};
    const legF=mkLeg(.11,.05,.13), legB=mkLeg(-.09,.07,.16);
    g.scale.setScalar(1.5);
    addWild({g:g,type:'hare',earL:earL,earR:earR,legF:legF,legB:legB,
      cx:hc.x,cz:hc.z,top:hc.top,ang:i*1.7,
      r:.5+((i*7)%5)*.16,sp:.55+((i%3)*.14),ph:i*1.7,ap:.50});
  }
  // үнэг — сунасан бие, шовх хошуу, сөөнгө сүүл, дөрвөн хөл
  for(let i=0;i<1;i++){
    const hc=hostCells[(i*23+9)%hostCells.length], g=new THREE.Group();
    const body=sp(.20,foxM); body.scale.set(1.75,.60,.60); body.position.set(0,.30,0); g.add(body);
    const chest=sp(.15,foxM); chest.scale.set(1,.95,.95); chest.position.set(.20,.30,0); g.add(chest);
    const head=sp(.105,foxM); head.scale.set(1.1,.92,.92); head.position.set(.42,.35,0); g.add(head);
    const snout=sp(.055,foxM); snout.scale.set(1.7,.75,.75); snout.position.set(.54,.32,0); g.add(snout);
    g.add(put(sp(.022,bMat),.62,.32,0));
    const ear=function(z){const e=cy(.0,.055,.10,4,foxM);
      e.position.set(.38,.46,z); e.rotation.x=z*2.2; g.add(e);};
    ear(-.055); ear(.055);
    const tg=new THREE.BoxGeometry(.30,.11,.11); tg.translate(-.15,0,0);
    const tail=new THREE.Mesh(tg,foxM); tail.castShadow=true;
    tail.position.set(-.30,.32,0); g.add(tail);
    const bush=sp(.085,foxM); bush.scale.set(1.5,1,1); bush.position.set(-.16,0,0); tail.add(bush);
    const tip=sp(.055,M.pale); tip.position.set(-.29,0,0); tail.add(tip);
    const mkLeg=function(x,z){const lg=new THREE.BoxGeometry(.055,.24,.055);
      lg.translate(0,-.12,0); const l=new THREE.Mesh(lg,foxM); l.castShadow=true;
      l.position.set(x,.26,z); g.add(l); return l;};
    const lFL=mkLeg(.22,-.07), lFR=mkLeg(.22,.07), lBL=mkLeg(-.18,-.07), lBR=mkLeg(-.18,.07);
    g.scale.setScalar(1.5);
    addWild({g:g,type:'fox',tail:tail,head:head,legs:[lFL,lFR,lBL,lBR],
      cx:hc.x,cz:hc.z,top:hc.top,ang:0,
      r:1.0,sp:.36,ph:0,ap:.70});
  }
  // эрвээхэй — жинхэнэ далавчны хэлбэртэй, нам зэрэг тогтворгүй нисэнэ
  function wingGeo(sc,ex){
    const s=new THREE.Shape();
    s.moveTo(0,0);
    s.bezierCurveTo(.06*sc,.13*sc,(.21+ex)*sc,.19*sc,(.27+ex)*sc,.07*sc);   // урд далавч
    s.bezierCurveTo((.30+ex)*sc,-.01*sc,.19*sc,-.03*sc,.09*sc,-.01*sc);
    s.bezierCurveTo(.02*sc,-.03*sc,-.09*sc,-.02*sc,-.13*sc,.05*sc);          // хойд далавч
    s.bezierCurveTo(-.17*sc,.13*sc,-.06*sc,.17*sc,0,.10*sc);
    s.lineTo(0,0);
    const g=new THREE.ShapeGeometry(s,14);
    g.rotateX(-Math.PI/2);
    return g;
  }
  const wingIn=new THREE.MeshStandardMaterial({color:SC('#F1E9D6'),roughness:.8,
    side:THREE.DoubleSide});
  const wingEd=new THREE.MeshStandardMaterial({color:SC('#6E6455'),roughness:.85,
    side:THREE.DoubleSide});
  for(let i=0;i<8;i++){
    const h=hostCells[(i*5+1)%hostCells.length], g=new THREE.Group();
    g.add(put(bx(.13,.030,.030,bMat),.02,0,0));
    g.add(put(bx(.02,.012,.06,bMat),.08,.02,0));                    // сахал
    const mk=function(side){
      const w=new THREE.Group();
      const edge=new THREE.Mesh(wingGeo(1.06,.012),wingEd);
      edge.position.y=-.004;
      const inner=new THREE.Mesh(wingGeo(1,0),wingIn);
      w.add(edge); w.add(inner);
      w.scale.z=side;
      return w;
    };
    const wr=mk(1), wl=mk(-1);
    g.add(wr); g.add(wl);
    g.scale.setScalar(1.9);
    addWild({g:g,type:'fly',wl:wl,wr:wr,cx:h.x,cz:h.z,top:h.top,
      r:.7+((i*3)%5)*.22,sp:.5+((i%5)*.13),ph:i*1.1,ap:.35});
  }

  /* 4. Судалгааны дрон — хассан */

  /* 5. Нэбха — мод бүрийн суурьт хуримтлах элсэн товгор */
  const nebGeo=new THREE.ConeGeometry(1,1,10); nebGeo.translate(0,.5,0);
  const nebIM=new THREE.InstancedMesh(nebGeo,
    new THREE.MeshStandardMaterial({color:SC('#CBBD9C'),roughness:1}),TREES.length);
  nebIM.receiveShadow=true; nebIM.castShadow=true; nebIM.frustumCulled=false;
  scene.add(nebIM);

  /* 6. Зөөгдөх элс — талбайн гадуур урсах салхины зурвас.
        Ой боловсрох тусам сулран, салхи саарсныг харуулна. */
  const windIM=new THREE.InstancedMesh(new THREE.BoxGeometry(3.2,.09,.11),
    new THREE.MeshBasicMaterial({color:SC('#E6DABE'),transparent:true,opacity:.55}),150);
  windIM.frustumCulled=false; scene.add(windIM);

  /* 7. Тарилтын нүх — ухсан ховил дагуух бортого. Суулгац бага байхад мод өөрөө
        элснээс ялгарахгүй тул хэлбэрийг нүх нь барина; титэм дэлгэрэх тусам далдарна.
        Байрлал нь модныхтой яг нэг тул ховилын шулуун эгнээ хэвээр уншигдана. */
  const pitGeo=new THREE.CircleGeometry(1,10); pitGeo.rotateX(-Math.PI/2);
  const pitIM=new THREE.InstancedMesh(pitGeo,
    new THREE.MeshBasicMaterial({color:SC('#4A3A22'),transparent:true,opacity:0}),TREES.length);
  const rimGeo=new THREE.RingGeometry(1,1.42,10); rimGeo.rotateX(-Math.PI/2);
  const rimIM=new THREE.InstancedMesh(rimGeo,
    new THREE.MeshBasicMaterial({color:SC('#A98C63'),transparent:true,opacity:0}),TREES.length);
  pitIM.frustumCulled=false; rimIM.frustumCulled=false;
  scene.add(pitIM); scene.add(rimIM);
  (function(){
    const m=new THREE.Object3D();
    TREES.forEach(function(t,i){
      m.position.set(t.x,t.base+.03,t.z); m.scale.setScalar(.15); m.updateMatrix();
      pitIM.setMatrixAt(i,m.matrix);
      m.position.y=t.base+.02; m.updateMatrix(); rimIM.setMatrixAt(i,m.matrix);
    });
    pitIM.instanceMatrix.needsUpdate=true; rimIM.instanceMatrix.needsUpdate=true;
  })();

  SITE={sweep:sweep,beam:beam,neb:nebIM,wind:windIM,pits:pitIM,rims:rimIM,
        flock:FLOCK,wild:WILD,hr:HR};

  ray=new THREE.Raycaster(); pointer=new THREE.Vector2(); clock=new THREE.Clock();
  addEventListener('resize',onResize);
  const el=rend.domElement;
  el.addEventListener('pointerdown',function(e){drag={x:e.clientX};moved=0;});
  addEventListener('pointerup',function(){drag=null;});
  addEventListener('pointermove',function(e){
    if(drag){const dx=e.clientX-drag.x;dragTheta+=dx*.004;moved+=Math.abs(dx);drag.x=e.clientX;}
  });
  el.addEventListener('click',function(e){ if(moved<6) pick(e); });

  new IntersectionObserver(function(en){visible=en[0].isIntersecting;},{threshold:0})
    .observe(stageEl);
  /* Autoplay. Hunting for a Play button is friction nobody should need: the scene
     runs itself the first time it is properly in view, once. A second observer
     rather than the render one above, because that fires on the first stray pixel
     and the run should start when the reader is actually looking at it. Anyone who
     drags the slider or picks a year has taken over, so autostart stands down, and
     reduced-motion readers keep the finished scene without the animation. */
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    var hxAuto=new IntersectionObserver(function(en){
      if(!en[0].isIntersecting || played || manual) return;
      played=true; hxAuto.disconnect();
      beatF=0; target=0; applyBeat(); setPlay(true);
    },{threshold:.4});
    hxAuto.observe(stageEl);
  }
  /* HEXAGON-ыг мөн дэлгэцийн гогцоонд бүртгэнэ */
  (window.__laScenes=window.__laScenes||[]).push({
    key:'hexagon', sec:document.getElementById('hxStage')||document.getElementById('hexagon-live'),
    secs:function(){ return PLAY_SECS; },
    replay:function(){ manual=false; played=true; beatF=0; target=0; applyBeat(); setPlay(true); },
    stop:function(){ setPlay(false); },
    done:function(){ return beatF>=BEATS.length-1.01; }
  });
  document.getElementById('hxBoot').classList.add('gone');
  animate();
}
function onResize(){const s=size();
  cam.aspect=s.w/s.h;cam.updateProjectionMatrix();rend.setSize(s.w,s.h,false);}
function pick(e){
  const r=rend.domElement.getBoundingClientRect();
  pointer.x=((e.clientX-r.left)/r.width)*2-1;
  pointer.y=-((e.clientY-r.top)/r.height)*2+1;
  ray.setFromCamera(pointer,cam);
  const hit=ray.intersectObjects(hexes.map(function(h){return h.mesh;}));
  if(hit.length){const h=hexes.filter(function(x){return x.mesh===hit[0].object;})[0];
    if(h) openCell(h.c,hit[0].point);}
}
function animate(){
  requestAnimationFrame(animate);
  if(!visible) return;
  const t=clock.getElapsedTime();
  DT=Math.min(.05,t-lastT); lastT=t;

  if(auto){                           // Play дарсны дараа гүйнэ
    if(holdT>0){                      // төгссөн байдлыг барина, дараа нь дахин эхэлнэ
      holdT-=DT;
      if(holdT<=0){ beatF=0; target=0; applyBeat(); }
    } else if(dwellT>0){              // тодорхой үе шат дээр зориуд хүлээнэ
      dwellT-=DT;
      applyBeat();                    // камер тольдох цэг рүүгээ гүйцэж ирнэ
    } else {
      const was=Math.floor(beatF);
      beatF+=DT*(BEATS.length-1)/PLAY_SECS;
      /* Шинэ үе шат дээр гарч ирэхэд тэр үе шат dwell гуйж байвал тэндээ
         тодорхой хугацаа зогсоно. Ингэснээр Jack's-ийн нүд шиг харуулах юмтай
         үе шат нь бусадтай ижил хугацаанд дүүлж өнгөрөхгүй. */
      const now=Math.floor(beatF);
      if(now>was && BEATS[now] && BEATS[now].dwell){
        beatF=now; dwellT=BEATS[now].dwell;
      }
      if(beatF>=BEATS.length-1){
        beatF=BEATS.length-1;
        if(LOOP) holdT=LOOP_HOLD; else setPlay(false);
      }
      target=beatF; applyBeat();
    }
  } else if(beatF!==target){          // сонгосон он руу жигд гүйнэ
    const d=target-beatF, k=Math.min(1,DT*STEP_SPEED);
    beatF = Math.abs(d)<.004 ? target : beatF+d*k;
    applyBeat();
  }

  const i0=Math.min(BEATS.length-1,Math.floor(beatF)),
        i1=Math.min(BEATS.length-1,i0+1), f=beatF-i0;
  const A=BEATS[i0],B=BEATS[i1];
  camT.r=A.cam.r+(B.cam.r-A.cam.r)*f;
  camT.theta=A.cam.theta+(B.cam.theta-A.cam.theta)*f;
  camT.phi=A.cam.phi+(B.cam.phi-A.cam.phi)*f;
  const ALx=A.look?A.look.x:0, ALz=A.look?A.look.z:0;
  const BLx=B.look?B.look.x:0, BLz=B.look?B.look.z:0;
  camT.lx=ALx+(BLx-ALx)*f;  camT.lz=ALz+(BLz-ALz)*f;
  camS.r+=(camT.r-camS.r)*.06;
  camS.theta+=(camT.theta-camS.theta)*.06;
  camS.phi+=(camT.phi-camS.phi)*.06;
  camS.lx+=(camT.lx-camS.lx)*.045;   /* тольдох цэг рүү бага зэрэг зөөлөн */
  camS.lz+=(camT.lz-camS.lz)*.045;
  const th=camS.theta+dragTheta+(REDUCED?0:t*.006);
  /* Камер нь харах цэгээ тойрно — цэг нь төв байх үед энэ нь хуучин тооцоотой
     яг адилхан. */
  cam.position.set(camS.lx+camS.r*Math.sin(camS.phi)*Math.cos(th),
           camS.r*Math.cos(camS.phi)+2,
           camS.lz+camS.r*Math.sin(camS.phi)*Math.sin(th));
  cam.lookAt(camS.lx,.8,camS.lz);

  /* Түншийн тугууд салхинд намирна. Хөдөлгөөн багасгах горимд зогсоно. */
  if(!REDUCED && window.__hexFlagWave) window.__hexFlagWave(t);

  const gT=A.g+(B.g-A.g)*f;
  growth+=(gT-growth)*.08;
  /* Нүх нь ухагдмагц тод, титэм хаагдах тусам далдарна — гурван дүр зурагт ижил муруй */
  if(SITE&&SITE.pits){
    const po=Math.max(0,Math.min(1,(growth-.005)/.05))*Math.max(0,1-Math.max(0,growth-.16)/.16);
    SITE.pits.material.opacity=po*.95; SITE.rims.material.opacity=po*.7;
    SITE.pits.visible=SITE.rims.visible=po>.01;
  }
  /* Нүдний суурь ногоон болохоо больсон: хэлбэрийг мод өөрсдөө үүсгэх ёстой,
     доороос нь ногоон зургаалжин өгвөл ой байхгүй ч ургасан мэт харагдана.
     Тарилтын нүд элсэн хэвээр; зөвхөн дэд бүтцийн долоон нүд өвсөрхөг болно —
     тэнд мод байхгүй тул суурь нь өөрөө тэр нүдийг илэрхийлнэ. */
  hexes.forEach(function(h){
    h.mat.color.copy(SAND);
    if(h.c.themed) h.mat.color.lerp(GREEN,Math.min(1,infra*1.15));   // зүлгэн зургаалжин
  });
  // дэд бүтэц тарилтаас өмнө баригдана
  const iT=Math.max(0,Math.min(1,(beatF-1)/1));
  infra+=(iT*iT*(3-2*iT)-infra)*.1;
  INFRA.forEach(function(o){
    /* Байгууламжууд хуучин 3.05-ийн алгаслаар, тэр үеийн L нүдний 1.94 нэгжийн
       радиуст багтаж зохиогдсон. Ертөнцийн масштабаар татвал нүднээсээ халин
       гарна — тиймээс нүд өөрийнх нь радиусын харьцаагаар татна. */
    o.g.scale.setScalar(Math.max(.001,infra*1.26*(o.radius/1.9407)));
    if(o.anim&&infra>.06&&!REDUCED) o.anim(t);
  });

  /* ---- талбай даяарх үзэгдлүүд ---- */
  if(SITE){
    const monOn=Math.max(0,Math.min(1,(growth-.15)/.35));
    SITE.sweep.visible=SITE.beam.visible=monOn>.02;
    if(monOn>.02){
      const u=(t*.16)%1;
      SITE.sweep.scale.setScalar(2+u*44);
      SITE.sweep.material.opacity=.55*monOn*(1-u)*(1-u);
      SITE.beam.material.opacity=.13*monOn*(.6+.4*Math.sin(t*2.2));
    }

    /* говийн амьтад — тоос хүртээгч эхэлж, дараа нь туулай, эцэст нь үнэг */
    SITE.wild.forEach(function(a){
      const sb=(a.type==='fly')?SEASONS[season].bug:(SEASONS[season].snow?.5:1);
      const on=Math.max(0,Math.min(1,(growth-a.ap)/.18))*sb;
      a.g.visible=on>.04;
      if(!a.g.visible) return;
      // хааяа зогсож эргэн тойрноо ажиглана
      const rest=Math.sin(t*.21+a.ph*1.7)>.62?0:1;
      a.ang+=DT*a.sp*rest;
      const ang=a.ang;
      const x=a.cx+Math.cos(ang)*a.r, z=a.cz+Math.sin(ang)*a.r;
      const face=-ang-Math.PI/2;
      if(a.type==='hare'){
        const ph=t*3.2+a.ph, hop=Math.max(0,Math.sin(ph))*rest;
        a.g.position.set(x,a.top+hop*.34,z);
        a.g.rotation.set(-Math.cos(ph)*.34*rest,face,Math.sin(ph)*.09*rest);
        a.earL.rotation.x=-.22-hop*.95; a.earR.rotation.x=-.22-hop*.95;
        a.legF.rotation.x= hop*1.35; a.legB.rotation.x=-hop*1.55;
      }else if(a.type==='fox'){
        const ph=t*5.2+a.ph;
        a.g.position.set(x,a.top+Math.abs(Math.sin(ph))*.035*rest,z);
        a.g.rotation.set(0,face,0);
        for(let k=0;k<4;k++)
          a.legs[k].rotation.x=Math.sin(ph+(k%2?Math.PI:0)+(k>1?Math.PI:0))*.85*rest;
        a.tail.rotation.y=Math.sin(t*2.1+a.ph)*.45;
        a.tail.rotation.z=.20+Math.sin(t*1.6)*.10;
        a.head.rotation.y=Math.sin(t*.7+a.ph)*.35*(1-rest*.6);
      }else{
        const jx=Math.sin(t*2.7+a.ph)*Math.sin(t*1.13+a.ph*2)*.85;
        const jz=Math.cos(t*2.1+a.ph*1.4)*Math.sin(t*.83+a.ph)*.85;
        a.g.position.set(x+jx,a.top+.85+Math.sin(t*3.4+a.ph)*.22+Math.sin(t*1.1+a.ph)*.30,z+jz);
        const vx=-Math.sin(ang)*a.r+Math.cos(t*2.7+a.ph)*.6;
        const vz= Math.cos(ang)*a.r-Math.sin(t*2.1+a.ph*1.4)*.6;
        a.g.rotation.set(Math.sin(t*2.4+a.ph)*.24,Math.atan2(-vz,vx),Math.sin(t*1.9+a.ph)*.30);
        const s0=Math.sin(t*10+a.ph);
        const f=Math.pow(Math.abs(s0),.55)*(s0<0?-.35:1.15);
        a.wr.rotation.x=-f; a.wl.rotation.x=f;
      }
      a.g.scale.setScalar((a.type==='fly'?1.7:1.5)*(.5+on*.5));
    });

    const flyOn=Math.max(0,Math.min(1,(growth-.62)/.3));
    SITE.flock.forEach(function(b,i){
      b.visible=flyOn>.05;
      if(!b.visible) return;
      const d=b.userData, a=t*d.sp+d.ph;
      b.position.set(Math.cos(a)*d.r, d.h+Math.sin(a*2.3+i)*1.4, Math.sin(a)*d.r);
      b.rotation.y=-a; b.rotation.z=Math.sin(a*2.3+i)*.22;
      const f=Math.sin(t*3.4+d.ph)*.75;
      d.wr.rotation.z=f; d.wl.rotation.z=-f;
      b.scale.setScalar(.5+flyOn*.5);
    });

    /* салхи: эхэндээ хүчтэй, ой боловсрох тусам саарна */
    const windOn=(1-growth*.72)*Math.max(0,Math.min(1,growth*6));
    SITE.wind.visible=windOn>.03&&!REDUCED;
    if(SITE.wind.visible){
      SITE.wind.material.opacity=.6*windOn;
      for(let i=0;i<150;i++){
        const lane=(i%2?1:-1)*(31+((i*7)%30));
        const y=1.0+((i*5)%9)*.7;
        const x=(((t*(9+(i%5)*2.5)+i*11)%124)-62);
        dummy.position.set(x,y,lane+Math.sin(t*.5+i)*1.2);
        dummy.rotation.set(0,0,0);
        dummy.scale.set(.6+((i*3)%5)*.28,1,1);
        dummy.updateMatrix(); SITE.wind.setMatrixAt(i,dummy.matrix);
      }
      SITE.wind.instanceMatrix.needsUpdate=true;
    }

  }

  // мод бүрийн ургалт
  const neb=Math.max(0,Math.min(1,(growth-.40)/.40));   // 3–7 дахь жилээс эхэлнэ
  TREES.forEach(function(tr,i){
    const gi=Math.max(0,Math.min(1,(growth-tr.off)/(1-tr.off)));
    tr.e=gi*gi*(3-2*gi);
    if(SITE&&SITE.neb){
      const e=neb*tr.e;
      const rr=Math.max(.001,.66*tr.H*e), hh2=Math.max(.001,.30*tr.H*e);
      dummy.position.set(tr.x,tr.base,tr.z);
      dummy.rotation.set(0,tr.sway,0);
      dummy.scale.set(rr,hh2,rr*.84);
      dummy.updateMatrix(); SITE.neb.setMatrixAt(i,dummy.matrix);
    }
  });
  if(SITE&&SITE.neb) SITE.neb.instanceMatrix.needsUpdate=true;
  // иш ба мөчир
  TPARTS.forEach(function(p,i){
    const tr=TREES[p.t], H=Math.max(.001,tr.H*tr.e);
    dummy.position.set(tr.x,tr.base+p.oy*H,tr.z);
    dummy.rotation.set(p.tx,0,p.tz);
    dummy.scale.set(p.rad*H,p.len*H,p.rad*H);
    dummy.updateMatrix(); trunkIM.setMatrixAt(i,dummy.matrix);
  });
  // навчны давхарга — камер руу эргэсэн хавтгай
  LPARTS.forEach(function(p,i){
    const tr=TREES[p.t], H=Math.max(.001,tr.H*tr.e);
    const swy=REDUCED?0:Math.sin(t*.62+tr.sway+p.ph)*.045*tr.e;
    dummy.position.set(tr.x+p.ox*H+swy, tr.base+p.oy*H, tr.z+p.oz*H);
    dummy.quaternion.copy(cam.quaternion);
    const s=p.r*H*2.1*SEASONS[season].leaf;
    dummy.scale.set(s,s*.9,1);
    dummy.updateMatrix(); leafIM.setMatrixAt(i,dummy.matrix);
  });
  trunkIM.instanceMatrix.needsUpdate=true; leafIM.instanceMatrix.needsUpdate=true;
  rend.render(scene,cam);
}

/* ---------- цаг хугацаа: автомат тоглуулалт, эсвэл гараар ----------
   Тайзыг 5000 px гүйлгэж байж бүтэн дүр зураг гарч ирдэг байсан нь хүнд
   байсан тул дүр зураг наалдмагц өөрөө тоглож эхэлнэ. Гараар оролцмогц
   (гулсагч, он дарах) автомат зогсоно. */
/* Автомат тоглуулалт байхгүй. Уншигч он тус бүрийн цэг дээр дарж дүр зургийг
   тэр он руу гүйлгэнэ — beatF нь зорилтот он руу жигд ойртох тул завсрын
   жилүүд харагдаж, мод үе шаттай ургана. */
const STEP_SPEED=2.4;                       // 1/сек — экспоненциал ойртолт
const PLAY_SECS=14;                         // бүтэн цаг хугацааг туулах хугацаа
let manual=false, target=0, TL=null, auto=false, played=false;
/* Цаг хугацааны гүйлт эцэс төгсгөлгүй давтагдана: 2026-оос 2032 хүртэл гүйж
   дуусаад бэлэн болсон талбайг LOOP_HOLD секунд барьж үзүүлээд эхнээс нь дахин
   эхэлнэ. Дэлгэцийн горимд (screen.html) давтахгүй — тэнд done() дууссаныг
   мэдэгдэж дараагийн бүтээл рүү шилждэг тул мөнхийн давталт гацаа болно. */
const LOOP=!window.__laLazy, LOOP_HOLD=3.2;
let holdT=0, dwellT=0;
/* Он дээр дарах нь автомат гүйлтийг зогсоож, гар удирдлагад шилжүүлнэ */
function goTo(v){ setPlay(false); target=Math.max(0,Math.min(BEATS.length-1,v)); }
/* Өөрөө эхлэхгүй: дүр зураг сүүлийн он дээрээ буюу бэлэн үр дүн дээрээ зогсоно.
   Уншигч Play дарж эхнээс нь гүйлгэнэ, гүйж дуусаад дахин сүүлийн он дээр зогсоно. */
function setPlay(on){
  auto=on; if(!on){ holdT=0; dwellT=0; }
  if(!TL||!TL.play) return;
  TL.play.textContent='';
  TL.play.insertAdjacentHTML('beforeend','<i></i>');
  TL.play.appendChild(document.createTextNode(on?'Pause':'Play from 2026'));
  TL.play.className='hx-play'+(on?' playing':'');
}
function applyBeat(){
  const p=beatF/(BEATS.length-1);
  document.getElementById('hxMeter').style.width=(p*100)+'%';
  const i=Math.round(beatF), b=BEATS[i];
  document.getElementById('hxYearN').textContent=b.y;
  document.getElementById('hxYearL').textContent=b.l;
  setCap(i);
  if(TL){
    if(!manual) TL.rng.value=beatF;
    for(let k=0;k<TL.btns.length;k++) TL.btns[k].className=(k===i?'on':'');
  }
}
(function(){
  const host=document.getElementById('hxTimeIn');
  if(!host) return;
  let s='<div class="lb"><span>Timeline &amp; season</span>'+
        '<button type="button" class="hx-play"><i></i>Play from 2026</button></div>'+
        '<input class="tl" type="range" min="0" max="'+(BEATS.length-1)+
        '" step="0.01" value="0"><div class="tks">';
  /* Эхний хоёр үе шат нэг онд болдог тул шууд он бичвэл "2026 2026" гэж давхардаж,
     алдаа мэт уншигдана. Он солигдох бүрд оноо, давтагдах үед тухайн үе шатны нэрийг
     харуулбал давхардал арилж, тэмдэглэгээ нь илүү мэдээлэлтэй болно. */
  for(let i=0;i<BEATS.length;i++)
    s+='<button type="button" data-i="'+i+'">'+
       ((i>0&&BEATS[i-1].y===BEATS[i].y)?BEATS[i].l:BEATS[i].y)+'</button>';
  host.innerHTML=s+'</div>';
  const rng=host.querySelector('.tl'), btns=host.querySelectorAll('.tks button');
  TL={rng:rng,btns:btns,play:host.querySelector('.hx-play')};
  TL.play.onclick=function(){
    if(auto){ setPlay(false); return; }
    manual=false; beatF=0; target=0; applyBeat(); setPlay(true);
  };
  rng.addEventListener('input',function(){       // гулсуурыг чирэхэд шууд дагана
    setPlay(false); manual=true; beatF=parseFloat(rng.value); target=beatF; applyBeat();
  });
  for(let i=0;i<btns.length;i++) btns[i].onclick=function(){
    manual=false; goTo(parseFloat(this.getAttribute('data-i')));
  };
  let ss='<div class="ss">';
  for(let i=0;i<SEASONS.length;i++) ss+='<button type="button" data-s="'+i+'">'+SEASONS[i].n+'</button>';
  host.insertAdjacentHTML('beforeend',ss+'</div>');
  const sb=host.querySelectorAll('.ss button');
  for(let i=0;i<sb.length;i++) sb[i].onclick=function(){
    season=parseInt(this.getAttribute('data-s'),10); applySeason();
  };
})();
function applySeason(){
  const S=SEASONS[season];
  if(paintLeaves) paintLeaves();
  if(sunL){ sunL.color.copy(SC(S.sun)); sunL.intensity=S.si; }
  if(hemiL) hemiL.intensity=S.hemi;
  if(scene&&scene.fog) scene.fog.color.copy(SC(S.fog));
  if(groundM) groundM.color.copy(SC('#CBBEA0')).lerp(SNOW,S.snow*.72);
  GREEN.copy(SC(S.grn));
  const bs=document.querySelectorAll('#hxTimeIn .ss button');
  for(let i=0;i<bs.length;i++) bs[i].className=(i===season?'on':'');
}
/* Скролл цаг хугацааг жолоодохгүй. Дүр зураг сүүлийн он дээрээ зогсож эхэлнэ. */
beatF=BEATS.length-1; target=beatF; growth=BEATS[BEATS.length-1].g; applyBeat(); setPlay(false);
/* Дэлгэцийн горимд бүх дүр зургийг нэг дор барих нь эхлэлийг удаашруулна:
   дөрвөн WebGL renderer, ~25,000 мод, ~110,000 instance. __laLazy тавьсан үед
   зөвхөн хэрэгтэй үед нь барина. Сайт дээр энэ туг байхгүй тул хуучнаараа. */
if(window.THREE){ if(window.__laLazy) window.__laInitHex=init3D; else init3D(); }
else{ document.getElementById('hxBoot').textContent='3D VIEW COULD NOT LOAD'; }
})();

/* ══════════ ӨМНӨХ БҮТЭЭЛҮҮД — хуваалцсан хөдөлгүүр ══════════
   Бүтээл бүрийн хэлбэрийг постерын агаарын зурагт тулгуурлан
   зурган маск болгож, будагдсан цэг бүр дээр мод тарина. */
(function projects(){
  if(!window.THREE) return;
  const SCp=function(hex){return new THREE.Color(hex).convertSRGBToLinear();};
  const RED=matchMedia('(prefers-reduced-motion: reduce)').matches;

  function maskPoints(draw,W,H,step,scale){
    const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    const g=cv.getContext('2d');
    g.fillStyle='#ffffff'; g.fillRect(0,0,W,H);
    g.fillStyle='#000000'; g.strokeStyle='#000000';
    g.lineJoin='round'; g.lineCap='round';
    draw(g,W,H);
    const d=g.getImageData(0,0,W,H).data, pts=[];
    for(let y=0;y<H;y+=step)for(let x=0;x<W;x+=step){
      if(d[(y*W+x)*4]<120){
        /* Хэлбэлзэлгүй: цэг бүр алхмын торон дээр яг суух тул нүх нь HEXAGON-ынхтой
           адил тэгш хэмтэй эгнээ үүсгэнэ. Санамсаргүй шидэлт нь модны титэм дор
           мэдэгддэггүй байсан ч ил гарсан нүхийг эмх замбараагүй харагдуулж байв. */
        pts.push({x:(x-W/2)*scale, z:(y-H/2)*scale});
      }
    }
    return pts;
  }


  /* Үсгийг зузаан зураасаар зурна. A, M, N зэрэг үсэгт налуу зураас
     заавал хэрэгтэй — зөвхөн босоо, хэвтээ тэгш өнцөгтөөр зурвал таних
     боломжгүй болно. */
  function glyph(g,ch,x,y,w,hh,t){
    g.lineWidth=t; g.lineCap='butt'; g.lineJoin='miter';
    /* 90°-ийн залгаас (харьцаа 1.41) хурц хэвээр, түүнээс хурц нь налуу
       таслагдана — M-ийн дундах "V"-гээс шовх ирмэг гарахгүй. */
    g.miterLimit=1.6;
    const L=x+t/2, R=x+w-t/2, T=y+t/2, Bm=y+hh-t/2, Md=y+hh/2, Cx=x+w/2;
    const p=function(a){g.beginPath();g.moveTo(a[0][0],a[0][1]);
      for(let i=1;i<a.length;i++)g.lineTo(a[i][0],a[i][1]);g.stroke();};
    switch(ch){
      case 'B': p([[L,Bm],[L,T],[R,T],[R,Md],[L,Md]]);
                p([[L,Md],[R,Md],[R,Bm],[L,Bm]]); break;
      case 'E': p([[R,T],[L,T],[L,Bm],[R,Bm]]); p([[L,Md],[R-t*.5,Md]]); break;
      case 'H': p([[L,T],[L,Bm]]); p([[R,T],[R,Bm]]); p([[L,Md],[R,Md]]); break;
      case 'U': p([[L,T],[L,Bm],[R,Bm],[R,T]]); break;
      case 'M': p([[L,Bm],[L,T],[Cx,y+hh*.60],[R,T],[R,Bm]]); break;
      /* Талбай дээрх үсэг нь тэгш оройтой блок хэлбэртэй — шовх орой биш */
      case 'A': p([[L,Bm],[L,T],[R,T],[R,Bm]]);
                p([[L,y+hh*.60],[R,y+hh*.60]]); break;
      /* N — гурван тусдаа зураас. Нэг тасралтгүй шугамаар зурвал зүүн дээд
         ба баруун доод булангийн хурц өнцөгт үсгийн хүрээнээс гарсан
         шовх ирмэг үүсдэг. */
      case 'N': p([[L,T],[L,Bm]]); p([[R,T],[R,Bm]]);
                p([[L,T],[R,Bm]]); break;
      case 'T': p([[L,T],[R,T]]); p([[Cx,T],[Cx,Bm]]); break;
      case 'C': p([[R,T],[L,T],[L,Bm],[R,Bm]]); break;
      default: break;
    }
  }
  function word(g,s,x,y,w,hh,t,gap){
    const n=s.length, cw=(w-gap*(n-1))/n;
    for(let i=0;i<n;i++) if(s[i]!==' ') glyph(g,s[i],x+i*(cw+gap),y,cw,hh,t);
  }

  /* Бүтээл бүрийн жинхэнэ хэмжээ (1 px ≈ 1 м):
     BE HUMAN — 300 × 100 м тэгш өнцөгт = 30,000 м²
     ART N TECH — 300 м талтай зөв гурвалжин = 38,971 м² */
  const MASK={
    /* BE HUMAN-д үсгийн нарийн ялгааг гаргахын тулд 2 м алхам —
       жинхэнэ талбайд 21,857 мод буюу ~1.2 м зайтай тарьсан. */
    behuman:{W:330,H:137,step:2,scale:.200},
    artntech:{W:316,H:280,step:3,scale:.200},
    /* JACK'S COFFEE — 0.25 га, 10,000 хайлаас, 0.5 м алхамтай.
       maskPoints нь W×H ПИКСЕЛ-ийн зотон дээр step пикселээр алхдаг тул step нь
       бүхэл байх ёстой: 0.5 өгвөл getImageData-гийн индекс бутархай болж, нэг
       пикселийг хэд хэдэн удаа, өөр өөр өнгөний сувгаас уншиж, дүрс давхарласан
       мэт харагдана. Тиймээс зотонг метр тутамд 2 пикселээр авна: 63 × 73 м →
       126 × 146 пиксел, алхам 1 пиксел = 0.5 м, scale нь хагасална (0.200 → 0.100).
       Тарилт: 10,006 цэг ≈ 2,502 м².
       Дүр зураг нь тарилтыг ТӨЛӨӨЛНӨ, нэг бүрчлэн зурдаггүй: BE HUMAN 21,857
       модтой ч ~4,500-г, ART N TECH 36,000-аас ~4,000-г зурдаг. Бодит 10,000 мод
       нь бүтээлийн баримт хэвээр.
       scale нь бусадтай ижил .200: дүр зургийн бүх тогтмол — модны өндөр, хучаас,
       манан, нарны сүүдрийн хайрцаг — тэр хэмжээнд тохируулагдсан. Хагасалбал
       бүтээл дөрөвний нэг болж, сүүдрийн зураглалын нарийвчлал алдагдаж, элсэн
       дээр бараан толбо анивчиж эхэлдэг. step=2 → зай 0.4, яг BE HUMAN шиг. */
    jacks:{W:126,H:146,step:2,scale:.200}
  };

  /* ---- хэлбэрүүд: рендер зургаас хуулсан ---- */
  const SHAPES={
    /* BE HUMAN — урт нарийн тэгш өнцөгт зурвас, дотор нь том блок үсэг.
       Постер дээр зурвасын хүрээ модоор тодрон, үсэг бүтнээрээ тарьсан. */
    /* BE HUMAN — хэлбэрийг "be human render.png"-ээс шууд буулгасан 330×144 битмаск.
       Өмнө нь хүрээ + word('BE') + word('HUMAN') гэж программаар зурдаг байсан ч
       үсгийн зузаан, байрлал нь бодит тарилтаас зөрж байсан. Маск дээр 1 = мод.
       Хүрээний дотор талд 10 нүдний зай цэвэрлэсэн — рендер дээр H, N, HUMAN-ы
       доод тал хүрээтэй шүргэлцэж, нэг цул болж уншигдаж байсан. Зай цэвэрлэхдээ
       хүрээнд өөрт нь хүрэхгүй, эс тэгвээс булан бүрт хүрээ тасарна.
       Хүрээний зурвас нь рендерийнхээ жинхэнэ зузаан (10/13 нүд) хэвээр; хүрээлж буй
       тэгш өнцөгтийг томсгохын тулд үсгийг 0.68 хувиар багасгаж, 18 нүдийн чөлөө
       үлдээв. Рендер дээр үсгүүд хоорондоо давхцсан байдаг тул жигд нарийсгах нь
       болоогүй — үсэг эвдэрдэг. Оронд нь үг тус бүрийн багана/мөрийн нягтралаас
       хамгийн нарийн уулзварыг олж, зөвхөн тэндээс нь тасалсан: BE-д 1, HUMAN-д 4
       босоо тасалгаа, BE ба HUMAN хооронд 1 хэвтээ. Үсэг бүр биеэ бүтэн хадгална. */
    behuman:(function(){
      const MW=330, MH=137;
      const B64="AAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf//8AAAP/3+fwAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf///YAAf////4AAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf///+AAf////4AAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////wAf////4AAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////wAf////wAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////4Af////4AAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////8Af////4AAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////8Af////wAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf+AA/+Af+AAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf8AAf8Af+AAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf8AAf+Af+AAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf+AA/+Af+AAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf8AA/8Af8AAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf8AA/8Af+AAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////8Af////gAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////8Af////wAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////wA/////gAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////wA/////gAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////wAf////wAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////4Af////gAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////8Af////wAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////+Af////wAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf+AAf+Af+AAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf8AAP+Af+AAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf+AAP+Af+AAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf+AAP+A/+AAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf8AAP+Af+AAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf+AAP+Af+AAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf8AAP+Af+AAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf8AB/+Af////wAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAA/////+Af////8AAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAA/////+Af////8AAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////8Af////8AAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAA/////8Af////4AAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAf////wAf////8AAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/A/8AAf8A/8AAfwA//wAP/4AAB/+AAA/+AA/+B/4AAAAAAAAAAAAAAP/A/+AAP8A/4AAfwA//wAP/4AAB//AAA/+AA/+B/4AAAAAAAAAAAAAAP/A/8AAP8A/8AAfwB//wAf/4AAD//AAA//AA/+B/4AAAAAAAAAAAAAAP/A/8AAf8A/8AAfwB//wAf/4AAD//AAA//AA/+B/4AAAAAAAAAAAAAAP/A/8AAP8A/4AAfwA//4Af/4AAH//AAA//gA/+B/4AAAAAAAAAAAAAAP/A/8AAP8A/8AAfwB//8Af/4AAH//gAA//wA/+B/4AAAAAAAAAAAAAAP/A/+AAP8A/4AAfwA//8A//4AAP//wAA//4A/+B/4AAAAAAAAAAAAAAP/A/8AAP8A/4AAfwA//8A//4AAf//wAA//4A/+B/4AAAAAAAAAAAAAAP/A/8AAf8A/8AAfwB//8B//4AA///wAA//8A/+B/4AAAAAAAAAAAAAAP/A/+AAP8A/4AAfwA//+B//4AA///wAA//+A/+B/4AAAAAAAAAAAAAAP/A/8AAP8A/8AAfwB///B//4AA/9/4AA//+A/+B/4AAAAAAAAAAAAAAP/A/8AAP8A/8AAfwB///B//4AA/8/8AA///A/+B/4AAAAAAAAAAAAAAP/A/////8A/4AAfwA/z+D//4AB/8/+AA///g/+B/4AAAAAAAAAAAAAAP/A/////8A/8AAfwA///H//4AB/4f/AA///g/+B/4AAAAAAAAAAAAAAP/A/////8A/4AAfwA/3/H//4AD/4P/AA///8/+B/4AAAAAAAAAAAAAAP/A/////8A/4AAfwA/z/H/P4AD/wP/AA/7/8/+B/4AAAAAAAAAAAAAAP/A/////8A/8AAfwB/7/n/f4AH/wP/AA/5/+/+B/4AAAAAAAAAAAAAAP/A/////8A/4AAfwA/z/v//4AD/wH/gA/4///+B/4AAAAAAAAAAAAAAP/A/////8A/8AAfwA/x///P4AH/+P/wA/4f//+B/4AAAAAAAAAAAAAAP/A/////8A/8AAfwB/5///f4AP////wA/4f//+B/4AAAAAAAAAAAAAAP/A/8AAP8A/8AAfwA/w//+P4Af////4A/4P//+B/4AAAAAAAAAAAAAAP/A/8AAP8A/8AAfwA/w//+P4Af////4A/4H//+B/4AAAAAAAAAAAAAAP/A/+AAP8A/4AAfwA/w//+f4Af////4A/4H//+B/4AAAAAAAAAAAAAAP/A/+AAP8A/4AAfwA/w//8P4A/////8A/4D//+B/4AAAAAAAAAAAAAAP/A/8AAP8A/8AAfwA/w//8P4A/////8A/4B//+B/4AAAAAAAAAAAAAAP/A/+AAP8Af+AA/wA/w//4f4B/////+A/4B//+B/4AAAAAAAAAAAAAAP/A/+AAP8Af+AD/wA/wf/4P4D/////+A/4A//+B/4AAAAAAAAAAAAAAP/A/8AAP8AP////wB/4P/4f4H/wAAf/g/4Af/+B/4AAAAAAAAAAAAAAP/A/+AAP8AP////wA/wP/4f4H/wAAf/g/4Af/+B/4AAAAAAAAAAAAAAP/A/8AAP8AP////wA/wP/4P4H/wAAP/g/4AP/+B/4AAAAAAAAAAAAAAP/A/8AAP8AP////wB/4P/4f4H/wAAP/g/4AH/+B/4AAAAAAAAAAAAAAP/A/+AAP8AB////AA/wH/wf4P/gAAP/g/4AD/+B/4AAAAAAAAAAAAAAP/A/8AAP8AB////AA/wH/wP4P/gAAH/g/4AD/+B/4AAAAAAAAAAAAAAP/A/+AAP8AAf//8AA/wD/gf4P/AAAD/g/4AA/+B/4AAAAAAAAAAAAAAP/A/+AAP8AAD//gAA/wD/gP4P/AAAD/g/4AAf+B/4AAAAAAAAAAAAAAP/A/////8P/////wf//////4P//////g/////+B/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAAAAAAAAP///////////////////////////////////////4AAAAAAAA";
      let bits=null;
      function unpack(){
        const raw=atob(B64), a=new Uint8Array(MW*MH);
        for(let i=0;i<a.length;i++) a[i]=(raw.charCodeAt(i>>3)>>(7-(i&7)))&1;
        return a;
      }
      return function(g,W,H){
        if(!bits) bits=unpack();
        g.fillStyle='#ffffff'; g.fillRect(0,0,W,H);
        g.fillStyle='#000000';
        const cw=W/MW, ch=H/MH;
        for(let y=0;y<MH;y++){
          let run=-1;
          for(let x=0;x<=MW;x++){
            const on = x<MW && bits[y*MW+x];
            if(on && run<0) run=x;
            else if(!on && run>=0){ g.fillRect(run*cw, y*ch, (x-run)*cw+0.5, ch+0.5); run=-1; }
          }
        }
      };
    })(),
    /* ART N TECH — 300 м талтай зөв гурвалжин, бүхэлдээ эгнээгээр тарьсан.
       Агаарын зургаас хэмжсэн бүтэц:
         · төвдөө том НҮЦГЭН ДУГУЙ ТАЛБАЙ (r≈29 м), голд нь товгор
         · түүнийг тойрсон ГАНЦ ТОМ ДУГУЙ ЗАМ (r≈69 м)
         · гурван орой руу татсан салаа зам, тус бүрийн үзүүрт дугуй талбай
         · нэг нь урт зам болж гурвалжны булангаар гарна
       Зам, талбай нь тарилтгүй тул цагаанаар хусна. */
    artntech:function(g,W,H){
      const s=W*.95;                       // талын урт
      const th=s*0.8660254;                // өндөр
      const Cx=W*.50;
      const ay=(H-th)/2, by=ay+th;         // орой ба сууриийн Y
      const ax=Cx, bx=Cx+s/2, cx=Cx-s/2;
      g.fillStyle='#000000';
      g.beginPath(); g.moveTo(ax,ay); g.lineTo(bx,by); g.lineTo(cx,by); g.closePath(); g.fill();

      // төв — гурвалжны хүндийн төв
      const Cy=ay+th*(2/3);
      g.fillStyle='#ffffff'; g.strokeStyle='#ffffff';
      g.lineCap='round'; g.lineJoin='round';

      const RING=s*.230;                       // дугуй зам, r ≈ 69 м
      const HUB =s*.095;                       // төвийн нүцгэн талбай, r ≈ 29 м
      const NODE=s*.330;                       // салаа замын үзүүр, r ≈ 99 м
      const rays=[-Math.PI/2, Math.PI/6, Math.PI*5/6];   // гурван орой рүү

      /* Гурван салаа зам адилхан: төвөөс гарч, дугуй замыг огтолж,
         дугуй талбайгаа дайраад бага зэрэг цааш үргэлжилнэ.
         Гурвалжны булангуудыг зүсэхгүй — зурагт орой нь бүтэн байдаг. */
      g.lineWidth=Math.max(4,s*.020);
      for(let i=0;i<3;i++){
        const a=rays[i], len=NODE+s*.060;
        g.beginPath(); g.moveTo(Cx,Cy);
        g.lineTo(Cx+Math.cos(a)*len, Cy+Math.sin(a)*len); g.stroke();
      }
      // ганц том дугуй зам
      g.lineWidth=Math.max(4,s*.020);
      g.beginPath(); g.arc(Cx,Cy,RING,0,6.283); g.stroke();
      // салаа замын үзүүр дэх гурван дугуй талбай
      for(let i=0;i<3;i++){
        const a=rays[i];
        g.beginPath();
        g.arc(Cx+Math.cos(a)*NODE, Cy+Math.sin(a)*NODE, s*.042, 0, 6.283); g.fill();
      }
      // төвийн том нүцгэн дугуй талбай — голдоо товгортой
      g.beginPath(); g.arc(Cx,Cy,HUB,0,6.283); g.fill();
    },

    /* JACK'S COFFEE — компанийн тэмдэг, өгөгдсөн 512×512 артворкоос буулгав.
       Бүх координат 512 хэмжээст, X()/Y() нь тарилтын хүрээ рүү шилжүүлнэ.
       Дүрс нь хэсгүүдийн нэгдэл: чихтэй толгой, зүүн гар, их бие, баруун
       гарын дэгээ, тэлж татсан хоёр хөл. Нүд нь тарилтгүй нүх. */
    /* JACK'S COFFEE — тэмдгийг "assets/images/jack's symbol.png" дээрх модоор
       тарьсан рендерээс шууд буулгав: ногоон нь тарилт, элсэн шар нь хоосон.
       Өнгөөр ялгаж, модны бүтцийн толбыг морфологиор цэвэрлэж, хамгийн том
       холбоост хэсгийг авч 130×150 битмаск болгосон — нүд нь нүх хэвээр.
       Гараар зурсангүй: брэндийн тэмдгийг таамаглах ёсгүй. */
    jacks:JACKS_SHAPE

  };

  /* ---- он цаг: постерын огноо ба Martensite аудитын тарилтын огноо ---- */
  const BEATS={
    behuman:[
      {f:1.00,th:1.571,ph:.32,g:0,y:'2019',l:'the well',n:'(01)',h:'Water First',
       p:'Securing a reliable water source was our foundational step, beginning with the '+
         'excavation of a <b>deep well</b>. In a hyper-arid region where annual precipitation '+
         'averages just 100 mm and evaporation rates are exponentially higher, establishing '+
         'on-site water infrastructure is an absolute prerequisite for ecological restoration.'},
      {f:.90,th:1.43,ph:.44,g:0,y:'2020',l:'survey · design',n:'(02)',h:'The Layout Plan',
       p:'Soil and water analyses were carried out. The '+
         '<b>layout plan</b> fixed the spacing between the trees and the position of every pit '+
         'before a single hole was dug.'},
      /* Хашаа, нүх, тарилт гурав нэг 2021 онд багтдаг тул нэг үе шат: салгавал цаг
         хугацааны туузан дээр 2021 хоёр товч болж хуваагдана. */
      {f:.64,th:1.62,ph:.66,g:.15,y:'2021',l:'fence · pits · planting',n:'(03)',h:'The message is written',
       p:'From April the perimeter fence went up and the tree pits were dug — building the '+
         'conditions before planting is what decides survival. <b>21,857 elms</b> went in from '+
         'June, in the shape of letters, every row set out by hand, with the irrigation system '+
         'assembled as the planting went in.'},
      {f:.54,th:1.95,ph:.76,g:.28,y:'2022',l:'first summer',n:'(04)',h:'The Fragile Stage',
       p:'The initial summer is the most critical. Because the root systems have not yet reached '+
         'sufficient depth, <b>continuous irrigation</b> is required. As the canopy establishes '+
         'during this stage, the organic typography becomes distinctly visible.'},
      {f:.48,th:2.30,ph:.84,g:.44,y:'2023',l:'three summers',n:'(05)',h:'The Risk Window',
       p:'By the end of the third summer, the critical vulnerability period concludes. Saplings '+
         'that survive this phase have successfully <b>anchored their root systems</b>, ensuring '+
         'long-term ecological viability.'},
      {f:.56,th:2.62,ph:.72,g:.62,y:'2024',l:'nebkha forms',n:'(06)',h:'The Nebkha Effect',
       p:'Monitored by <b>Martensite Analytica</b> across 2020–2024. '+
         'As the canopy develops, it slows the wind, allowing sand to settle at the base of the '+
         'trunks. This builds <b>nebkha mounds</b> that naturally trap moisture and rehabilitate '+
         'the soil. Ultimately, this restored micro-ecosystem facilitates the return of local '+
         'biodiversity, such as butterflies and hares.'},
      {f:1.02,th:1.571,ph:.24,g:.80,y:'2026',l:'five years on',n:'(07)',h:'Data Maturation',
       p:'Five years after planting, this 30,000-square-meter site is fully established. The '+
         'satellite data for the last two years was drawn from <b>Google Earth Engine</b>.'}],
    artntech:[
      {f:1.00,th:1.571,ph:.32,g:0,y:'2021',l:'layout plan',n:'(01)',h:'The Layout Plan',
       p:'The vision for this site originated in 2021, starting with a comprehensive '+
         '<b>layout plan</b> before any physical work commenced.'},
      {f:.90,th:1.45,ph:.44,g:0,y:'2022',l:'marking · pits',n:'(02)',h:'From Paper to Ground',
       p:'The layout plan was physically executed on-site: first through precise topographical '+
         'marking, followed by the excavation of the pits. Every location was staked exactly '+
         'where the drawing dictated, successfully transferring the geometry from paper onto the '+
         'open ground.'},
      {f:.74,th:1.55,ph:.62,g:.10,y:'2023',l:'fence · first half',n:'(03)',h:'Fence, and the First Half',
       p:'The perimeter fence went up in 2023, and half of the planting went in that season with '+
         'the <b>drip irrigation</b> laid alongside it.'},
      {f:.64,th:1.62,ph:.66,g:.26,y:'2024',l:'planting complete',n:'(04)',h:'The Triangle Closed',
       p:'The remaining half was planted through 2024 and the irrigation system completed — '+
         '<b>36,000 elms</b> across the full triangle, around an open circular center with a ring '+
         'road encircling it and three spurs running out to the corners.'},
      {f:.54,th:1.95,ph:.76,g:.40,y:'2025',l:'first summer',n:'(05)',h:'The First Summer',
       p:'During this highly fragile stage, the root systems remain shallow, requiring '+
         '<b>continuous irrigation</b>. As the foliage emerges, the triangular geometry becomes '+
         'clearly legible from above.'},
      {f:.48,th:2.30,ph:.84,g:.52,y:'2026',l:'second summer',n:'(06)',h:'Canopies Spread',
       p:'Canopies begin to spread and close the distance between the rows. The ring road and the '+
         'three spurs stand out sharply against the greening ground.'}],
    /* ── Текст нь jacks.coffee-ийн өөрийнх нь хуудсуудаас ─────────────────
       Компанийн түүх /about-аас (2013 кофе шоп, 2016 үйлдвэр, 2025 өргөжилт),
       хөтөлбөрийн тайлбар /cop17-оос (One Coffee One Tree, гурван ундаа,
       98,000₮, модоо нэрлэх, жил бүрийн и-мэйл, COP17-ийн огноо, Монголын
       нутгийн 77% доройтолд өртсөн).

       ОРУУЛААГҮЙ ГУРВАН ТОО. Тэдний хуудсан дээр 166,000 мод, 109,000 м²,
       186.7 тн CO₂ гэж бичсэн байдаг ч гурвуулаа энэ сайтын өөрийн тоотой
       зөрж байна (57,857 мод, 68,970 м²), нүүрстөрөгчийнх нь аудитын 7.65
       тонноос 24 дахин их. Түншийн хуудсан дээрх тоог шалгалгүй энд
       хуулбарлавал энэ сайтын тоонууд өөр хоорондоо зөрчилдөнө. */
    jacks:[
      {f:1.00,th:1.571,ph:.32,g:0,y:'2026',l:'the ground',n:'(01)',h:'One Coffee, One Tree',
       p:'A coffee roaster and a land-art programme, on the same ground. Jack\'s Coffee has '+
         'roasted in Ulaanbaatar since <b>2013</b> and built its own roastery in <b>2016</b>; '+
         'this is where the sales go. The plot is degraded rangeland at Erdene sum, Dornogovi — '+
         'one of the areas worst affected by desertification in a country where <b>77% of the '+
         'territory</b> is degraded.'},
      {f:.86,th:1.40,ph:.46,g:0,y:'2026',l:'water · fence',n:'(02)',h:'Water and Enclosure',
       p:'Water reaches the plot and the perimeter is closed to livestock. The order is not '+
         'negotiable and does not change with the size of the work: on a quarter hectare as on '+
         'thirty, <b>the conditions are built before the planting</b>, not around it. Irrigation '+
         'here runs on solar.'},
      {f:.66,th:1.62,ph:.68,g:.14,y:'2026',l:'planting',n:'(03)',h:'Three Drinks, Ten Thousand Elms',
       p:'Three COP17 editions are served at <b>98,000₮</b> each — a sea-buckthorn matcha latte, '+
         'an anise espresso and an ube latte with lily root. Every one plants an elm. <b>10,000 '+
         'Siberian elm</b> · <i>Ulmus pumila</i> go in at half-metre spacing, four to the square '+
         'metre: the density is set by the mark, not by forestry practice.'},
      {f:.54,th:1.95,ph:.78,g:.34,y:'2027',l:'first summer',n:'(04)',h:'A Tree With a Name On It',
       p:'The buyer <b>names their own tree</b> and is written to once a year with what it is '+
         'doing. That is also the interval the planting is assessed on: root systems have not '+
         'reached depth in the first summer, so irrigation does not stop and <b>losses are '+
         'replanted</b>.'},
      {f:.48,th:2.30,ph:.86,g:.56,y:'2029',l:'three summers',n:'(05)',h:'The Risk Window Closes',
       p:'A sapling through three summers has anchored its roots and is unlikely to be lost. The '+
         'canopy closes and the mark becomes legible from the air — <b>2,500 m² of recovered '+
         'ground</b> that happens to be shaped like a company\'s symbol.'},
      {f:1.00,th:1.571,ph:.20,g:.78,y:'2036',l:'ten years',n:'(06)',h:'Ten Years of Care',
       p:'The campaign ran alongside <b>UNCCD COP17</b> in Ulaanbaatar, 17–28 August 2026. Every '+
         'marked cup served there funded one of these trees, and each carries <b>ten years of '+
         'maintenance and irrigation</b>. That interval, not the planting day, decides whether '+
         'restoration holds — and it is what the collaboration should be measured against.'}]
  };

  function build(sec){
    let season=1;
    const key=sec.getAttribute('data-proj');
    const host=sec.querySelector('.hx-canvas');
    const sticky=sec.querySelector('.hx-sticky');
    const stage=sec.querySelector('.hx-stage');
    const meter=sec.querySelector('.hx-meter');
    const yN=sec.querySelector('.hx-year b'), yL=sec.querySelector('.hx-year i');
    const cap=sec.querySelector('.hx-cap');
    const B=BEATS[key];

    const scene=new THREE.Scene();
    scene.fog=new THREE.Fog(SCp('#F2F0EA').getHex(),95,215);
    const cam=new THREE.PerspectiveCamera(42,1,.5,600);
    const rend=new THREE.WebGLRenderer({antialias:true,alpha:true});
    rend.setPixelRatio(Math.min(devicePixelRatio,2));
    rend.outputEncoding=THREE.sRGBEncoding;
    rend.shadowMap.enabled=true; rend.shadowMap.type=THREE.PCFSoftShadowMap;
    host.appendChild(rend.domElement);

    const hemi=new THREE.HemisphereLight(0xFFFFFF,0xFFFFFF,.5);
    hemi.color.copy(SCp('#D8E6FF')); hemi.groundColor.copy(SCp('#C2B394'));
    scene.add(hemi);
    const sun=new THREE.DirectionalLight(0xFFFFFF,1.6);
    sun.color.copy(SCp('#FFF2D4'));
    sun.position.set(40,80,26); sun.castShadow=true; sun.shadow.mapSize.set(window.__laShadowMap||2048,window.__laShadowMap||2048);
    sun.shadow.bias=-0.0006;
    const dd=52;
    sun.shadow.camera.left=-dd;sun.shadow.camera.right=dd;
    sun.shadow.camera.top=dd;sun.shadow.camera.bottom=-dd;sun.shadow.camera.far=200;
    scene.add(sun);

    const ground=new THREE.Mesh(new THREE.PlaneGeometry(700,700),
      new THREE.MeshStandardMaterial({color:SCp('#CBBEA0'),roughness:1}));
    ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

    /* ---- тарилтын цэгүүд ---- */
    const MK=MASK[key];
    /* Хучаасын радиус нь модны хоорондын зайд пропорциональ байх ёстой.
       Хэт том бол зэргэлдээ хучаас нийлж, үсэг/замын нүцгэн зурвасыг дүүргэнэ. */
    /* Хучаасын хэмжээ нь модны хоорондын ДЭЛХИЙН зайнаас хамаарна, зотоны
       пикселийн алхмаас биш. Өмнө нь MK.step/3 гэж бичсэн нь step ба scale
       хоёр үргэлж хамт өөрчлөгддөг гэсэн далд таамаг байсан: JACK'S дээр зотон
       нарийсаж (метрт 2 пиксел) step=1 болмогц хучаас зайнаасаа 3.3 дахин том
       болж, зэргэлдээ дискүүд давхцан z-fighting үүсгэж анивчиж байв.
       step×scale нь дэлхийн зай тул харьцаа гурван бүтээлд ижил хэвээр. */
    let SPC=MK.step*MK.scale;               // хоёр модны хоорондын дэлхийн зай
    let GS=SPC*(5/3);                       // (JACK'S дээр доор дахин тооцогдоно)
    let TSC=MK.tree||1;                     // нягт бүтээлд модыг жижигрүүлнэ
                                            // (JACK'S дээр доор дахин тооцогдоно)
    const PTS=maskPoints(SHAPES[key],MK.W,MK.H,MK.step,MK.scale);

    /* ── JACK'S — HEXAGON доторх A-01 нүдний харагдац ──────────────────────
       Энэ бүтээл нь тусдаа талбай биш, HEXAGON-ы A-01 нүд. Тиймээс тэндхийн
       харагдацаараа зурагдана: зургаалжин шал, зургаан ирмэгийн дагуу
       хайлаасан хашаа, дотор нь тэмдэг, чөлөө газарт нь үүрний хайрцаг, усны
       цэг, эргэлдэх шувууд. Өмнө нь хавтгай газар дээрх ганц тэмдэг байсан
       нь HEXAGON дээр харагддагаас огт өөр зүйл болж байв.

       Хэмжээг тэмдгээсээ гаргана, гараар бичихгүй: plantJacksCell дээр
       тэмдгийн өндөр нь apothem×1.24 тул apo = өндөр/1.24, зургаалжны радиус
       = apo/cos30°. Ингэснээр тэмдэг ба нүдний харьцаа хоёр дүр зурагт яг
       ижил гарна — маскийн масштаб өөрчлөгдвөл ч дагаж тохирно. */
    const JCK={birds:[],props:null};
    if(key==='jacks'){
      let mz=0; PTS.forEach(function(p){ mz=Math.max(mz,Math.abs(p.z)); });
      const apo=(mz*2)/1.24, cellR=apo/0.8660254;
      const U=0.62;                                  /* нэгж ≈ нэг модны өндөр */

      /* Хашаа ба тэмдгийг ГАРААР зурахгүй. HEXAGON-ы A-01 нүд яг ижил
         зохиомжийг __jacksCell-ээс авдаг тул энд ч түүнийг дуудна — нэг эх
         сурвалж. Маскаас ирсэн PTS-ийг бүрэн орлуулна, эс бөгөөс тэмдэг
         хоёр давхар таригдана.

         hedge утга нь HEXAGON дээр модны өндрийн үржүүлэгч (хашаа .62,
         тэмдэг .45). Энд өөр модны загвар тул харьцааг нь хадгалж, .45-ыг
         нэг гэж авч масштаблана: хашаа = .62/.45 = 1.38 дахин өндөр. */
      PTS.length=0;
      window.__jacksCell(cellR).forEach(function(p){
        /* Зургаалжныг тойрсон хашааг энэ дүр зурагт зурахгүй — нүд ганцаараа
           зогсох тул ирмэгийг тодруулах шаардлагагүй, харин тэмдгийг халхалж
           байв. Шүүлт нь ЗӨВХӨН энд: __jacksCell өөрөө хэвээрээ, тиймээс
           HEXAGON-ы A-01 хашаагаа хадгална. hedge .62 = хашаа, .45 = тэмдэг. */
        if(p.hedge>0.5) return;
        PTS.push({x:p.x, z:p.z, tall:1});
      });

      /* Модны хэмжээг мөн HEXAGON-ы харьцаанд тааруулна. Тэнд тэмдгийн мод
             H = (0.42+R·0.22) · (PITCH/3.05) · 0.45
         бөгөөд нүдний радиус нь 0.828·PITCH. Өөрөөр хэлбэл мод нь нүдний
         радиусын 0.075–0.114. Энэ дүр зурагт анхдагчаар 0.022 л байсан —
         дөрөв дахин жижиг, тиймээс тэмдэг цул ногоон болохын оронд цацсан
         цэг шиг, харьцангуйгаар үүр, цөөрөм асар том харагдаж байв.
         PITCH-ийг cellR/0.828-аар орлуулж тэр томьёог эргүүлнэ. */
      /* × 0.55 — муурын нүд ургасан хойно ч уншигдаж байхын тулд.
         Титмийн өргөн нь модны өндөртэй пропорциональ (навчны хавтгай нь
         p.r·H·2.1). Бүтэн өндөр дээр титэм 1.1–2.4 м болдог бол элэгдлийн
         дараах нүд ердөө ~1.1 м — нэг титэм түүнийг бүтнээр нь бүрхэнэ.
         Элэгдлийг цааш нэмэх боломжгүй: хоёр нүдний хооронд зургаан
         пикселийн зай тул 3-аас дээш авбал нүд нийлнэ. Иймд титмийг
         жижигрүүлэх ганц зам үлдэнэ — эх кодын өөрийнх нь шийдэл ч энэ:
         "тэмдгийн мод намхан, хашааных арай өндөр". */
      TSC=(cellR/0.828)/3.05*0.45*0.55;

      /* Хучаасын хэмжээг мөн дахин тооцно. SPC нь MK.step×MK.scale-аас
         гардаг бөгөөд тэр нь маскийг ХОЁР пиксел алхмаар уншсаны зай. Гэтэл
         __jacksCell тэмдгийг бүтэн нарийвчлалаар өгдөг тул жинхэнэ зай хоёр
         дахин бага болсон: хучаас зайнаасаа хоёр дахин том болж, зэргэлдээ
         дискүүд давхцан газар нүх нүхтэй харагдаж байв. Эх кодод яг энэ
         тухай сануулга бий — "step=1 болмогц хучаас зайнаасаа 3.3 дахин том
         болж … анивчиж байв". Жинхэнэ зай нь тэмдгийн өндөр ÷ маскийн мөр. */
      SPC=(mz*2)/145;
      GS=SPC*(5/3);

      /* Нүдний шал. HEXAGON дээр сэдэвт нүд ургахын хэрээр ногоон болдог
         (h.mat.color.lerp(GREEN,…)) тул энд ч зүлгэн ногоон. Элсэн өнгөтэй
         үлдээвэл нүд эргэн тойрны хоосон газраас ялгарахгүй байв.
         Мод y=0 дээр суудаг тул шалыг өргөхгүй — нимгэн хавтан. */
      const padMat=new THREE.MeshStandardMaterial({color:SCp('#CFC2A4'),roughness:1});
      const pad=new THREE.Mesh(
        /* HEXAGON дээр нүдний биет нь h.radius-аар зурагддаг бөгөөд cellR нь
           түүний 0.92 тул буцааж хуваана — тавцан яг тэр хэмжээтэй. */
        new THREE.CylinderGeometry(cellR/0.92,cellR/0.92,.06,6,1),padMat);
      pad.position.y=.03; pad.receiveShadow=true; scene.add(pad);
      JCK.pad=padMat;                       /* ургахын хэрээр ногоон болно */

      /* ── Түншийн туг ────────────────────────────────────────────────────
         HEXAGON дээр A-01 нь FLAG_LOGOS-д бүртгэлтэй тул тугтай гардаг.
         makeFlag нь init3D-ийн IIFE дотор хаалттай учир энд ижил харьцаагаар
         дахин барина: шонгийн өндөр PITCH×1.15 буюу эсийн радиусын 1.28,
         даавуу нь өндрийнхөө 0.62×0.34. Тугийг эсийн ТӨВӨӨС зөөнө — тэнд
         тэмдэг тарьсан тул мачт нь дундуур нь гарах ёсгүй. */
      (function(){
        /* HEXAGON дээр шон нь нүдний радиусын 1.389 дахин (poleH = PITCH·1.15,
           радиус = 0.828·PITCH). Тэнд туг нь 54 нүдний дундаас өөрийн нүдийг
           заах үүрэгтэй тул өндөр байх учиртай. Энд нүд ганцаараа зогсох тул
           тийм өндөр туг кадрыг эзэлж, тэмдгээс анхаарал сарниулж байв. */
        const poleH=cellR*0.34, cw=poleH*0.62, ch=poleH*0.34;
        const fg=new THREE.Group();
        fg.position.set(0.56*cellR, 0, -0.60*cellR);
        const pole=new THREE.Mesh(
          new THREE.CylinderGeometry(poleH*.012,poleH*.016,poleH,6),
          new THREE.MeshStandardMaterial({color:SCp('#8A8578'),roughness:.6,metalness:.3}));
        pole.position.y=poleH/2; pole.castShadow=true; fg.add(pole);
        /* Логог цагаан даавуун дээр буулгана: PNG тунгалаг дэвсгэртэй тул
           шууд наавал туг цоорхойтой болно. Зураг ирэх хүртэл цагаан туг. */
        const cv=document.createElement('canvas'); cv.width=512; cv.height=Math.round(512*ch/cw);
        const cx=cv.getContext('2d');
        cx.fillStyle='#FFFFFF'; cx.fillRect(0,0,cv.width,cv.height);
        cx.strokeStyle='#15160F'; cx.lineWidth=Math.max(3,cv.width*0.012);
        cx.strokeRect(cx.lineWidth/2,cx.lineWidth/2,cv.width-cx.lineWidth,cv.height-cx.lineWidth);
        cx.fillStyle='#B2D135'; cx.fillRect(0,0,Math.max(6,cv.width*0.028),cv.height);
        const tex=new THREE.CanvasTexture(cv);
        if(THREE.SRGBColorSpace&&tex.colorSpace!==undefined) tex.colorSpace=THREE.SRGBColorSpace;
        else if(THREE.sRGBEncoding&&tex.encoding!==undefined) tex.encoding=THREE.sRGBEncoding;
        const img=new Image();
        img.onload=function(){
          const AR=0.546, pd=cv.width*0.09, aw=cv.width-pd*2, ah=cv.height-pd*2;
          const s=Math.min(aw/AR,ah), dw=s*AR, dh=s;
          cx.drawImage(img,(cv.width-dw)/2,(cv.height-dh)/2,dw,dh);
          tex.needsUpdate=true;
        };
        img.src='assets/images/partner/hexagon-cells/JACKS-COFFEE_A.png';
        const cloth=new THREE.Mesh(new THREE.PlaneGeometry(cw,ch,14,8),
          new THREE.MeshStandardMaterial({color:0xffffff,map:tex,roughness:.85,
                                          side:THREE.DoubleSide}));
        cloth.position.set(cw/2,poleH-ch*0.62,0);   /* мачт нь даавууны зүүн ирмэг дээр */
        fg.add(cloth); scene.add(fg);
        JCK.flag={cloth:cloth,base:cloth.geometry.attributes.position.array.slice(),cw:cw};
      })();

      /* Үүрний хайрцаг ба усны цэг. Тэмдэг нүдний дунд бүсийг эзэлдэг тул
         дээд, доод оройн чөлөө рүү тавина — plantJacksCell мөн яг ийм
         шалтгаанаар тэднийг хажуу тийш зөөсөн байдаг. */
      /* Координатууд нь HEXAGON-ы BUILD.birds-ийнх — үсэг үсгээрээ адил.
         Тэдгээр нь 1.9407 нэгж радиустай нүдэнд зохиогдсон бөгөөд HEXAGON
         бүлгийг нь нүднийхээ радиустай пропорциональ томсгодог:
             scale = infra × 1.26 × (radius / 1.9407)
         Эхэндээ би оронд нь тогтмол тоо хэрэглэсэн нь алдаа байв — нүд
         томрох тусам үүр, цөөрөм харьцангуй жижигхэн үлдэж байлаа. Энд ч
         тэр дүрмийг дагана. cellR нь HEXAGON-ы radius×0.92-той тэнцүү тул
         буцааж хуваана. */
      const props=new THREE.Group(); scene.add(props);
      /* Эцсийн масштаб. HEXAGON дээр байгууламж ургалттай хамт томордог
         (infra·1.26·radius/1.9407) тул энд ч мөн адил — доорх кадрын код
         үүнийг growth-оор үржүүлнэ. Шууд бүрэн хэмжээгээр гарч ирвэл
         суулгац дөнгөж соёолж байхад үүрний шон бүтэн өндөртөө зогсоно. */
      JCK.propScale=1.26*(cellR/0.92)/1.9407;
      props.scale.setScalar(.001);
      /* Оройгоороо дээш харсан зургаалжин: өргөн нь apothem, өндөр нь радиус.
         Тавцан кадраас гарахгүйн тулд камерын тохируулгад үүнийг өгнө. */
      JCK.extent={x:cellR*0.8660254*1.06, z:cellR*1.06};
      const mWood=new THREE.MeshStandardMaterial({color:SCp('#8A6A46'),roughness:.9});
      const mPale=new THREE.MeshStandardMaterial({color:SCp('#D9CFB6'),roughness:.85});
      const mGrey=new THREE.MeshStandardMaterial({color:SCp('#9A958A'),roughness:.9});
      const mWatr=new THREE.MeshStandardMaterial({color:SCp('#6E93A8'),roughness:.3});
      const put=function(m,x,y,z){ m.position.set(x,y,z); m.castShadow=true; props.add(m); };
      /* Гурван үүр — өнцөг, радиус нь BUILD.birds дээрхтэй ижил гурвалжин.
         Хайрцаг, шонгийн ХЭМЖЭЭГ NB дахин томсгов: HEXAGON дээр эдгээр нь
         бүтэн талбайн дундах жижиг нарийн ширийн зүйл, харин энд нүд ганцаараа
         бүтээл болж зогсох тул уншигдахуйц байх ёстой. Байрлал хэвээр. */
      /* 1.0 = HEXAGON-тай яг тэнцүү — тэнд ч ижил масштабын дүрэм. Түүнээс
         дээш томсгох гэж 1.3, 1.8 хоёрыг туршсан ч хоёулаа тэмдгээ дарж,
         доороос нь цухуйж байв. Эх харьцаа нь шалтгаантай: эдгээр нь нүдний
         нарийн ширийн зүйл болохоос бүтээл өөрөө биш. */
      const NB=0.68;
      /* Байрлалыг дотогш татна. Үүр 1.34, цөөрөм 1.20 радиуст зогсдог нь
         apothem-ийн (0.866) гадна унана: томсгосон хайрцаг ирмэгээс гарч
         байв. HEXAGON дээр энэ мэдрэгддэггүй — тэнд нүд нь 54-ийн нэг тул
         гарсан ч зэргэлдээ нүд рүү ордог. Энд нүд ганцаараа зогсох тул
         бүх зүйл дотроо багтах ёстой. */
      /* ── Байрлалыг маскаас нь асууна ──────────────────────────────────
         BUILD.birds дээрх өнцгүүд (0°, 120°, 240°) нь HEXAGON-д зохистой:
         тэнд нүд нь 54-ийн нэг тул байгууламж тэмдэг рүү унасан ч зэргэлдээ
         нүд рүүгээ ордог. Энд нүд ганцаараа зогсох тул тогтмол өнцөг нь
         тэмдгийн мөчир дээр таарч, мод дундуураас цухуйж байв.

         Тогтмол өнцгийг орхиод чөлөө газрыг ТООЦНО: нүдний дотор олон цэг
         туршиж, тэмдгийн хамгийн ойрын модноос хэр хол байгааг хэмжинэ.
         Хамгийн чөлөөтэй дөрвийг нь сонгоно — гурав нь үүр, нэг нь цөөрөм.
         Тэмдэг өөрчлөгдвөл байрлал нь дагаж шинэчлэгдэнэ. */
      const apoW=cellR*0.8660254;
      const cand=[];
      for(let a=0;a<360;a+=4){
        const th=a*Math.PI/180;
        /* Ирмэг рүү шахсан радиусууд. 0.60-аас эхлэхэд тэмдгийн хөл дэлгэрсэн
           доод хэсэгт чөлөө газар багатай тул сонголт мөчир дээр таарч байв.
           0.88 нь apothem-ийн дотор үлдэх дээд хязгаар — хайрцгийн хагас өргөн
           багтана. */
        [0.72,0.80,0.88].forEach(function(rr){
          const x=Math.cos(th)*apoW*rr, z=Math.sin(th)*apoW*rr;
          let best=Infinity;
          /* Долоо тутмын нэг цэгийг шалгана — 10,000 модыг бүгдийг үзэх
             шаардлагагүй, тэд цул талбай тул ойролцоолол хангалттай. */
          for(let i=0;i<PTS.length;i+=7){
            const dx=PTS[i].x-x, dz=PTS[i].z-z, d=dx*dx+dz*dz;
            if(d<best) best=d;
          }
          cand.push({x:x,z:z,clear:Math.sqrt(best)});
        });
      }
      cand.sort(function(p,q){ return q.clear-p.clear; });
      /* Зөвхөн эрэмбэлээд дээрээс нь авах нь хангалтгүй байв: тэмдгийн хөл
         дэлгэрсэн доод хэсэгт бүх сонголт муу байсан ч хамгийн муу дундаас
         нь "хамгийн сайн"-ыг сонгоод, байгууламж модны ирмэг дээр таарч,
         доороосоо урсан гарч байв. Одоо ХАМГИЙН БАГА ЗАЙГ шаардана: тухайн
         байгууламжийн хагас өргөнөөс хоёр дахин их зайтай байх ёстой. Хангах
         цэг олдохгүй бол тэр байгууламжийг огт тавихгүй — модон дээр
         буулгахаас тавихгүй нь дээр. */
      const need=(0.26*NB/2)*JCK.propScale*2.4;
      const spots=[];
      cand.some(function(c){
        if(c.clear<need) return true;          /* эрэмбэлсэн тул цаашид бүр муу */
        const far=spots.every(function(s){
          return Math.hypot(s.x-c.x,s.z-c.z)>apoW*0.62; });
        if(far) spots.push(c);
        return spots.length>=4;
      });
      /* Бүлэг нь propScale-аар томордог тул дотоод координат руу хөрвүүлнэ. */
      const toLocal=function(v){ return v/JCK.propScale; };

      /* Хангалттай чөлөөтэй цэг цөөн олдвол цөөхнийг нь тавина. */
      const NESTS=spots.slice(0,3);
      NESTS.forEach(function(s){
        const x=toLocal(s.x), z=toLocal(s.z);
        put(new THREE.Mesh(new THREE.CylinderGeometry(.032*NB,.032*NB,.92*NB,6),mWood),x,.46*NB,z);
        put(new THREE.Mesh(new THREE.BoxGeometry(.20*NB,.24*NB,.18*NB),mPale),x,1.03*NB,z);
        put(new THREE.Mesh(new THREE.BoxGeometry(.26*NB,.05*NB,.24*NB),mGrey),x,1.17*NB,z);
      });
      /* Усны цэг — хайрган хүрээ, дотор нь ус. Хамгийн чөлөөтэй дөрөв дэх цэг. */
      const PW=1.0;
      const pnd=spots[3]||spots[spots.length-1];
      const pxL=pnd?toLocal(pnd.x):0, pzL=pnd?toLocal(pnd.z):0;
      put(new THREE.Mesh(new THREE.CylinderGeometry(.28*PW,.28*PW,.05,14),mGrey),pxL,.01,pzL);
      put(new THREE.Mesh(new THREE.CylinderGeometry(.23*PW,.23*PW,.07,14),mWatr),pxL,.04,pzL);

      /* Шувууд бүлэг дотроо — ингэснээр байгууламжтай ижил масштабаар
         томорно. BUILD.birds дээрх r, h, sp, ph утгууд хэвээр. */
      for(let i=0;i<5;i++){
        const bd=window.__bird3d(THREE,SCp('#4A463F'),.11), b=bd.g;
        props.add(b);
        JCK.birds.push({b:b,wl:bd.wl,wr:bd.wr,
                        r:.85+i*.20,h:1.55+i*.20,sp:.42+i*.07,ph:i*1.31});
      }
      props.visible=false; JCK.props=props;
    }

    let maxX=1,maxZ=1;
    PTS.forEach(function(p){maxX=Math.max(maxX,Math.abs(p.x));maxZ=Math.max(maxZ,Math.abs(p.z));});
    /* JACK'S: хашаа хасагдсан тул PTS зөвхөн тэмдгийг хамрах болсон бөгөөд
       камер түүгээр тохирвол зургаалжны ирмэг кадраас гарна. Нүдний өөрийнх
       нь хэмжээгээр өргөтгөнө — тавцан бүтнээрээ багтана. */
    if(JCK.extent){ maxX=Math.max(maxX,JCK.extent.x); maxZ=Math.max(maxZ,JCK.extent.z); }
    const Rf=Math.sqrt(maxX*maxX+maxZ*maxZ);      // бүтээлийг бүрэн багтаах радиус
    /* Сүүдрийн камерыг бүтээлийн хэмжээнд тааруулна. Тогтмол ±52 нэгжийн хайрцаг
       нь том бүтээлд тохирдог ч жижигт нь гүний нарийвчлал сарниж, элсэн дээр
       бараан толбо (shadow acne) үүсэн, камер эргэхэд анивчина. Хайрцгийг
       чангатгавал texel-ийн нягт өснө; bias-ыг мөн хайрцгийн хэмжээтэй
       пропорциональ болгоно. */
    (function(){
      const half=Math.max(8,Math.max(maxX,maxZ)*1.3+2);
      sun.shadow.camera.left=-half; sun.shadow.camera.right=half;
      sun.shadow.camera.top=half;   sun.shadow.camera.bottom=-half;
      sun.shadow.camera.far=Math.max(120,half*4);
      sun.shadow.bias=-0.0006*Math.max(.25,half/52);
      sun.shadow.camera.updateProjectionMatrix();
    })();
    let fitR=80;
    function computeFit(){
      // өргөн ба гүнийг тусад нь шалгаж, бүтээл бүтнээрээ багтах зайг олно
      const vh=cam.fov*Math.PI/360;
      const hh=Math.atan(Math.tan(vh)*cam.aspect);
      fitR=1.22*Math.max(maxX/Math.tan(hh), maxZ*.98/Math.tan(vh));
    }
    const TR=[], TP=[], LP=[];
    PTS.forEach(function(p,i){
      const R=Math.abs(Math.sin(i*12.9898)*43758.5453)%1;
      /* tall — зөвхөн JACK'S-ийн хашааны мод авдаг. Хашаа тэмдгээсээ өндөр
         байснаар нүдний ирмэг тодорч, тэмдэг хаана дуусахыг нүд шууд уншина. */
      TR.push({x:p.x,z:p.z,H:(.46+R*.24)*TSC*(p.tall||1),off:R*.36,sway:R*6.28,spin:R*6.28,e:0});
    });
    const BR=[{oy:0,len:.48,rad:.055,tx:0,tz:0},
              {oy:.38,len:.42,rad:.032,tx:0,tz:.44},
              {oy:.44,len:.36,rad:.026,tx:.36,tz:-.26}];
    /* Титэм долоон давхаргатай — таван давхаргатай үед мөчир, хөрс хэт их
       харагдаж, ой холоос ногоон биш саарал болж байсан. */
    const LF=[{rho:.06,oy:.80,r:.34,d:1},{rho:.42,oy:.68,r:.31,d:1},
              {rho:.48,oy:.78,r:.28,d:0},{rho:.34,oy:.88,r:.26,d:0},
              {rho:.56,oy:.68,r:.24,d:0},{rho:.22,oy:.74,r:.30,d:0},
              {rho:.16,oy:.90,r:.25,d:0}];
    TR.forEach(function(t,ti){
      BR.forEach(function(f,fi){TP.push({t:ti,oy:f.oy,len:f.len,rad:f.rad,
        tx:f.tx*(.7+.6*Math.abs(Math.sin(ti*3.1+fi))),
        tz:f.tz*(.7+.6*Math.abs(Math.cos(ti*2.3+fi))),thin:fi>0});});
      LF.forEach(function(c,ci){
        const a=t.spin+ci*2.39, j=Math.abs(Math.sin(ti*1.7+ci*3.3));
        LP.push({t:ti,ox:Math.cos(a)*c.rho*.88*(.85+.3*j),
          oz:Math.sin(a)*c.rho*.88*(.85+.3*j),
          oy:c.oy+(j-.5)*.05,r:c.r*(.86+.3*j),ph:a,d:c.d});
      });
    });

    function leafTex(){
      const cv=document.createElement('canvas'); cv.width=cv.height=128;
      const g=cv.getContext('2d');
      for(let i=0;i<150;i++){
        const a=Math.random()*Math.PI*2, rr=Math.pow(Math.random(),.52)*58;
        const x=64+Math.cos(a)*rr, y=64+Math.sin(a)*rr*.94, s=2.2+Math.random()*4.4;
        const v=Math.round(200+Math.random()*55);   // цайвар — өнгийг instance color өгнө
        g.fillStyle='rgba('+v+','+v+','+v+','+(.78+Math.random()*.22)+')';
        g.beginPath(); g.ellipse(x,y,s,s*.66,Math.random()*3.14,0,6.283); g.fill();
      }
      const tx=new THREE.CanvasTexture(cv); tx.encoding=THREE.sRGBEncoding;
      tx.anisotropy=rend.capabilities.getMaxAnisotropy(); return tx;
    }
    const tg=new THREE.CylinderGeometry(.55,1,1,5); tg.translate(0,.5,0);
    const trunkIM=new THREE.InstancedMesh(tg,
      new THREE.MeshStandardMaterial({color:0xFFFFFF,roughness:.95}),TP.length);
    const leafIM=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),
      new THREE.MeshStandardMaterial({map:leafTex(),alphaTest:.42,
        side:THREE.DoubleSide,roughness:.92}),LP.length);
    trunkIM.castShadow=true; leafIM.castShadow=true; leafIM.receiveShadow=true;
    scene.add(trunkIM); scene.add(leafIM);
    /* Тарилтын нүх: суулгац бага байхад мод өөрөө элснээс ялгарахгүй тул хэлбэрийг
       ухсан нүх нь барина. Дотор нь бараан, ирмэг дээрээ овоолсон шороо — газарт
       нүх ухсан мэт уншигдана. Титэм дэлгэрэх тусам далдарна. */
    const pitG=new THREE.CircleGeometry(1,10); pitG.rotateX(-Math.PI/2);
    const pitIM=new THREE.InstancedMesh(pitG,
      new THREE.MeshBasicMaterial({color:SCp('#4A3A22'),transparent:true,opacity:0}),TR.length);
    const rimG=new THREE.RingGeometry(1,1.42,10); rimG.rotateX(-Math.PI/2);
    const rimIM=new THREE.InstancedMesh(rimG,
      new THREE.MeshBasicMaterial({color:SCp('#A98C63'),transparent:true,opacity:0}),TR.length);
    pitIM.frustumCulled=false; rimIM.frustumCulled=false;
    scene.add(pitIM); scene.add(rimIM);
    (function(){
      const m=new THREE.Object3D();
      TR.forEach(function(t,i){
        m.position.set(t.x,.03,t.z); m.scale.setScalar(.15); m.updateMatrix();
        pitIM.setMatrixAt(i,m.matrix);
        m.position.y=.02; m.updateMatrix(); rimIM.setMatrixAt(i,m.matrix);
      });
      pitIM.instanceMatrix.needsUpdate=true; rimIM.instanceMatrix.needsUpdate=true;
    })();
    const col=new THREE.Color();
    TP.forEach(function(p,i){
      col.setHSL(.095,.12,Math.max(.16,Math.min(.62,(p.thin?.30:.46)+Math.sin(i*7.1)*.045)))
         .convertSRGBToLinear();
      trunkIM.setColorAt(i,col);
    });
    trunkIM.instanceColor.needsUpdate=true;
    function paintLeaves(){
      const S=SEASONS[season];
      LP.forEach(function(p,i){
        const sun=p.d?0:1, lift=(p.oy-.55)/.40, v=Math.sin(i*4.7), w=Math.sin(i*2.9);
        /* Ханалт, гэрэлтэлтийг HEXAGON-ы дүр зурагтай ижил түвшинд өргөв —
           энэ хэсгийн мод цөөн давхаргатай тул өмнө нь саарал харагдаж байлаа. */
        col.setHSL(((.258-.028*sun-.012*lift+v*.010+S.dh)+1)%1,
          Math.max(.05,Math.min(.66,(.38+.14*sun+.05*lift+w*.035)*S.ds)),
          Math.max(.08,Math.min(.62,(.25+.20*lift+.12*sun+v*.028)*S.dl))).convertSRGBToLinear();
        leafIM.setColorAt(i,col);
      });
      leafIM.instanceColor.needsUpdate=true;
    }
    paintLeaves();

    /* ---- сэргээгдсэн хөрс: мод бүрийн доор ногоорох хучаас ---- */
    const SANDp=SCp('#CFC2A4'), GREENp=SCp('#7D9A46'), SNOWp=SCp('#E9EBEC');
    const gndMat=new THREE.MeshStandardMaterial({color:SANDp.clone(),roughness:1});
    const gndGeo=new THREE.CircleGeometry(1,12); gndGeo.rotateX(-Math.PI/2);
    const gndIM=new THREE.InstancedMesh(gndGeo,gndMat,TR.length);
    gndIM.receiveShadow=true; gndIM.frustumCulled=false; scene.add(gndIM);

    /* ---- эхлэлийн тойм: тарихаас өмнө зөвхөн хүрээ нь газарт зурагдана ----
       Тарилт эхлэхээс өмнө газар дээр юу ч ургаагүй байхад дүрс уншигдахгүй.
       Маскийн ирмэгийг олж (харанхуй цэг, гэрэлтэй хөрштэй) тунгалаг зотон дээр
       буулгаад газрын дээгүүр тавина: эхлээд зөвхөн энэ тойм харагдаж, ургалт
       эхлэхэд аажим арилж, оронд нь хучаас ногоороод, дараа нь мод өснө. */
    let outline=null;
    (function(){
      const cv=document.createElement('canvas'); cv.width=MK.W; cv.height=MK.H;
      const c=cv.getContext('2d');
      c.fillStyle='#ffffff'; c.fillRect(0,0,MK.W,MK.H);
      c.fillStyle='#000000'; c.strokeStyle='#000000'; c.lineJoin='round'; c.lineCap='round';
      SHAPES[key](c,MK.W,MK.H);
      const src=c.getImageData(0,0,MK.W,MK.H).data;
      const out=c.createImageData(MK.W,MK.H), od=out.data;
      const solid=function(x,y){
        if(x<0||y<0||x>=MK.W||y>=MK.H) return false;
        return src[(y*MK.W+x)*4]<120;
      };
      for(let y=0;y<MK.H;y++)for(let x=0;x<MK.W;x++){
        /* ирмэг = дүрсийн дотор боловч хөрш нь гадна */
        const edge = solid(x,y) && !(solid(x-1,y)&&solid(x+1,y)&&solid(x,y-1)&&solid(x,y+1));
        const i=(y*MK.W+x)*4;
        /* Газарт татсан шохойн шугам шиг цайвар — тарихаас өмнөх тэмдэглэгээ.
           Бараан өнгө өгвөл газар нь толботсон мэт харагдаж, юуг илэрхийлж
           буй нь ойлгомжгүй болно. */
        od[i]=246; od[i+1]=243; od[i+2]=228; od[i+3]=edge?225:0;
      }
      c.putImageData(out,0,0);
      const tex=new THREE.CanvasTexture(cv);
      if(THREE.SRGBColorSpace&&tex.colorSpace!==undefined) tex.colorSpace=THREE.SRGBColorSpace;
      tex.magFilter=THREE.LinearFilter;
      const pw=MK.W*MK.scale, ph=MK.H*MK.scale;
      const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0,
        depthWrite:false});
      const pl=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),mat);
      pl.rotation.x=-Math.PI/2; pl.position.y=.035; pl.renderOrder=2;
      scene.add(pl);
      outline={mesh:pl,mat:mat};
    })();

    /* ---- нэбха: модны суурьт хуримтлах элсэн товгор ---- */
    const nebGeo=new THREE.ConeGeometry(1,1,10); nebGeo.translate(0,.5,0);
    const nebIM=new THREE.InstancedMesh(nebGeo,
      new THREE.MeshStandardMaterial({color:SCp('#CBBD9C'),roughness:1}),TR.length);
    nebIM.receiveShadow=true; nebIM.frustumCulled=false; scene.add(nebIM);

    /* ---- зөөгдөх элс: талбайн гадуур урсах салхи ---- */
    const windIM=new THREE.InstancedMesh(new THREE.BoxGeometry(3.2,.09,.11),
      new THREE.MeshBasicMaterial({color:SCp('#E6DABE'),transparent:true,opacity:.55}),110);
    windIM.frustumCulled=false; scene.add(windIM);

    /* ---- говийн уугуул ургамал: заг, харгана, хатсан өвс ---- */
    const Mv={
      sax:new THREE.MeshStandardMaterial({color:SCp('#8FA45A'),roughness:.95}),
      stem:new THREE.MeshStandardMaterial({color:SCp('#CBB894'),roughness:.95}),
      dry:new THREE.MeshStandardMaterial({color:SCp('#C4A566'),roughness:.95}),
      fur:new THREE.MeshStandardMaterial({color:SCp('#C2B194'),roughness:.95}),
      fox:new THREE.MeshStandardMaterial({color:SCp('#A87A50'),roughness:.9}),
      dark:new THREE.MeshStandardMaterial({color:SCp('#454138'),roughness:.9}),
      pale:new THREE.MeshStandardMaterial({color:SCp('#F1E9D6'),roughness:.85,
        side:THREE.DoubleSide}),
      edge:new THREE.MeshStandardMaterial({color:SCp('#6E6455'),roughness:.85,
        side:THREE.DoubleSide})
    };
    const box=function(w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
      o.castShadow=true;return o;};
    const sph=function(r,m){const o=new THREE.Mesh(new THREE.SphereGeometry(r,7,6),m);
      o.castShadow=true;return o;};
    const EXT=34;
    for(let i=0;i<64;i++){
      const a=i*2.399, rr=10+((i*13)%1)*0+ (i%7)*4 + ((i*29)%17);
      const x=Math.cos(a)*rr*.9, z=Math.sin(a)*rr*.62;
      if(Math.abs(x)>EXT||Math.abs(z)>EXT*.7) continue;
      const g0=new THREE.Group(); g0.position.set(x,0,z);
      if(i%3===0){                                   // заг
        for(let k=0;k<3;k++){
          const br=box(.06,.42,.06,Mv.stem);
          br.position.set(Math.cos(k*2.1)*.10,.21,Math.sin(k*2.1)*.10);
          br.rotation.z=Math.cos(k*2.1)*.5; br.rotation.x=Math.sin(k*2.1)*.5;
          g0.add(br);
        }
        const c1=sph(.26,Mv.sax); c1.position.set(0,.52,0); g0.add(c1);
        const c2=sph(.18,Mv.sax); c2.position.set(.22,.40,.10); g0.add(c2);
      }else if(i%3===1){                             // харганы бут
        const c3=sph(.30,Mv.sax); c3.position.set(0,.22,0); g0.add(c3);
        const c4=sph(.20,Mv.sax); c4.position.set(.26,.16,.14); g0.add(c4);
      }else{                                         // хатсан өвс
        for(let k=-2;k<3;k++){
          const bl=box(.02,.34,.02,Mv.dry);
          bl.position.set(k*.06,.17,0); bl.rotation.z=k*.14; g0.add(bl);
        }
      }
      scene.add(g0);
    }

    /* ---- амьтад ---- */
    const WILD=[];
    function wing(sc,ex){
      const s=new THREE.Shape();
      s.moveTo(0,0);
      s.bezierCurveTo(.06*sc,.13*sc,(.21+ex)*sc,.19*sc,(.27+ex)*sc,.07*sc);
      s.bezierCurveTo((.30+ex)*sc,-.01*sc,.19*sc,-.03*sc,.09*sc,-.01*sc);
      s.bezierCurveTo(.02*sc,-.03*sc,-.09*sc,-.02*sc,-.13*sc,.05*sc);
      s.bezierCurveTo(-.17*sc,.13*sc,-.06*sc,.17*sc,0,.10*sc);
      s.lineTo(0,0);
      const gg=new THREE.ShapeGeometry(s,14); gg.rotateX(-Math.PI/2); return gg;
    }
    for(let i=0;i<6;i++){                             // эрвээхэй
      const g0=new THREE.Group();
      const bd=box(.13,.030,.030,Mv.dark); bd.position.set(.02,0,0); g0.add(bd);
      const mk=function(side){
        const w=new THREE.Group();
        const e=new THREE.Mesh(wing(1.06,.012),Mv.edge); e.position.y=-.004;
        w.add(e); w.add(new THREE.Mesh(wing(1,0),Mv.pale)); w.scale.z=side; return w;
      };
      const wr=mk(1), wl=mk(-1); g0.add(wr); g0.add(wl);
      g0.scale.setScalar(2.6); g0.visible=false; scene.add(g0);
      WILD.push({g:g0,type:'fly',wl:wl,wr:wr,
        cx:(((i*17)%40)-20),cz:(((i*11)%26)-13),
        r:1.4+((i*3)%5)*.5,sp:.45+((i%5)*.12),ph:i*1.1,ap:.34});
    }
    for(let i=0;i<2;i++){                             // туулай
      const g0=new THREE.Group();
      const bd=sph(.16,Mv.fur); bd.scale.set(1.15,.84,.80); bd.position.set(0,.16,0); g0.add(bd);
      const rp=sph(.13,Mv.fur); rp.position.set(-.13,.17,0); g0.add(rp);
      const hd=sph(.095,Mv.fur); hd.position.set(.20,.22,0); g0.add(hd);
      const sn=sph(.05,Mv.fur); sn.scale.set(1.4,.8,.8); sn.position.set(.27,.19,0); g0.add(sn);
      const mkEar=function(z){const eg=new THREE.BoxGeometry(.035,.22,.018); eg.translate(0,.11,0);
        const e=new THREE.Mesh(eg,Mv.fur); e.castShadow=true; e.position.set(.19,.27,z);
        g0.add(e); return e;};
      const earL=mkEar(-.045), earR=mkEar(.045);
      const tl=sph(.05,Mv.pale); tl.position.set(-.25,.20,0); g0.add(tl);
      const mkLeg=function(x,w,ht){const lg=new THREE.BoxGeometry(w,ht,w*.9); lg.translate(0,-ht/2,0);
        const l=new THREE.Mesh(lg,Mv.fur); l.castShadow=true; l.position.set(x,.15,0);
        g0.add(l); return l;};
      const legF=mkLeg(.11,.05,.13), legB=mkLeg(-.09,.07,.16);
      g0.scale.setScalar(2.2); g0.visible=false; scene.add(g0);
      WILD.push({g:g0,type:'hare',earL:earL,earR:earR,legF:legF,legB:legB,ang:i*1.7,
        cx:(((i*23)%36)-18),cz:(((i*19)%22)-11),r:1.6+i*.5,sp:.5+i*.12,ph:i*1.7,ap:.50});
    }
    for(let i=0;i<1;i++){                             // үнэг
      const g0=new THREE.Group();
      const bd=sph(.20,Mv.fox); bd.scale.set(1.75,.60,.60); bd.position.set(0,.30,0); g0.add(bd);
      const ch=sph(.15,Mv.fox); ch.position.set(.20,.30,0); g0.add(ch);
      const hd=sph(.105,Mv.fox); hd.scale.set(1.1,.92,.92); hd.position.set(.42,.35,0); g0.add(hd);
      const sn=sph(.055,Mv.fox); sn.scale.set(1.7,.75,.75); sn.position.set(.54,.32,0); g0.add(sn);
      const ns=sph(.022,Mv.dark); ns.position.set(.62,.32,0); g0.add(ns);
      const ear=function(z){const e=new THREE.Mesh(new THREE.CylinderGeometry(0,.055,.10,4),Mv.fox);
        e.castShadow=true; e.position.set(.38,.46,z); e.rotation.x=z*2.2; g0.add(e);};
      ear(-.055); ear(.055);
      const tg=new THREE.BoxGeometry(.30,.11,.11); tg.translate(-.15,0,0);
      const tail=new THREE.Mesh(tg,Mv.fox); tail.castShadow=true;
      tail.position.set(-.30,.32,0); g0.add(tail);
      const bu=sph(.085,Mv.fox); bu.scale.set(1.5,1,1); bu.position.set(-.16,0,0); tail.add(bu);
      const tp=sph(.055,Mv.pale); tp.position.set(-.29,0,0); tail.add(tp);
      const mkLeg=function(x,z){const lg=new THREE.BoxGeometry(.055,.24,.055); lg.translate(0,-.12,0);
        const l=new THREE.Mesh(lg,Mv.fox); l.castShadow=true; l.position.set(x,.26,z);
        g0.add(l); return l;};
      const legs=[mkLeg(.22,-.07),mkLeg(.22,.07),mkLeg(-.18,-.07),mkLeg(-.18,.07)];
      g0.scale.setScalar(2.2); g0.visible=false; scene.add(g0);
      WILD.push({g:g0,type:'fox',tail:tail,head:hd,legs:legs,ang:0,
        cx:-16,cz:-8,r:2.6,sp:.34,ph:0,ap:.70});
    }
    const FLOCK=[];
    for(let i=0;i<3;i++){                             // шувуу
      const bd=window.__bird3d(THREE,SCp('#454138'),.62), b=bd.g;
      b.visible=false; scene.add(b);
      FLOCK.push({b:b,wl:bd.wl,wr:bd.wr,r:14+((i*9)%18),h:9+((i*4)%6),
        sp:.13+((i%4)*.03),ph:i*1.9});
    }

    const dummy=new THREE.Object3D(), clock=new THREE.Clock();
    let beatF=0, growth=0, vis=false, capIdx=-1, plt=0, lastG=-1;

    function resize(){
      const w=host.clientWidth||sticky.clientWidth,
            hh=host.clientHeight||sticky.clientHeight;
      if(!w||!hh) return;
      cam.aspect=w/hh; cam.updateProjectionMatrix(); rend.setSize(w,hh,false); computeFit();
    }
    resize(); addEventListener('resize',resize);
    new IntersectionObserver(function(e){vis=e[0].isIntersecting;},{threshold:0}).observe(stage);
    /* Autoplay, as on the HEXAGON scene above: each land art runs itself once, the
       first time it is properly in view, so the Play button becomes a replay rather
       than the only way in. Manual control and reduced motion both opt out. */
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
      var laAuto=new IntersectionObserver(function(e){
        if(!e[0].isIntersecting || played || manual) return;
        played=true; laAuto.disconnect();
        beatF=0; target=0; applyBeat(); setPlay(true);
      },{threshold:.4});
      laAuto.observe(stage);
    }
    /* Дэлгэцийн гогцоонд зориулсан жижиг API. screen.html нь бүтээл бүрийг
       дараалан эхнээс нь тоглуулах ёстой тул played туг нь давтахад саад болно —
       replay() түүнийг тоолохгүйгээр эхнээс нь эхлүүлнэ. */
    (window.__laScenes=window.__laScenes||[]).push({
      key:key, sec:sec,
      /* PLAY_SECS-ийг залхуугаар уншина: бүртгэл нь түүний const зарлалтаас
         дээр байрлах тул шууд уншвал TDF алдаа өгч, дүр зураг бүртгэгдэхгүй. */
      secs:function(){ return PLAY_SECS; },
      replay:function(){ manual=false; played=true; beatF=0; target=0; applyBeat(); setPlay(true); },
      stop:function(){ setPlay(false); },
      done:function(){ return beatF>=B.length-1.01; }
    });
    function setCap(i){
      if(i===capIdx) return; capIdx=i; const b=B[i];
      cap.classList.add('out');
      setTimeout(function(){
        /* PLAIN дүр зурагт таймлайн байхгүй тул түүнийг заасан бичвэр ч
           байхгүй: он, үе шатны нэр, дарааллын дугаар аль нь ч гарахгүй —
           зөвхөн тайлбар. */
        cap.innerHTML='<div class="hx-caphead">'+(PLAIN?'':'<div class="yr">'+b.y+' · '+b.l+'</div>')+
          '<h3>'+(PLAIN?'':b.n+' ')+b.h+'</h3></div><div class="hx-capbody"><p>'+b.p+'</p></div>';
        cap.classList.remove('out');
      },180);
    }
    /* Дүр зураг өөрөө гүйнэ; он тус бүрийн цэг нь гар удирдлага */
    const STEP_SPEED=2.4, PLAY_SECS=14;
    /* data-loop дээр тэмдэглэсэн дүр зураг төгсгөлдөө хоёр секунд зогсоод
       эхнээсээ дахин гүйнэ — таймлайн, Play товчгүй хэсэгт зориулав. */
    const LOOP=!!stage.getAttribute('data-loop'), LOOP_HOLD=2.0;
    const PLAIN=!!stage.getAttribute('data-plain');
    let manual=false, target=0, TL=null, auto=false, played=false, holdT=0;
    function goTo(v){ setPlay(false); target=Math.max(0,Math.min(B.length-1,v)); }
    /* Өөрөө эхлэхгүй: дүр зураг сүүлийн он дээрээ буюу бэлэн үр дүн дээрээ зогсоно.
       Play дарахад эхнээс нь гүйж, дуусаад дахин сүүлийн он дээр зогсоно. */
    function setPlay(on){
      auto=on;
      if(!TL||!TL.play) return;
      TL.play.textContent='';
      TL.play.insertAdjacentHTML('beforeend','<i></i>');
      TL.play.appendChild(document.createTextNode(on?'Pause':'Play from '+B[0].y));
      TL.play.className='hx-play'+(on?' playing':'');
    }
    function applyBeat(){
      const p=beatF/(B.length-1);
      meter.style.width=(p*100)+'%';
      const i=Math.round(beatF), b=B[i];
      if(yN) yN.textContent=b.y;
      if(yL) yL.textContent=b.l;
      setCap(i);
      if(TL){
        if(!manual) TL.rng.value=beatF;
        for(let k=0;k<TL.btns.length;k++) TL.btns[k].className=(k===i?'on':'');
      }
    }
    (function(){
      const host=sec.querySelector('.hx-time');
      if(!host) return;
      let s='<div class="lb"><span>Timeline &amp; season</span>'+
            '<button type="button" class="hx-play"><i></i>Play</button></div>'+
            '<input class="tl" type="range" min="0" max="'+(B.length-1)+
            '" step="0.01" value="0"><div class="tks">';
      /* Он солигдох бүрд он, давтагдах үед үе шатны нэр — "2020 2020" гэсэн давхардал
         алдаа мэт уншигддаг. */
      for(let i=0;i<B.length;i++)
        s+='<button type="button" data-i="'+i+'">'+
           ((i>0&&B[i-1].y===B[i].y)?B[i].l:B[i].y)+'</button>';
      host.innerHTML=s+'</div>';
      const rg=host.querySelector('.tl'), bs=host.querySelectorAll('.tks button');
      TL={rng:rg,btns:bs,play:host.querySelector('.hx-play')};
      TL.play.onclick=function(){
        if(auto){ setPlay(false); return; }
        manual=false; beatF=0; target=0; applyBeat(); setPlay(true);
      };
      setPlay(false);
      rg.addEventListener('input',function(){
        setPlay(false); manual=true; beatF=parseFloat(rg.value); target=beatF; applyBeat();
      });
      for(let i=0;i<bs.length;i++) bs[i].onclick=function(){
        manual=false; goTo(parseFloat(this.getAttribute('data-i')));
      };
      let ss='<div class="ss">';
      for(let i=0;i<SEASONS.length;i++) ss+='<button type="button" data-s="'+i+'">'+SEASONS[i].n+'</button>';
      host.insertAdjacentHTML('beforeend',ss+'</div>');
      const sq=host.querySelectorAll('.ss button');
      for(let i=0;i<sq.length;i++) sq[i].onclick=function(){
        season=parseInt(this.getAttribute('data-s'),10); applySeason();
      };
    })();
    /* Скролл цаг хугацааг жолоодохгүй. Дүр зураг сүүлийн он дээрээ зогсож эхэлнэ. */
    beatF=B.length-1; target=beatF; growth=B[B.length-1].g; applyBeat();

    function applySeason(){
      const S=SEASONS[season];
      paintLeaves();
      sun.color.copy(SCp(S.sun)); sun.intensity=S.si;
      hemi.intensity=S.hemi;
      scene.fog.color.copy(SCp(S.fog));
      ground.material.color.copy(SCp('#CBBEA0')).lerp(SNOWp,S.snow*.72);
      GREENp.copy(SCp(S.grn));
      const bs=sec.querySelectorAll('.ss button');
      for(let i=0;i<bs.length;i++) bs[i].className=(i===season?'on':'');
    }
    const camS={r:fitR*B[0].f,th:B[0].th,ph:B[0].ph};
    function frame(){
      requestAnimationFrame(frame);
      if(!vis) return;
      const t=clock.getElapsedTime();
      const dt=Math.min(.05,t-plt); plt=t;

      if(holdT>0){                   // төгсгөлөө барина, дараа нь эхнээс нь
        holdT-=dt;
        if(holdT<=0){ beatF=0; target=0; applyBeat(); }
      } else if(auto){               // Play дарсны дараа гүйнэ
        beatF+=dt*(B.length-1)/PLAY_SECS;
        if(beatF>=B.length-1){
          beatF=B.length-1;
          /* Таймлайнгүй дүр зураг давтана: Play товч байхгүй тул нэг удаа
             тоглоод зогсвол хоёр дахь удаагаа үзэх арга үлдэхгүй. */
          if(LOOP) holdT=LOOP_HOLD; else setPlay(false);
        }
        target=beatF; applyBeat();
      } else if(beatF!==target){     // сонгосон он руу жигд гүйнэ
        const d=target-beatF, k=Math.min(1,dt*STEP_SPEED);
        beatF = Math.abs(d)<.004 ? target : beatF+d*k;
        applyBeat();
      }

      const i0=Math.min(B.length-1,Math.floor(beatF)),
            i1=Math.min(B.length-1,i0+1), f=beatF-i0;
      const A=B[i0],C=B[i1];
      camS.r+=((fitR*(A.f+(C.f-A.f)*f))-camS.r)*.06;
      camS.th+=((A.th+(C.th-A.th)*f)-camS.th)*.06;
      camS.ph+=((A.ph+(C.ph-A.ph)*f)-camS.ph)*.06;
      const th=camS.th;                      // тогтмол өнцөг — үсэг эргэхгүй
      cam.position.set(camS.r*Math.sin(camS.ph)*Math.cos(th),
                       camS.r*Math.cos(camS.ph)+2,
                       camS.r*Math.sin(camS.ph)*Math.sin(th));
      cam.lookAt(0,1.5,0);
      growth+=((A.g+(C.g-A.g)*f)-growth)*.08;
      /* Нүх ухагдмагц тод, титэм хаагдах тусам алга болно */
      {
        const po=Math.max(0,Math.min(1,(growth-.005)/.05))*Math.max(0,1-Math.max(0,growth-.16)/.16);
        pitIM.material.opacity=po*.95; rimIM.material.opacity=po*.7;
        pitIM.visible=rimIM.visible=po>.01;
      }

      const neb=Math.max(0,Math.min(1,(growth-.40)/.40));
      /* Тойм: ургалт эхлэхээс өмнө бүтэн, ногоо орж эхлэхэд аажим арилна */
      if(outline){
        const o=1-Math.max(0,Math.min(1,(growth-.015)/.16));
        outline.mat.opacity=o*.85;
        outline.mesh.visible=o>.01;
      }
      gndMat.color.copy(SANDp).lerp(GREENp,Math.min(1,growth*1.15));
      if(SEASONS[season].snow) gndMat.color.lerp(SNOWp,.62);
      /* Хучаас, нэбха, иш нь зөвхөн ургалтаас хамаарна — камер эргэхэд
         дахин тооцоолох шаардлагагүй. Ургалт тогтмол болмогц алгасна. */
      const grew=Math.abs(growth-lastG)>.0004; if(grew) lastG=growth;
      if(grew) TR.forEach(function(tr,i){
        const gi=Math.max(0,Math.min(1,(growth-tr.off)/(1-tr.off)));
        tr.e=gi*gi*(3-2*gi);
        /* Хучаасын радиус модны хоорондын зайнаас бага зэрэг л том байх ёстой.
           Хэт том бол үсэг хоорондын нүцгэн зурвасыг дүүргэж, бичээс уншигдахаа болино. */
        const gr=GS*(.255+.345*tr.e);
        dummy.position.set(tr.x,.02,tr.z); dummy.rotation.set(0,tr.spin,0);
        dummy.scale.set(gr,1,gr); dummy.updateMatrix(); gndIM.setMatrixAt(i,dummy.matrix);
        const e=neb*tr.e;
        const rr=Math.max(.001,.66*tr.H*e), hh2=Math.max(.001,.30*tr.H*e);
        dummy.position.set(tr.x,0,tr.z); dummy.rotation.set(0,tr.sway,0);
        dummy.scale.set(rr,hh2,rr*.84); dummy.updateMatrix(); nebIM.setMatrixAt(i,dummy.matrix);
      });
      if(grew){gndIM.instanceMatrix.needsUpdate=true; nebIM.instanceMatrix.needsUpdate=true;}
      const windOn=(1-growth*.72)*Math.max(0,Math.min(1,growth*6+.35));
      windIM.visible=windOn>.03&&!RED;
      if(windIM.visible){
        windIM.material.opacity=.6*windOn;
        const lz=maxZ+5;
        for(let i=0;i<110;i++){
          const lane=(i%2?1:-1)*(lz+((i*7)%22));
          dummy.position.set((((t*(9+(i%5)*2.5)+i*11)%(maxX*2.6))-maxX*1.3),
            1.0+((i*5)%9)*.7, lane+Math.sin(t*.5+i)*1.2);
          dummy.rotation.set(0,0,0);
          dummy.scale.set(.6+((i*3)%5)*.28,1,1);
          dummy.updateMatrix(); windIM.setMatrixAt(i,dummy.matrix);
        }
        windIM.instanceMatrix.needsUpdate=true;
      }
      if(grew) TP.forEach(function(p,i){
        const tr=TR[p.t], H=Math.max(.001,tr.H*tr.e);
        dummy.position.set(tr.x,p.oy*H,tr.z);
        dummy.rotation.set(p.tx,0,p.tz);
        dummy.scale.set(p.rad*H,p.len*H,p.rad*H);
        dummy.updateMatrix(); trunkIM.setMatrixAt(i,dummy.matrix);
      });
      // навч камер руу эргэдэг тул кадр бүрт шинэчилнэ
      LP.forEach(function(p,i){
        const tr=TR[p.t], H=Math.max(.001,tr.H*tr.e);
        const sw=RED?0:Math.sin(t*.62+tr.sway+p.ph)*.04*tr.e;
        dummy.position.set(tr.x+p.ox*H+sw,p.oy*H,tr.z+p.oz*H);
        dummy.quaternion.copy(cam.quaternion);
        // титэм нарийн — үсэг хоорондын нүцгэн зурвасыг хаахгүй
        const s=p.r*H*1.95*SEASONS[season].leaf; dummy.scale.set(s,s*.9,1);
        dummy.updateMatrix(); leafIM.setMatrixAt(i,dummy.matrix);
      });
      if(grew) trunkIM.instanceMatrix.needsUpdate=true;
      leafIM.instanceMatrix.needsUpdate=true;

      if(!RED){
        WILD.forEach(function(a){
          const sb=(a.type==='fly')?SEASONS[season].bug:(SEASONS[season].snow?.5:1);
          const on=Math.max(0,Math.min(1,(growth-a.ap)/.18))*sb;
          a.g.visible=on>.04; if(!a.g.visible) return;
          const rest=Math.sin(t*.21+a.ph*1.7)>.62?0:1;
          a.ang+=dt*a.sp*rest;
          const ang=a.ang;
          const x=a.cx+Math.cos(ang)*a.r, z=a.cz+Math.sin(ang)*a.r;
          const face=-ang-Math.PI/2;
          if(a.type==='hare'){
            const ph=t*3.2+a.ph, hop=Math.max(0,Math.sin(ph))*rest;
            a.g.position.set(x,hop*.34,z);
            a.g.rotation.set(-Math.cos(ph)*.34*rest,face,Math.sin(ph)*.09*rest);
            a.earL.rotation.x=-.22-hop*.95; a.earR.rotation.x=-.22-hop*.95;
            a.legF.rotation.x= hop*1.35; a.legB.rotation.x=-hop*1.55;
          }else if(a.type==='fox'){
            const ph=t*5.2+a.ph;
            a.g.position.set(x,Math.abs(Math.sin(ph))*.035*rest,z);
            a.g.rotation.set(0,face,0);
            for(let k=0;k<4;k++)
              a.legs[k].rotation.x=Math.sin(ph+(k%2?Math.PI:0)+(k>1?Math.PI:0))*.85*rest;
            a.tail.rotation.y=Math.sin(t*2.1+a.ph)*.45;
            a.tail.rotation.z=.20+Math.sin(t*1.6)*.10;
            a.head.rotation.y=Math.sin(t*.7+a.ph)*.35*(1-rest*.6);
          }else{
            const jx=Math.sin(t*2.7+a.ph)*Math.sin(t*1.13+a.ph*2)*.9;
            const jz=Math.cos(t*2.1+a.ph*1.4)*Math.sin(t*.83+a.ph)*.9;
            a.g.position.set(x+jx,1.0+Math.sin(t*3.4+a.ph)*.35,z+jz);
            a.g.rotation.set(Math.sin(t*2.4+a.ph)*.24,face,Math.sin(t*1.9+a.ph)*.30);
            const s0=Math.sin(t*10+a.ph);
            const fl=Math.pow(Math.abs(s0),.55)*(s0<0?-.35:1.15);
            a.wr.rotation.x=-fl; a.wl.rotation.x=fl;
          }
        });
        /* JACK'S-ийн нүдний байгууламж. HEXAGON дээр эдгээр нь ургалт
           тодорхой хэмжээнд хүрсний дараа гарч ирдэг — "байгууламж өөрөө
           амьтан татахгүй, тэжээл нь эхэлж байх ёстой" гэсэн зарчмаар.
           Энд ч мөн адил: бүрхэвч хаагдаж эхэлмэгц үүр, ус, шувууд гарна. */
        if(JCK.props){
          /* Шал ургахын хэрээр элсэн өнгөнөөс зүлгэн ногоон руу — HEXAGON
             дээр сэдэвт нүд яг ийм замаар ногоон болдог. */
          if(JCK.pad) JCK.pad.color.copy(SCp('#CFC2A4'))
                        .lerp(SCp('#7D9A46'),Math.min(1,growth*1.15));
          /* Даавуу салхинд намирна: хоёр өөр давтамжийн синусаар — нэг нь
             урт, нэг нь богино — тул хэмнэл давтагдсан мэт харагдахгүй.
             Мачтын ирмэг (x≈0) хөдөлгөөнгүй, үзүүр рүүгээ чөлөөтэй. */
          if(JCK.flag){
            const F=JCK.flag, pos=F.cloth.geometry.attributes.position,
                  arr=pos.array, b=F.base;
            for(let i=0;i<arr.length;i+=3){
              const u=b[i]/F.cw;
              arr[i+2]=Math.sin(u*6.0-t*3.1)*.10*F.cw*u
                      +Math.sin(u*2.4-t*1.7)*.05*F.cw*u;
              arr[i+1]=b[i+1]+Math.sin(u*3.2-t*2.3)*.03*F.cw*u;
            }
            pos.needsUpdate=true; F.cloth.geometry.computeVertexNormals();
          }
          const on=growth>.34;
          JCK.props.visible=on;
          /* Бүрэн хэмжээгээрээ шууд гарна — томрох хөдөлгөөнгүй.
             Өмнө нь HEXAGON-ы infra-г дуурайж .001-ээс аажим томсгож байсан
             нь энэ дүр зурагт буруу уншигдаж байв: үүр, цөөрөм газраас урган
             гарч, тэмдгийн доороос урсаж байгаа мэт харагдана. HEXAGON дээр
             энэ нь зохимжтой — тэнд камер хол, 54 нүд зэрэг ургаж байдаг тул
             нэг нүдний байгууламж томрох нь ерөнхий ургалтын нэг хэсэг болж
             ордог. Энд нүд ганцаараа, камер ойрхон тул тэр хөдөлгөөн өөрөө
             анзаарагдаж, хачирхалтай харагдана. */
          if(on) JCK.props.scale.setScalar(JCK.propScale);
          JCK.birds.forEach(function(d,i){
            d.b.visible=on; if(!on) return;
            const a=t*d.sp+d.ph;
            d.b.position.set(Math.cos(a)*d.r,d.h+Math.sin(a*2.1+i)*.16,Math.sin(a)*d.r);
            d.b.rotation.y=-a;
            const f=Math.sin(t*6.5+d.ph)*.62;
            d.wr.rotation.z=f; d.wl.rotation.z=-f;
          });
        }
        const flyOn=growth>.62;
        FLOCK.forEach(function(d,i){
          d.b.visible=flyOn; if(!flyOn) return;
          const a=t*d.sp+d.ph;
          d.b.position.set(Math.cos(a)*d.r,d.h+Math.sin(a*2.3+i)*1.3,Math.sin(a)*d.r);
          d.b.rotation.y=-a; d.b.rotation.z=Math.sin(a*2.3+i)*.22;
          const fl=Math.sin(t*3.4+d.ph)*.75;
          d.wr.rotation.z=fl; d.wl.rotation.z=-fl;
        });
      }
      rend.render(scene,cam);
    }
    requestAnimationFrame(frame);
  }

  const secs=document.querySelectorAll('#hexagon-live .hx-proj');
  if(window.__laLazy){
    window.__laBuildProj=build;
    window.__laProjs=Array.prototype.slice.call(secs);
  } else {
    for(let i=0;i<secs.length;i++) build(secs[i]);
  }
})();


