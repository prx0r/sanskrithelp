"use client";

import { useEffect, useMemo, useState } from "react";
import { WHEEL_PRESETS, VARNA_GRID } from "@/lib/memory/brunoPresets";
import { buildStoneDoorwayExport } from "@/lib/memory/stoneDoorwayExport";
import type { PersonalBinding, WheelState } from "@/lib/memory/brunoTypes";

const KEY = "sanskrithelp:bruno:bindings:v1";

function point(cx:number, cy:number, r:number, a:number) {
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
}

function WheelSvg({ preset, selections }:{ preset:any; selections:Record<string,number> }) {
  const cx=280, cy=280;
  const maxR=245;
  const ringWidth=Math.max(34, 180 / preset.rings.length);
  return (
    <svg viewBox="0 0 560 560" className="w-full max-w-[620px] mx-auto">
      <circle cx={cx} cy={cy} r={maxR+8} fill="none" stroke="currentColor" opacity=".15" />
      {preset.rings.map((ring:any, ri:number) => {
        const r = maxR - ri*ringWidth;
        const items = ring.items;
        return (
          <g key={ring.id}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" opacity=".25" />
            <circle cx={cx} cy={cy} r={r-ringWidth+8} fill="none" stroke="currentColor" opacity=".13" />
            {items.map((item:any, i:number) => {
              const a = -Math.PI/2 + (i/items.length)*Math.PI*2;
              const p1 = point(cx,cy,r-ringWidth+8,a);
              const p2 = point(cx,cy,r,a);
              const labelP = point(cx,cy,r-ringWidth/2,a);
              const selected = (selections[ring.id] ?? 0) === i;
              return (
                <g key={item.id}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="currentColor" opacity=".16" />
                  <text x={labelP.x} y={labelP.y} textAnchor="middle" dominantBaseline="middle"
                    fontSize={selected ? 13 : 10} fontWeight={selected ? 700 : 400}
                    fill="currentColor" opacity={selected ? 1 : .55}>
                    {item.label.length > 15 ? item.label.slice(0,14)+"…" : item.label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="44" fill="currentColor" opacity=".07" />
      <text x={cx} y={cy-5} textAnchor="middle" fill="currentColor" fontSize="11" opacity=".65">BRUNO ×</text>
      <text x={cx} y={cy+13} textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700">SANSKRIT</text>
    </svg>
  );
}

export default function BrunoWheelLab() {
  const [presetId,setPresetId] = useState(WHEEL_PRESETS[0].id);
  const preset:any = useMemo(()=>WHEEL_PRESETS.find((x:any)=>x.id===presetId)!,[presetId]);
  const [selections,setSelections] = useState<Record<string,number>>({});
  const [bindings,setBindings] = useState<PersonalBinding[]>([]);
  const [primitiveId,setPrimitiveId] = useState("phoneme:ka");
  const [draft,setDraft] = useState<PersonalBinding>({primitiveId:"phoneme:ka", sourceAttested:false});

  useEffect(()=>{
    try { setBindings(JSON.parse(localStorage.getItem(KEY)||"[]")); } catch {}
  },[]);

  useEffect(()=>{ setSelections({}); },[presetId]);

  function rotate(ring:any, delta:number) {
    setSelections(s => {
      const n=ring.items.length;
      const cur=s[ring.id] ?? 0;
      return {...s,[ring.id]:(cur+delta+n)%n};
    });
  }

  const selectedItems = preset.rings.map((r:any)=>r.items[selections[r.id] ?? 0]);

  const varnaResult = useMemo(()=>{
    if (presetId!=="varna-formation") return null;
    const place = selectedItems[0]?.label;
    const manner = selectedItems[1]?.label;
    const pi = (VARNA_GRID.places as readonly string[]).indexOf(place);
    const mi = (VARNA_GRID.manners as readonly string[]).indexOf(manner);
    if (pi<0 || mi<0) return null;
    const row = (VARNA_GRID.grid as any)[place];
    return row?.[mi] ?? null;
  },[presetId, selectedItems]);

  function saveBinding() {
    const next = [...bindings.filter(x=>x.primitiveId!==primitiveId), {...draft,primitiveId,sourceAttested:false}];
    setBindings(next);
    localStorage.setItem(KEY,JSON.stringify(next));
  }

  function exportWorld() {
    const state:WheelState = {
      wheelId:presetId,
      selections,
      timestamp:new Date().toISOString(),
    };
    const world = buildStoneDoorwayExport(bindings,[state]);
    const blob = new Blob([JSON.stringify(world,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="sanskrit-memory-world.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {WHEEL_PRESETS.map((w:any)=>(
          <button key={w.id} onClick={()=>setPresetId(w.id)}
            className={`px-3 py-2 rounded-lg border text-sm ${presetId===w.id?"border-primary bg-primary/10":"border-border bg-card"}`}>
            {w.title}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-xl font-semibold">{preset.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{preset.historicalBasis}</p>
        <p className="text-sm mt-2"><strong>Constraint:</strong> {preset.rule}</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="rounded-xl border border-border bg-card p-3">
          <WheelSvg preset={preset} selections={selections}/>
        </div>

        <div className="space-y-3">
          {preset.rings.map((ring:any)=> {
            const idx=selections[ring.id]??0;
            const item=ring.items[idx];
            return (
              <div key={ring.id} className="rounded-xl border border-border bg-card p-3">
                <div className="text-xs text-muted-foreground">{ring.label}</div>
                <div className="text-lg font-semibold mt-1">{item.label}</div>
                {item.gloss && <div className="text-sm text-muted-foreground">{item.gloss}</div>}
                <div className="flex gap-2 mt-3">
                  <button className="px-3 py-1 border rounded" onClick={()=>rotate(ring,-1)}>←</button>
                  <button className="px-3 py-1 border rounded" onClick={()=>rotate(ring,1)}>→</button>
                </div>
              </div>
            )
          })}
          {varnaResult && (
            <div className="rounded-xl border border-primary bg-primary/5 p-4">
              <div className="text-xs text-muted-foreground">DETERMINISTIC RESULT</div>
              <div className="text-3xl font-semibold mt-1">{varnaResult}</div>
              <div className="text-sm text-muted-foreground">Say it. Feel the articulation. Then bind your personal colour/body/rhythm.</div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold">Personal binding</h3>
        <p className="text-sm text-muted-foreground">This is your phenomenology, not a traditional Sanskrit correspondence.</p>
        <input className="w-full border rounded bg-background p-2" value={primitiveId}
          onChange={e=>{setPrimitiveId(e.target.value);setDraft({primitiveId:e.target.value,sourceAttested:false});}}
          placeholder="phoneme:ka / dhatu:gam / operator:nic"/>
        <div className="grid sm:grid-cols-2 gap-2">
          {(["colour","emotion","bodyLocation","rhythm","tone","motion","image","notes"] as const).map(k=>(
            <input key={k} className="border rounded bg-background p-2" placeholder={k}
              value={(draft as any)[k]||""}
              onChange={e=>setDraft({...draft,[k]:e.target.value})}/>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded bg-primary text-primary-foreground" onClick={saveBinding}>Save binding</button>
          <button className="px-4 py-2 rounded border" onClick={exportWorld}>Export StoneDoorway JSON</button>
        </div>
        <div className="text-xs text-muted-foreground">{bindings.length} personal primitives stored locally.</div>
      </div>
    </div>
  );
}
