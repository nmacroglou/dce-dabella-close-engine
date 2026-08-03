const _m = new Map<string,string>();
(globalThis as any).localStorage = { getItem:(k:string)=>_m.get(k)??null, setItem:(k:string,v:string)=>{_m.set(k,String(v));}, removeItem:(k:string)=>{_m.delete(k);}, clear:()=>_m.clear(), key:()=>null, length:0 };
