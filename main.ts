import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';

// A tiny raster newspaper, drawn from primitives and encoded as PNG at runtime.
const W = 900, H = 1000;
const pixels = Buffer.alloc(W * H * 4);
let clip = null;
const C = { paper:'#F4F0E6', ink:'#17232C', muted:'#46535B', red:'#C74432', blue:'#315D73', gold:'#D4A53D', pale:'#E6E0D2', white:'#FFFDF7', green:'#59765D' };
function rgba(hex) { const n=parseInt(hex.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255,255]; }
function rect(x,y,w,h,color) { x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);if(clip)clip={x:Math.round(clip.x),y:Math.round(clip.y),w:Math.round(clip.w),h:Math.round(clip.h)};const c=rgba(color), left=Math.max(0,x,clip?clip.x:0), top=Math.max(0,y,clip?clip.y:0), right=Math.min(W,x+w,clip?clip.x+clip.w:W), bottom=Math.min(H,y+h,clip?clip.y+clip.h:H); for(let yy=top;yy<bottom;yy++) for(let xx=left;xx<right;xx++){const i=(yy*W+xx)*4; pixels[i]=c[0];pixels[i+1]=c[1];pixels[i+2]=c[2];pixels[i+3]=255;} }
function line(x1,y1,x2,y2,color,thick=2) { let dx=Math.abs(x2-x1), sx=x1<x2?1:-1, dy=-Math.abs(y2-y1), sy=y1<y2?1:-1, err=dx+dy; for(;;){rect(x1-thick/2,y1-thick/2,thick,thick,color);if(x1===x2&&y1===y2)break;const e=2*err;if(e>=dy){err+=dy;x1+=sx;}if(e<=dx){err+=dx;y1+=sy;}} }
function circle(cx,cy,r,color,fill=true) { for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){const d=x*x+y*y;if(fill?d<=r*r:Math.abs(d-r*r)<r*2)rect(cx+x,cy+y,1,1,color);} }
const font={
'A':['01110','10001','10001','11111','10001','10001','10001'],'B':['11110','10001','10001','11110','10001','10001','11110'],'C':['01111','10000','10000','10000','10000','10000','01111'],'D':['11110','10001','10001','10001','10001','10001','11110'],'E':['11111','10000','10000','11110','10000','10000','11111'],'F':['11111','10000','10000','11110','10000','10000','10000'],'G':['01111','10000','10000','10111','10001','10001','01111'],'H':['10001','10001','10001','11111','10001','10001','10001'],'I':['11111','00100','00100','00100','00100','00100','11111'],'J':['00111','00010','00010','00010','10010','10010','01100'],'K':['10001','10010','10100','11000','10100','10010','10001'],'L':['10000','10000','10000','10000','10000','10000','11111'],'M':['10001','11011','10101','10101','10001','10001','10001'],'N':['10001','11001','10101','10011','10001','10001','10001'],'O':['01110','10001','10001','10001','10001','10001','01110'],'P':['11110','10001','10001','11110','10000','10000','10000'],'Q':['01110','10001','10001','10001','10101','10010','01101'],'R':['11110','10001','10001','11110','10100','10010','10001'],'S':['01111','10000','10000','01110','00001','00001','11110'],'T':['11111','00100','00100','00100','00100','00100','00100'],'U':['10001','10001','10001','10001','10001','10001','01110'],'V':['10001','10001','10001','10001','10001','01010','00100'],'W':['10001','10001','10001','10101','10101','10101','01010'],'X':['10001','10001','01010','00100','01010','10001','10001'],'Y':['10001','10001','01010','00100','00100','00100','00100'],'Z':['11111','00001','00010','00100','01000','10000','11111'],
'0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'4':['00010','00110','01010','10010','11111','00010','00010'],'5':['11111','10000','10000','11110','00001','00001','11110'],'6':['01110','10000','10000','11110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],'8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00001','01110'],'.':['00000','00000','00000','00000','00000','00110','00110'],',':['00000','00000','00000','00000','00110','00110','00100'],':':['00000','00110','00110','00000','00110','00110','00000'],'-':['00000','00000','00000','11111','00000','00000','00000'],'/':['00001','00010','00010','00100','01000','01000','10000'],'+':['00000','00100','00100','11111','00100','00100','00000'],'?':['01110','10001','00001','00010','00100','00000','00100'],'!':['00100','00100','00100','00100','00100','00000','00100'],"'":['00100','00100','00000','00000','00000','00000','00000'],' ':['00000','00000','00000','00000','00000','00000','00000']
};
function text(s,x,y,scale=2,color=C.ink,maxWidth=1000) { let cx=x; for(const ch of s.toUpperCase()){if(cx+5*scale>x+maxWidth)break;const g=font[ch]||font['?'];for(let yy=0;yy<7;yy++)for(let xx=0;xx<5;xx++)if(g[yy][xx]==='1')rect(cx+xx*scale,y+yy*scale,scale,scale,color);cx+=6*scale;} }
function wrap(s,maxChars) {const words=s.toUpperCase().split(' '),out=[];let l='';for(const w of words){if((l+' '+w).trim().length>maxChars&&l){out.push(l);l=w;}else l=(l+' '+w).trim();}if(l)out.push(l);return out;}
// Eight compact newsroom symbols, each assembled from basic geometry.
function icon(kind,x,y) { const a=C.blue,b=C.red,g=C.gold; clip={x,y,w:64,h:64};
 if(kind===0){circle(x+34,y+25,24,a,false);line(x+16,y+23,x+27,y+34,b,4);line(x+27,y+34,x+45,y+12,b,4);line(x+49,y+44,x+67,y+62,a,5);}
 if(kind===1){rect(x+10,y+10,50,43,a);rect(x+15,y+15,40,3,C.white);for(let i=0;i<4;i++)rect(x+16,y+24+i*6,31+(i%2)*9,2,C.white);circle(x+55,y+54,10,b);}
 if(kind===2){rect(x+10,y+10,46,44,C.pale);for(let i=0;i<3;i++)rect(x+15+i*14,y+30-(i%2)*5,8,15+(i%2)*5,a);line(x+12,y+47,x+23,y+39,b,3);line(x+23,y+39,x+37,y+43,b,3);line(x+37,y+43,x+52,y+24,b,3);}
 if(kind===3){line(x+8,y+56,x+66,y+56,a,4);line(x+12,y+47,x+27,y+35,a,5);line(x+27,y+35,x+40,y+43,b,5);line(x+40,y+43,x+58,y+17,b,5);circle(x+58,y+16,5,b);}
 if(kind===4){circle(x+34,y+34,27,a,false);line(x+34,y+8,x+34,y+60,b,3);line(x+8,y+34,x+60,y+34,b,3);circle(x+34,y+34,8,g);}
 if(kind===5){circle(x+17,y+25,8,a);circle(x+50,y+25,8,b);line(x+17,y+34,x+17,y+57,a,4);line(x+50,y+34,x+50,y+57,b,4);line(x+25,y+46,x+42,y+46,g,4);}
 if(kind===6){circle(x+32,y+32,23,a,false);line(x+32,y+12,x+32,y+52,b,3);line(x+12,y+32,x+52,y+32,b,3);circle(x+32,y+32,6,g);}
 if(kind===7){circle(x+34,y+34,26,a,false);line(x+10,y+34,x+58,y+34,b,3);line(x+34,y+10,x+34,y+58,b,3);line(x+16,y+20,x+52,y+48,g,4);}
 clip=null;
}
rect(0,0,W,H,C.paper);
// Masthead
rect(34,30,832,7,C.ink); text('THE WORLD / DAILY BRIEF',42,52,5,C.ink); text('WEDNESDAY 25 NOVEMBER 2026',42,94,2,C.red); text('EIGHT STORIES. ONE RESTLESS PLANET.',42,122,2,C.muted);
rect(34,153,832,3,C.ink); rect(34,162,832,3,C.ink);
const stories=[
 {title:'ABREGO GARCIA\nLEAVES FOR SPAIN',body:'VOLUNTARY DEPARTURE\nAFTER LONG US\nLEGAL FIGHT',src:'AP NEWS IN BRIEF / WTHR',kind:0},
 {title:'HUAWEI GUILTY\nON 10 COUNTS',body:'BROOKLYN JURY\nACQUITS RACKETEERING\nCHARGE',src:'AP / REUTERS',kind:1},
 {title:'US TARIFFS SET\nFOR 16 ECONOMIES',body:'CHINA, EU AND OTHERS\nIN SUBSIDIZED-OUTPUT\nPROBE',src:'AP / BLOOMBERG / WSJ',kind:2},
 {title:'YEMEN FRONT\nCLOSES ON ADEN',body:'HOUTHI ADVANCE NEARS\n60 KM; RIYADH TOWER\nSTRIKE WOUNDS 11',src:'AP / REUTERS',kind:3},
 {title:'IRAN SETS TERMS\nFOR US TALKS',body:'TEHRAN SAYS 7\nCONDITIONS FIRST; 3\nTANKERS HIT MINES',src:'AP / NEWSNATION',kind:4},
 {title:'UKRAINE: TWO\nDIPLOMATIC SIGNALS',body:'PUTIN VOWS RETALIATION;\nZELENSKYY AND MAGYAR\nHAIL A NEW ERA',src:'REUTERS / THE GUARDIAN',kind:5},
 {title:'GLACIER FLOOD\nTOLL TOPS 472',body:'NEPAL-TIBET DISASTER: over\n1,400 STILL MISSING',src:'ILKHA NEPAL FLOOD REPORT',kind:6},
 {title:'FOOD AID ROUTES\nUNDER PRESSURE',body:'WFP: 7.3 MILLION AT RISK\nAS THREE SEA LANES\nARE CHOKED BY WAR',src:'AL JAZEERA / WFP',kind:7}
];
const top=178, rowH=190, gap=12, colW=410;
stories.forEach((s,i)=>{const col=i%2,row=Math.floor(i/2),x=34+col*(colW+12),y=top+row*(rowH+gap);rect(x,y,colW,rowH,C.white);rect(x,y,6,rowH,i===0?C.red:C.blue);text(String(i+1).padStart(2,'0'),x+16,y+12,2,C.red);icon(s.kind,x+14,y+53);const tx=x+96;const titleLines=s.title.split('\n');titleLines.forEach((ln,j)=>text(ln,tx,y+17+j*22,2,C.ink,300));rect(tx,y+64,296,2,C.gold);const bodyLines=s.body.split('\n');bodyLines.forEach((ln,j)=>text(ln,tx,y+76+j*15,1,C.muted,300));rect(x+14,y+157,colW-28,1,C.pale);text(s.src,x+16,y+166,1,C.blue,colW-28);});
rect(34,986,832,2,C.ink); text('WORLD DESK  •  25 NOV 2026',42,990,1,C.muted);

function crc32(buf) { let c=0xffffffff;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0; }
function chunk(type,data) {const name=Buffer.from(type),len=Buffer.alloc(4);len.writeUInt32BE(data.length);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([len,name,data,crc]);}
const raw=Buffer.alloc((W*4+1)*H);for(let y=0;y<H;y++){const o=y*(W*4+1);raw[o]=0;pixels.copy(raw,o+1,y*W*4,(y+1)*W*4);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
const out=process.env.MAKEFUN_OUTPUT_DIR||'/output';await mkdir(out,{recursive:true});await writeFile(join(out,'entry.png'),png);
