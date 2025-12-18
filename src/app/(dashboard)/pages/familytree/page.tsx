'use client';
import React, { useMemo, useRef, useState } from 'react';
import ReactFamilyTree from 'react-family-tree';
import type { Node as RelNode, ExtNode } from 'relatives-tree/lib/types';

// Lightweight UI types for rendering
export type Gender = 'male' | 'female' | 'spouse';

export interface Person {
  id: string;
  name: string;
  gender: Gender;
  parentIds?: string[];
  spouseId?: string | null;
  childrenIds?: string[];
}

// Interactive state: start from father only
const makeId = (prefix: string, n: number) => `${prefix}${n}`;

// Simple Node renderer
const WIDTH = 110;
const HEIGHT = 54;

type RenderNode = { id: string; name: string; gender: Gender };

const Node: React.FC<{ node: RenderNode; style: React.CSSProperties; selected?: boolean; onSelect?: () => void }> = ({ node, style, selected, onSelect }) => {
  const bg = node.gender === 'male' ? '#dbeafe' : node.gender === 'female' ? '#ffe4e6' : '#f1f5f9';
  return (
    <div
      style={{
        ...style,
        width: WIDTH,
        height: HEIGHT,
        background: bg,
        border: selected ? '2px solid #2563eb' : '1px solid #cbd5e1',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        color: '#0f172a',
        boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
      }}
      onClick={onSelect}
    >
      {node.name}
    </div>
  );
};

const ROOT_ID = 'F1';

export default function FamilyTreePage() {
  const idCounter = useRef<number>(1);
  const [people, setPeople] = useState<Person[]>([
    { id: ROOT_ID, name: 'Father', gender: 'male', spouseId: null, parentIds: [], childrenIds: [] },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(ROOT_ID);
  const [inputName, setInputName] = useState<string>('');
  const [inputGender, setInputGender] = useState<Gender>('female');

  const idToPerson = useMemo(() => {
    const map = new Map<string, Person>();
    for (const p of people) map.set(p.id, p);
    return map;
  }, [people]);

  const parentIdToChildren = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of people) {
      for (const pid of p.parentIds || []) {
        const arr = m.get(pid) || [];
        arr.push(p.id);
        m.set(pid, arr);
      }
    }
    return m;
  }, [people]);

  const addSpouse = () => {
    if (!selectedId) return;
    const person = idToPerson.get(selectedId);
    if (!person) return;
    if (person.spouseId) return;
    const newId = makeId('P', ++idCounter.current);
    const spouse: Person = { id: newId, name: inputName || 'Spouse', gender: inputGender, spouseId: person.id, parentIds: [], childrenIds: [] };
    setPeople((prev) => prev.map((p) => (p.id === person.id ? { ...p, spouseId: spouse.id } : p)).concat(spouse));
    setSelectedId(newId);
    setInputName('');
  };

  const addChild = (gender: Gender) => {
    if (!selectedId) return;
    const sel = idToPerson.get(selectedId);
    if (!sel) return;
    const parentA = sel;
    const parentB = parentA.spouseId ? idToPerson.get(parentA.spouseId) || null : null;
    const newId = makeId('P', ++idCounter.current);
    const child: Person = {
      id: newId,
      name: inputName || (gender === 'male' ? 'Son' : 'Daughter'),
      gender,
      parentIds: parentB ? [parentA.id, parentB.id] : [parentA.id],
      spouseId: null,
      childrenIds: []
    };
    setPeople((prev) => {
      const updated = prev.map((p) => {
        if (p.id === parentA.id) return { ...p, childrenIds: [...(p.childrenIds || []), child.id] };
        if (parentB && p.id === parentB.id) return { ...p, childrenIds: [...(p.childrenIds || []), child.id] };
        return p;
      });
      return updated.concat(child);
    });
    setSelectedId(child.id);
    setInputName('');
  };

  const nodes: RelNode[] = useMemo(() => {
    return people.map<RelNode>((p) => {
      const parents = (p.parentIds || []).map((id) => ({ id, type: 'blood' } as const));
      const children = (p.childrenIds || []).map((id) => ({ id, type: 'blood' } as const));
      const spouses = p.spouseId ? ([{ id: p.spouseId, type: 'married' }] as const) : ([] as const);
      // Siblings: others who share any parent
      const siblingSet = new Set<string>();
      for (const pid of p.parentIds || []) {
        for (const cid of parentIdToChildren.get(pid) || []) {
          if (cid !== p.id) siblingSet.add(cid);
        }
      }
      const siblings = Array.from(siblingSet).map((id) => ({ id, type: 'blood' } as const));

      return {
        id: p.id,
        gender: (p.gender === 'male' ? 'male' : 'female') as unknown as RelNode['gender'],
        parents: parents as unknown as RelNode['parents'],
        children: children as unknown as RelNode['children'],
        siblings: siblings as unknown as RelNode['siblings'],
        spouses: spouses as unknown as RelNode['spouses'],
      } as unknown as RelNode;
    });
  }, [people, parentIdToChildren]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Family Tree</h1>
          <p className="text-gray-600">Rendered with react-family-tree</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-4 lg:col-span-3 overflow-auto" style={{ height: '75vh' }}>
            <ReactFamilyTree
              nodes={nodes}
              rootId={ROOT_ID}
              width={WIDTH}
              height={HEIGHT}
              renderNode={(extNode: ExtNode) => (
                <Node
                  key={extNode.id}
                  node={{ id: extNode.id, name: idToPerson.get(extNode.id)?.name || extNode.id, gender: (idToPerson.get(extNode.id)?.gender === 'male' ? 'male' : 'female') as Gender }}
                  style={{ position: 'absolute', transform: `translate(${extNode.left * (WIDTH / 2)}px, ${extNode.top * (HEIGHT / 2)}px)` }}
                  selected={selectedId === extNode.id}
                  onSelect={() => setSelectedId(extNode.id)}
                />
              )}
            />
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Controls</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Selected</div>
                <div className="text-sm font-medium text-gray-900">{selectedId || 'None'}</div>
                <div className="text-xs text-gray-500">{selectedId ? idToPerson.get(selectedId)?.name : ''}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Name</label>
                <input value={inputName} onChange={(e) => setInputName(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Name" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Gender</label>
                <select value={inputGender} onChange={(e) => setInputGender(e.target.value as Gender)} className="w-full border rounded px-2 py-1 text-sm">
                  <option value="male">male</option>
                  <option value="female">female</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={addSpouse} className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded px-3 py-2 disabled:opacity-50" disabled={!selectedId || !!(selectedId && idToPerson.get(selectedId!)?.spouseId)}>
                  Add Spouse to Selected
                </button>
                <button onClick={() => addChild('male')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded px-3 py-2 disabled:opacity-50" disabled={!selectedId}>
                  Add Son
                </button>
                <button onClick={() => addChild('female')} className="bg-pink-600 hover:bg-pink-700 text-white text-sm rounded px-3 py-2 disabled:opacity-50" disabled={!selectedId}>
                  Add Daughter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}