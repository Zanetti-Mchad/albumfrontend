'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { FiLoader } from 'react-icons/fi';
import Image from 'next/image';
import DialogBox from '@/components/dialogbox';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://albumbackend-production-7eed.up.railway.app/api/v1';

interface ExistingMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  relationship?: string;
  dateOfBirth?: string;
  birthOrder?: string;
}

export type Gender = 'male' | 'female';

export interface Person {
  id: string;
  name: string;
  gender: Gender;
  birthYear?: number;
  birthMonth?: number;
  deathYear?: number;
  birthOrder?: string;
  photo?: string;
  parentIds: string[];
  spouseIds: string[];
  childrenIds: string[];
}

const CARD_W = 220;
const CARD_H = 88;
const SPOUSE_GAP = 40;   // gap between spouses in a couple row
const MARRIAGE_GAP = 80; // gap between marriage branches (each wife + her children)
const SIBLING_GAP = 60;  // gap between siblings (family units)
const GEN_GAP = 100;     // vertical gap between generations

/* ==================== Helpers ==================== */

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Extract birth year/month from an ISO date string (e.g. "1990-04-15T00:00:00Z")
const parseDateOfBirth = (
  iso?: string
): { birthYear?: number; birthMonth?: number } => {
  if (!iso) return {};
  const d = new Date(iso);
  if (isNaN(d.getTime())) return {};
  return { birthYear: d.getFullYear(), birthMonth: d.getMonth() + 1 };
};

const formatBirthDate = (birthMonth?: number, birthYear?: number): string => {
  if (birthYear == null && birthMonth == null) return '????';
  const monthPart =
    birthMonth != null && birthMonth >= 1 && birthMonth <= 12
      ? `${MONTH_LABELS[birthMonth - 1]} `
      : '';
  const yearPart = birthYear != null ? String(birthYear) : '????';
  return `${monthPart}${yearPart}`.trim();
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// Blood-only relationship of `person` to `focal` (no in-laws). Returns null if not a blood relative.
function getBloodRelationship(
  person: Person,
  focal: Person,
  idMap: Map<string, Person>
): string | null {
  if (focal.parentIds.includes(person.id)) {
    return person.gender === 'male' ? 'Father' : 'Mother';
  }

  if (focal.childrenIds.includes(person.id)) {
    return person.gender === 'male' ? 'Son' : 'Daughter';
  }

  const focalParentSet = new Set(focal.parentIds);
  if (person.parentIds.some(id => focalParentSet.has(id))) {
    return person.gender === 'male' ? 'Brother' : 'Sister';
  }

  for (const childId of focal.childrenIds) {
    const child = idMap.get(childId);
    if (child?.childrenIds.includes(person.id)) {
      return person.gender === 'male' ? 'Grandson' : 'Granddaughter';
    }
  }

  for (const parentId of focal.parentIds) {
    const parent = idMap.get(parentId);
    if (parent?.parentIds.includes(person.id)) {
      return person.gender === 'male' ? 'Grandfather' : 'Grandmother';
    }
  }

  return null;
}

function getRelationshipLabel(
  person: Person,
  focal: Person,
  idMap: Map<string, Person>
): string | null {
  if (person.id === focal.id) return 'Root';

  if (focal.spouseIds.includes(person.id) || person.spouseIds.includes(focal.id)) {
    return person.gender === 'male' ? 'Husband' : 'Wife';
  }

  const bloodLabel = getBloodRelationship(person, focal, idMap);
  if (bloodLabel) return bloodLabel;

  // In-law detection: person is married to a blood relative of the root.
  const isMale = person.gender === 'male';
  for (const spouseId of person.spouseIds) {
    const partner = idMap.get(spouseId);
    if (!partner) continue;
    const partnerLabel = getBloodRelationship(partner, focal, idMap);
    switch (partnerLabel) {
      case 'Son':
      case 'Daughter':
        return isMale ? 'Son-in-law' : 'Daughter-in-law';
      case 'Brother':
      case 'Sister':
        return isMale ? 'Brother-in-law' : 'Sister-in-law';
      case 'Grandson':
      case 'Granddaughter':
        return isMale ? 'Grandson-in-law' : 'Granddaughter-in-law';
    }
  }

  return 'Relative';
}

/* ==================== Avatar ==================== */

const Avatar: React.FC<{ name: string; gender: Gender; size?: number; photo?: string }> = ({ name, gender, size = 40, photo }) => {
  const sizeClass = size === 40 ? 'w-10 h-10 text-xs' : 'w-8 h-8 text-[10px]';

  if (photo && photo.trim() !== '') {
    return (
      <div className={`${sizeClass} relative rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0`}>
        <Image src={photo} alt={name || 'Member photo'} fill className="object-cover" />
      </div>
    );
  }

  const bg = gender === 'male' ? 'bg-blue-100' : 'bg-rose-100';
  const text = gender === 'male' ? 'text-blue-700' : 'text-rose-700';

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold ${bg} ${text} shrink-0`}>
      {getInitials(name)}
    </div>
  );
};

/* ==================== Person Card ==================== */

const PersonCard: React.FC<{
  person: Person;
  relationshipTag?: string | null;
  style?: React.CSSProperties;
  selected?: boolean;
  onSelect?: () => void;
}> = ({ person, relationshipTag, style, selected, onSelect }) => {
  const borderColor = person.gender === 'male' ? 'border-blue-400' : 'border-rose-400';

  return (
    <div
      onClick={onSelect}
      className={`
        absolute flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 ${borderColor} bg-white
        shadow-sm hover:shadow-md cursor-pointer transition-all duration-200
        ${selected ? 'ring-2 ring-offset-2 ring-indigo-500 shadow-md' : ''}
      `}
      style={{
        ...style,
        width: CARD_W,
        height: CARD_H,
      }}
    >
      <Avatar name={person.name} gender={person.gender} photo={person.photo} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 truncate">{person.name}</p>
        {relationshipTag && (
          <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide truncate">
            {relationshipTag}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {formatBirthDate(person.birthMonth, person.birthYear)}
          {typeof person.deathYear === 'number' ? ` - ${person.deathYear}` : ''}
          {person.birthOrder && person.birthOrder !== 'N/A' ? ` · ${person.birthOrder}` : ''}
        </p>
      </div>
      <span className="text-base opacity-50">
        {person.gender === 'male' ? '♂' : '♀'}
      </span>
    </div>
  );
};

/* ==================== Layout Engine ==================== */

interface LayoutNode {
  id: string;
  x: number;
  y: number;
}

interface ConnectorLine {
  type: 'spouse' | 'parent-child';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midY?: number;
}

// A marriage branch = one spouse (optional) and their shared children
interface MarriageBranch {
  spouse: Person | null;
  children: FamilyUnit[];
  width: number;
}

// A family unit = person plus one or more marriage branches
interface FamilyUnit {
  person: Person;
  marriages: MarriageBranch[];
  width: number;
}

function getOrderedSpouses(person: Person, idMap: Map<string, Person>): Person[] {
  return person.spouseIds
    .map(id => idMap.get(id))
    .filter((p): p is Person => !!p);
}

function getChildrenForMarriage(parentA: string, parentB: string, people: Person[]): string[] {
  return people
    .filter(p => p.parentIds.includes(parentA) && p.parentIds.includes(parentB))
    .map(p => p.id);
}

function getSoloChildren(personId: string, people: Person[]): string[] {
  return people
    .filter(p => p.parentIds.length === 1 && p.parentIds[0] === personId)
    .map(p => p.id);
}

function buildFamilyUnits(people: Person[], rootId: string): FamilyUnit | null {
  const idMap = new Map<string, Person>();
  people.forEach(p => idMap.set(p.id, p));

  const visited = new Set<string>();

  function buildUnit(personId: string): FamilyUnit | null {
    if (visited.has(personId)) return null;
    visited.add(personId);

    const person = idMap.get(personId);
    if (!person) return null;

    const spouses = getOrderedSpouses(person, idMap);
    spouses.forEach(s => visited.add(s.id));

    const marriages: MarriageBranch[] = spouses.map(spouse => {
      const childIds = getChildrenForMarriage(person.id, spouse.id, people);
      const children: FamilyUnit[] = [];
      for (const childId of childIds) {
        const childUnit = buildUnit(childId);
        if (childUnit) children.push(childUnit);
      }
      return { spouse, children, width: 0 };
    });

    const soloChildIds = getSoloChildren(person.id, people);
    if (soloChildIds.length > 0) {
      const children: FamilyUnit[] = [];
      for (const childId of soloChildIds) {
        const childUnit = buildUnit(childId);
        if (childUnit) children.push(childUnit);
      }
      marriages.push({ spouse: null, children, width: 0 });
    }

    return { person, marriages, width: 0 };
  }

  return buildUnit(rootId);
}

// Compute marriage branch widths bottom-up
function computeMarriageWidths(marriage: MarriageBranch): number {
  const childrenWidth = marriage.children.reduce((sum, child) => sum + computeWidths(child), 0);
  const childrenGap = marriage.children.length > 1 ? (marriage.children.length - 1) * SIBLING_GAP : 0;
  const totalChildrenWidth = childrenWidth + childrenGap;
  const headWidth = marriage.spouse ? CARD_W + SPOUSE_GAP + CARD_W : CARD_W;
  marriage.width = Math.max(headWidth, totalChildrenWidth);
  return marriage.width;
}

// Compute subtree widths bottom-up
function computeWidths(unit: FamilyUnit | null): number {
  if (!unit) return 0;

  if (unit.marriages.length === 0) {
    unit.width = CARD_W;
    return CARD_W;
  }

  if (unit.marriages.length === 1) {
    unit.width = computeMarriageWidths(unit.marriages[0]);
    return unit.width;
  }

  const branchesWidth = unit.marriages.reduce((sum, m) => sum + computeMarriageWidths(m), 0);
  const branchesGap = (unit.marriages.length - 1) * MARRIAGE_GAP;
  unit.width = Math.max(CARD_W, branchesWidth + branchesGap);
  return unit.width;
}

function layoutChildrenRow(
  children: FamilyUnit[],
  startX: number,
  startY: number,
  unitWidth: number,
  parentMidX: number,
  nodes: LayoutNode[],
  connectors: ConnectorLine[]
): void {
  if (children.length === 0) return;

  const siblingRowY = startY + CARD_H + GEN_GAP;
  const junctionY = startY + CARD_H + GEN_GAP / 2;

  connectors.push({
    type: 'parent-child',
    x1: parentMidX,
    y1: startY + CARD_H,
    x2: parentMidX,
    y2: junctionY,
    midY: junctionY,
  });

  const childrenWidth = children.reduce((sum, c) => sum + c.width, 0);
  const childrenGap = children.length > 1 ? (children.length - 1) * SIBLING_GAP : 0;
  const totalChildrenWidth = childrenWidth + childrenGap;
  let currentX = startX + (unitWidth - totalChildrenWidth) / 2;

  const siblingCenters: number[] = [];

  children.forEach(child => {
    computePositions(child, currentX, siblingRowY, nodes, connectors);

    const childNode = nodes.find(n => n.id === child.person.id);
    if (childNode) {
      const childMidX = childNode.x + CARD_W / 2;
      siblingCenters.push(childMidX);
      connectors.push({
        type: 'parent-child',
        x1: childMidX,
        y1: childNode.y,
        x2: childMidX,
        y2: junctionY,
        midY: junctionY,
      });
    }

    currentX += child.width + SIBLING_GAP;
  });

  if (siblingCenters.length > 1) {
    connectors.push({
      type: 'parent-child',
      x1: siblingCenters[0],
      y1: junctionY,
      x2: siblingCenters[siblingCenters.length - 1],
      y2: junctionY,
      midY: junctionY,
    });
  }
}

function layoutMonogamousUnit(
  unit: FamilyUnit,
  startX: number,
  startY: number,
  nodes: LayoutNode[],
  connectors: ConnectorLine[]
): void {
  const marriage = unit.marriages[0];
  const coupleWidth = marriage.spouse ? CARD_W + SPOUSE_GAP + CARD_W : CARD_W;
  const offsetX = (unit.width - coupleWidth) / 2;
  const personX = startX + offsetX;
  const personY = startY;

  nodes.push({ id: unit.person.id, x: personX, y: personY });

  let parentMidX = personX + CARD_W / 2;

  if (marriage.spouse) {
    const spouseX = personX + CARD_W + SPOUSE_GAP;
    nodes.push({ id: marriage.spouse.id, x: spouseX, y: personY });
    parentMidX = (personX + CARD_W / 2 + spouseX + CARD_W / 2) / 2;

    connectors.push({
      type: 'spouse',
      x1: personX + CARD_W,
      y1: personY + CARD_H / 2,
      x2: spouseX,
      y2: personY + CARD_H / 2,
    });
  }

  layoutChildrenRow(marriage.children, startX, startY, unit.width, parentMidX, nodes, connectors);
}

function layoutPolygamousUnit(
  unit: FamilyUnit,
  startX: number,
  startY: number,
  nodes: LayoutNode[],
  connectors: ConnectorLine[]
): void {
  const personX = startX + (unit.width - CARD_W) / 2;
  const personY = startY;
  const personMidX = personX + CARD_W / 2;

  nodes.push({ id: unit.person.id, x: personX, y: personY });

  const marriageRowY = startY + CARD_H + GEN_GAP;
  const junctionY = startY + CARD_H + GEN_GAP / 2;

  connectors.push({
    type: 'parent-child',
    x1: personMidX,
    y1: personY + CARD_H,
    x2: personMidX,
    y2: junctionY,
    midY: junctionY,
  });

  const branchesWidth = unit.marriages.reduce((sum, m) => sum + m.width, 0);
  const branchesGap = (unit.marriages.length - 1) * MARRIAGE_GAP;
  let currentX = startX + (unit.width - (branchesWidth + branchesGap)) / 2;

  unit.marriages.forEach(marriage => {
    if (!marriage.spouse) {
      const branchMidX = currentX + marriage.width / 2;
      connectors.push({
        type: 'parent-child',
        x1: personMidX,
        y1: junctionY,
        x2: branchMidX,
        y2: junctionY,
        midY: junctionY,
      });
      layoutChildrenRow(marriage.children, currentX, marriageRowY, marriage.width, branchMidX, nodes, connectors);
    } else {
      const spouseX = currentX + (marriage.width - CARD_W) / 2;
      nodes.push({ id: marriage.spouse.id, x: spouseX, y: marriageRowY });
      const spouseMidX = spouseX + CARD_W / 2;

      connectors.push({
        type: 'spouse',
        x1: personMidX,
        y1: personY + CARD_H / 2,
        x2: spouseX,
        y2: marriageRowY + CARD_H / 2,
      });

      layoutChildrenRow(
        marriage.children,
        currentX,
        marriageRowY,
        marriage.width,
        spouseMidX,
        nodes,
        connectors
      );
    }

    currentX += marriage.width + MARRIAGE_GAP;
  });
}

// Compute positions top-down
function computePositions(
  unit: FamilyUnit | null,
  startX: number,
  startY: number,
  nodes: LayoutNode[],
  connectors: ConnectorLine[]
): void {
  if (!unit) return;

  if (unit.marriages.length === 0) {
    nodes.push({ id: unit.person.id, x: startX + (unit.width - CARD_W) / 2, y: startY });
    return;
  }

  if (unit.marriages.length === 1) {
    layoutMonogamousUnit(unit, startX, startY, nodes, connectors);
    return;
  }

  layoutPolygamousUnit(unit, startX, startY, nodes, connectors);
}

/* ==================== Connector SVG ==================== */

const TreeConnectors: React.FC<{
  lines: ConnectorLine[];
  width: number;
  height: number;
}> = ({ lines, width, height }) => {
  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width, height, zIndex: 0 }}
    >
      {lines.map((line, idx) => {
        if (line.type === 'spouse') {
          return (
            <line
              key={`spouse-${idx}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#ec4899"
              strokeWidth={2}
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          );
        }

        const midY = line.midY ?? (line.y1 + line.y2) / 2;
        return (
          <path
            key={`child-${idx}`}
            d={`M ${line.x1} ${line.y1} L ${line.x1} ${midY} L ${line.x2} ${midY} L ${line.x2} ${line.y2}`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

/* ==================== Mini Map ==================== */

const MiniMap: React.FC<{
  nodes: LayoutNode[];
  connectors: ConnectorLine[];
  selectedId: string;
  people: Person[];
}> = ({ nodes, connectors, selectedId, people }) => {
  const mapW = 180;
  const mapH = 120;

  if (nodes.length === 0) return null;

  const minX = Math.min(...nodes.map(n => n.x));
  const maxX = Math.max(...nodes.map(n => n.x)) + CARD_W;
  const minY = Math.min(...nodes.map(n => n.y));
  const maxY = Math.max(...nodes.map(n => n.y)) + CARD_H;

  const scaleX = mapW / (maxX - minX + 40);
  const scaleY = mapH / (maxY - minY + 40);
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (mapW - (maxX - minX) * scale) / 2;
  const offsetY = (mapH - (maxY - minY) * scale) / 2;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-2">
      <div className="relative" style={{ width: mapW, height: mapH }}>
        <svg width={mapW} height={mapH} className="rounded-lg bg-slate-50">
          {connectors.map((conn, idx) => {
            const sx1 = (conn.x1 - minX) * scale + offsetX;
            const sy1 = (conn.y1 - minY) * scale + offsetY;
            const sx2 = (conn.x2 - minX) * scale + offsetX;
            const sy2 = (conn.y2 - minY) * scale + offsetY;
            const isSpouse = conn.type === 'spouse';
            return (
              <line
                key={idx}
                x1={sx1}
                y1={sy1}
                x2={sx2}
                y2={sy2}
                stroke={isSpouse ? '#ec4899' : '#3b82f6'}
                strokeWidth={isSpouse ? 0.5 : 1}
                strokeDasharray={isSpouse ? '2 1' : undefined}
              />
            );
          })}
          {nodes.map((node) => {
            const person = people.find(p => p.id === node.id);
            if (!person) return null;
            const cx = (node.x - minX + CARD_W / 2) * scale + offsetX;
            const cy = (node.y - minY + CARD_H / 2) * scale + offsetY;
            const isSelected = node.id === selectedId;
            return (
              <rect
                key={node.id}
                x={cx - 6}
                y={cy - 4}
                width={12}
                height={8}
                rx={2}
                fill={person.gender === 'male' ? '#3b82f6' : '#ec4899'}
                opacity={isSelected ? 1 : 0.5}
                stroke={isSelected ? '#4f46e5' : 'none'}
                strokeWidth={isSelected ? 1 : 0}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

/* ==================== Action Button ==================== */

function ActionButton({ onClick, disabled, icon, label, color }: {
  onClick: () => void;
  disabled: boolean;
  icon: string;
  label: string;
  color: 'rose' | 'blue' | 'pink' | 'gray' | 'red';
}) {
  const colorMap = {
    rose: 'text-rose-600 hover:bg-rose-50',
    blue: 'text-blue-600 hover:bg-blue-50',
    pink: 'text-pink-600 hover:bg-pink-50',
    gray: 'text-gray-600 hover:bg-gray-100',
    red: 'text-red-600 hover:bg-red-50',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg disabled:opacity-40 disabled:hover:bg-transparent transition-colors ${colorMap[color]}`}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

/* ==================== Main Page Component ==================== */

interface TreeSnapshot {
  people: Person[];
  rootId: string | null;
  selectedId: string;
}

export default function FamilyTreePage() {
  const idCounter = useRef(0);

  const [people, setPeople] = useState<Person[]>([]);
  const [rootId, setRootId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [history, setHistory] = useState<TreeSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [treeTitle, setTreeTitle] = useState('');

  // New state for existing members and dropdown
  const [existingMembers, setExistingMembers] = useState<ExistingMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Fetch existing members on mount
  useEffect(() => {
    const fetchExistingMembers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/integration/family-members`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        if (response.ok && data.data?.members) {
          setExistingMembers(data.data.members);
        }
      } catch (err) {
        console.error('Failed to fetch existing members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchExistingMembers();
  }, []);

  const idMap = useMemo(() => {
    const m = new Map<string, Person>();
    people.forEach(p => m.set(p.id, p));
    return m;
  }, [people]);

  /* ==================== History ==================== */

  const pushHistory = useCallback((snapshot: TreeSnapshot) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, snapshot];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const applySnapshot = (snapshot: TreeSnapshot) => {
    setPeople(snapshot.people);
    setRootId(snapshot.rootId);
    setSelectedId(snapshot.selectedId);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const snapshot = history[historyIndex - 1];
      setHistoryIndex(prev => prev - 1);
      applySnapshot(snapshot);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const snapshot = history[historyIndex + 1];
      setHistoryIndex(prev => prev + 1);
      applySnapshot(snapshot);
    }
  };

  /* ==================== Sync ==================== */

  const syncRelationships = useCallback((list: Person[]): Person[] => {
    return list.map(p => ({
      ...p,
      childrenIds: p.childrenIds.filter(id => list.some(x => x.id === id)),
      parentIds: p.parentIds.filter(id => list.some(x => x.id === id)),
      spouseIds: p.spouseIds.filter(id => list.some(x => x.id === id)),
    }));
  }, []);

  const resolveChildParentIds = useCallback((selected: Person): string[] | null => {
    const isLeafSibling =
      selected.parentIds.length > 0 &&
      selected.spouseIds.length === 0 &&
      selected.childrenIds.length === 0;

    if (isLeafSibling) {
      return selected.parentIds.filter(id => idMap.has(id));
    }

    if (selected.gender === 'female') {
      const husband = selected.spouseIds.find(sid => idMap.get(sid)?.gender === 'male');
      if (husband) return [husband, selected.id];
      return [selected.id];
    }

    if (selected.gender === 'male') {
      if (selected.spouseIds.length === 0) return [selected.id];
      if (selected.spouseIds.length === 1) return [selected.id, selected.spouseIds[0]];
      return null;
    }

    return [selected.id];
  }, [idMap]);

  const canAddChild = useMemo(() => {
    if (!selectedId || people.length === 0) return false;
    const selected = idMap.get(selectedId);
    if (!selected) return false;
    return resolveChildParentIds(selected) !== null;
  }, [selectedId, people.length, idMap, resolveChildParentIds]);

  /* ==================== Actions ==================== */

  const addFirstMember = () => {
    if (people.length > 0 || !selectedMemberId) return;

    const selectedMember = existingMembers.find(m => m.id === selectedMemberId);
    if (!selectedMember) return;

    // Determine gender from relationship or default to female
    let gender: Gender = 'female';
    if (selectedMember.relationship?.toLowerCase().includes('father') || 
        selectedMember.relationship?.toLowerCase().includes('son') ||
        selectedMember.relationship?.toLowerCase().includes('brother') ||
        selectedMember.relationship?.toLowerCase().includes('uncle') ||
        selectedMember.relationship?.toLowerCase().includes('grandfather') ||
        selectedMember.relationship?.toLowerCase().includes('nephew')) {
      gender = 'male';
    }

    const id = selectedMember.id; // Use the actual member ID
    const { birthYear, birthMonth } = parseDateOfBirth(selectedMember.dateOfBirth);
    const member: Person = {
      id,
      name: selectedMember.name,
      gender,
      birthYear,
      birthMonth,
      deathYear: undefined,
      birthOrder: selectedMember.birthOrder,
      photo: selectedMember.photo,
      parentIds: [],
      childrenIds: [],
      spouseIds: [],
    };

    setPeople([member]);
    setRootId(id);
    setSelectedId(id);
    pushHistory({ people: [member], rootId: id, selectedId: id });
    setSelectedMemberId('');
    setShowRightPanel(false);
  };

  const addExistingMember = (relationship: 'spouse' | 'child', spouseRole?: 'husband' | 'wife') => {
    const selected = idMap.get(selectedId);
    if (!selected || !selectedMemberId) return;

    const selectedMember = existingMembers.find(m => m.id === selectedMemberId);
    if (!selectedMember) return;

    // Check if member already exists in the tree
    if (people.some(p => p.id === selectedMember.id)) {
      setDialogMessage('This member is already in the family tree.');
      setIsError(true);
      setShowDialog(true);
      return;
    }

    // Determine gender
    let gender: Gender = 'female';
    if (selectedMember.relationship?.toLowerCase().includes('father') || 
        selectedMember.relationship?.toLowerCase().includes('son') ||
        selectedMember.relationship?.toLowerCase().includes('brother') ||
        selectedMember.relationship?.toLowerCase().includes('uncle') ||
        selectedMember.relationship?.toLowerCase().includes('grandfather') ||
        selectedMember.relationship?.toLowerCase().includes('nephew')) {
      gender = 'male';
    }

    const { birthYear, birthMonth } = parseDateOfBirth(selectedMember.dateOfBirth);

    if (relationship === 'spouse') {
      // The new spouse's role is chosen explicitly (husband or wife).
      const spouseGender: Gender = spouseRole === 'husband' ? 'male' : 'female';
      // A couple is one male + one female, so the selected person takes the opposite role.
      const selectedRoleGender: Gender = spouseGender === 'male' ? 'female' : 'male';

      // Rule: a woman can have only ONE husband (a man may have multiple wives).
      if (spouseRole === 'husband' && selected.spouseIds.length > 0) {
        setDialogMessage('This member already has a spouse. A woman can have only one husband.');
        setIsError(true);
        setShowDialog(true);
        return;
      }

      // If the selected person's gender must flip to form a valid couple, only allow it
      // when they have no existing spouse (so we don't break an existing marriage).
      if (selected.gender !== selectedRoleGender && selected.spouseIds.length > 0) {
        setDialogMessage(
          spouseRole === 'wife'
            ? 'Only a male member can have a wife. This member already has a husband.'
            : 'This pairing conflicts with an existing marriage.'
        );
        setIsError(true);
        setShowDialog(true);
        return;
      }

      const spouse: Person = {
        id: selectedMember.id,
        name: selectedMember.name,
        gender: spouseGender,
        birthYear,
        birthMonth,
        deathYear: undefined,
        birthOrder: selectedMember.birthOrder,
        photo: selectedMember.photo,
        parentIds: [],
        childrenIds: [],
        spouseIds: [selected.id],
      };

      const updated = syncRelationships(
        people
          .map(p => {
            if (p.id === selected.id) {
              return { ...p, gender: selectedRoleGender, spouseIds: [...p.spouseIds, selectedMember.id] };
            }
            return p;
          })
          .concat(spouse)
      );

      setPeople(updated);
      pushHistory({ people: updated, rootId, selectedId: selectedMember.id });
      setSelectedId(selectedMember.id);
      setSelectedMemberId('');
      setShowLeftPanel(false);
    } else {
      // Add as child - use resolveChildParentIds to handle spouse logic
      const parentIds = resolveChildParentIds(selected);
      if (!parentIds) return;

      const newChild: Person = {
        id: selectedMember.id,
        name: selectedMember.name,
        gender,
        birthYear,
        birthMonth,
        deathYear: undefined,
        birthOrder: selectedMember.birthOrder,
        photo: selectedMember.photo,
        parentIds,
        childrenIds: [],
        spouseIds: [],
      };

      const updated = syncRelationships(
        people
          .map(p => {
            if (parentIds.includes(p.id)) {
              return { ...p, childrenIds: [...p.childrenIds, selectedMember.id] };
            }
            return p;
          })
          .concat(newChild)
      );

      setPeople(updated);
      pushHistory({ people: updated, rootId, selectedId: selectedMember.id });
      setSelectedId(selectedMember.id);
      setSelectedMemberId('');
      setShowLeftPanel(false);
    }
  };

  const deleteMember = () => {
    if (!selectedId) return;

    const remaining = syncRelationships(people.filter(p => p.id !== selectedId));
    const nextRootId = selectedId === rootId ? (remaining[0]?.id ?? null) : rootId;
    const nextSelectedId = remaining.some(p => p.id === selectedId)
      ? selectedId
      : nextRootId ?? '';

    setPeople(remaining);
    setRootId(nextRootId);
    setSelectedId(nextSelectedId);
    pushHistory({ people: remaining, rootId: nextRootId, selectedId: nextSelectedId });
  };

  const resetTree = useCallback(() => {
    setPeople([]);
    setRootId(null);
    setSelectedId('');
    setHistory([]);
    setHistoryIndex(-1);
    idCounter.current = 0;
    setTreeTitle('');
    setZoom(100);
    setPan({ x: 0, y: 0 });
  }, []);

  const submitTree = async () => {
    if (!treeTitle.trim()) {
      setDialogMessage('Please enter a title for your family tree.');
      setIsError(true);
      setShowDialog(true);
      return;
    }

    if (people.length === 0) {
      setDialogMessage('Add at least one family member before submitting.');
      setIsError(true);
      setShowDialog(true);
      return;
    }

    const token = localStorage.getItem('token')?.trim();
    if (!token) {
      setDialogMessage('Please log in to save your family tree.');
      setIsError(true);
      setShowDialog(true);
      return;
    }

    const focal = rootId ? idMap.get(rootId) : null;
    const payload = {
      name: treeTitle.trim(),
      rootId,
      memberCount: people.length,
      members: people.map(person => ({
        externalId: person.id,
        name: person.name,
        gender: person.gender,
        birthYear: person.birthYear ?? null,
        birthMonth: person.birthMonth ?? null,
        deathYear: person.deathYear ?? null,
        birthOrder: person.birthOrder ?? null,
        photo: person.photo ?? null,
        parentIds: person.parentIds,
        spouseIds: person.spouseIds,
        childrenIds: person.childrenIds,
        relationshipToRoot: focal ? getRelationshipLabel(person, focal, idMap) : null,
      })),
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/family-tree`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        setDialogMessage('Your session may have expired. Please log in again.');
        setIsError(true);
        setShowDialog(true);
        return;
      }

      const data = await response.json().catch(() => ({}));

      const returnCode = data.status?.returnCode;
      const returnCodeNum = typeof returnCode === 'string' ? parseInt(returnCode, 10) : returnCode;

      if (!response.ok || (returnCodeNum && returnCodeNum >= 400)) {
        throw new Error(data.status?.returnMessage || data.message || 'Failed to save family tree');
      }

      resetTree();
      setDialogMessage(data.status?.returnMessage || 'Family tree saved successfully!');
      setIsError(false);
      setShowDialog(true);
    } catch (error) {
      setDialogMessage(
        error instanceof Error ? error.message : 'Failed to save family tree. Please try again.'
      );
      setIsError(true);
      setShowDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ==================== Pan Handlers ==================== */

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -10 : 10;
      setZoom(prev => Math.max(40, Math.min(150, prev + delta)));
    }
  };

  const fitToScreen = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  /* ==================== Custom Layout ==================== */

  const { nodes: layoutNodes, connectors: connectorLines, canvasWidth, canvasHeight } = useMemo(() => {
    if (!rootId || people.length === 0) {
      return { nodes: [], connectors: [], canvasWidth: 800, canvasHeight: 600 };
    }

    const rootUnit = buildFamilyUnits(people, rootId);
    if (!rootUnit) return { nodes: [], connectors: [], canvasWidth: 800, canvasHeight: 600 };

    computeWidths(rootUnit);

    const nodes: LayoutNode[] = [];
    const connectors: ConnectorLine[] = [];
    computePositions(rootUnit, 40, 40, nodes, connectors);

    const maxX = Math.max(...nodes.map(n => n.x)) + CARD_W + 40;
    const maxY = Math.max(...nodes.map(n => n.y)) + CARD_H + 40;

    return { nodes, connectors, canvasWidth: maxX, canvasHeight: maxY };
  }, [people, rootId]);

  const relationshipTags = useMemo(() => {
    const tags = new Map<string, string>();
    if (!rootId) return tags;

    const focal = idMap.get(rootId);
    if (!focal) return tags;

    people.forEach(person => {
      const label = getRelationshipLabel(person, focal, idMap);
      if (label) tags.set(person.id, label);
    });

    return tags;
  }, [people, rootId, idMap]);

  const selected = selectedId ? idMap.get(selectedId) : undefined;
  const selectedSpouses = selected?.spouseIds.map(id => idMap.get(id)).filter(Boolean) as Person[] || [];
  const selectedChildren = selected?.childrenIds.map(id => idMap.get(id)).filter(Boolean) as Person[] || [];
  const manNeedsWifeForChildren =
    selected?.gender === 'male' && (selected.spouseIds.length ?? 0) > 1;

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden select-none">
      <div className="flex flex-1 overflow-hidden relative">
      {/* ========== MOBILE DRAWER BACKDROP ========== */}
      {(showLeftPanel || showRightPanel) && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => { setShowLeftPanel(false); setShowRightPanel(false); }}
        />
      )}

      {/* ========== LEFT SIDEBAR ========== */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-gray-200 overflow-y-auto flex flex-col shrink-0 transform transition-transform duration-300 lg:transform-none ${showLeftPanel ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg">
              🌳
            </div>
            <div className="flex-1">
              <h1 className="font-bold text-lg text-gray-900">Family Tree</h1>
            </div>
            <button
              onClick={() => setShowLeftPanel(false)}
              className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-gray-100 text-gray-500 text-xl leading-none"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-6 flex-1">
          {/* Tree Title */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Family Tree Title</p>
            <input
              type="text"
              value={treeTitle}
              onChange={e => setTreeTitle(e.target.value)}
              placeholder="e.g. Enter Family Tree Name"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
            />
            <p className="text-[10px] text-gray-400 mt-1.5">This name helps you identify your tree when viewing or editing.</p>
          </div>

          {/* Legend */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Legend</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-6 h-0.5 bg-blue-500 rounded"></div>
                <span>Parent - Child</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-6 h-0.5 border-t-2 border-dashed border-rose-400 rounded"></div>
                <span>Spouse</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Actions</p>
            {people.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">Select a member to start your family tree:</p>
                <select
                  value={selectedMemberId}
                  onChange={e => setSelectedMemberId(e.target.value)}
                  disabled={loadingMembers}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white disabled:bg-gray-100 transition-all"
                >
                  <option value="">
                    {loadingMembers ? 'Loading members...' : 'Select a member'}
                  </option>
                  {existingMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} {member.email ? `(${member.email})` : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addFirstMember}
                  disabled={!selectedMemberId}
                  className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 font-semibold text-sm transition-colors"
                >
                  Add as Root Member
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="mb-3">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Add Member from System
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={e => setSelectedMemberId(e.target.value)}
                    disabled={loadingMembers || !selectedId}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white disabled:bg-gray-100 transition-all"
                  >
                    <option value="">Select member to add</option>
                    {existingMembers
                      .filter(m => !people.some(p => p.id === m.id))
                      .map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                  </select>
                </div>
                <ActionButton
                  onClick={() => addExistingMember('spouse', 'wife')}
                  disabled={!selectedId || !selectedMemberId || (selected?.gender !== 'male' && (selected?.spouseIds.length ?? 0) > 0)}
                  icon="👰"
                  label="Add as Wife"
                  color="rose"
                />
                <ActionButton
                  onClick={() => addExistingMember('spouse', 'husband')}
                  disabled={!selectedId || !selectedMemberId || (selected?.spouseIds.length ?? 0) > 0}
                  icon="🤵"
                  label="Add as Husband"
                  color="pink"
                />
                <ActionButton
                  onClick={() => addExistingMember('child')}
                  disabled={!canAddChild || !selectedMemberId}
                  icon="👶"
                  label="Add as Child"
                  color="blue"
                />
                <ActionButton onClick={deleteMember} disabled={!selectedId} icon="🗑️" label="Delete Member" color="red" />
              </div>
            )}
          </div>

          {/* Selected Member */}
          {selected ? (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Selected Member</p>
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={selected.name} gender={selected.gender} photo={selected.photo} />
                <div className="overflow-hidden">
                  <p className="font-bold text-sm text-gray-900 truncate">{selected.name}</p>
                  {relationshipTags.get(selected.id) && (
                    <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">
                      {relationshipTags.get(selected.id)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 capitalize">{selected.gender}</p>
                </div>
              </div>

              {manNeedsWifeForChildren && (
                <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 mb-3">
                  Select a wife to add children to her family branch.
                </p>
              )}

              {selectedSpouses.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    {selectedSpouses.length > 1 ? `Spouses (${selectedSpouses.length})` : 'Spouse'}
                  </p>
                  <div className="space-y-1.5">
                    {selectedSpouses.map(spouse => (
                      <button
                        key={spouse.id}
                        type="button"
                        onClick={() => setSelectedId(spouse.id)}
                        className="w-full flex items-center gap-2 text-sm text-gray-700 hover:bg-white rounded-lg px-2 py-1.5 transition-colors text-left"
                      >
                        <span className="text-rose-500">💍</span>
                        <span className="truncate flex-1">{spouse.name}</span>
                        {relationshipTags.get(spouse.id) && (
                          <span className="text-[10px] font-semibold text-indigo-600 uppercase shrink-0">
                            {relationshipTags.get(spouse.id)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedChildren.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Children ({selectedChildren.length})</p>
                  <div className="space-y-1.5">
                    {selectedChildren.map(child => (
                      <div key={child.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-blue-500 text-xs">👤</span>
                        <span className="truncate">{child.name}</span>
                        {relationshipTags.get(child.id) && (
                          <span className="text-[10px] font-semibold text-indigo-600 uppercase shrink-0">
                            {relationshipTags.get(child.id)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200 text-center">
              <p className="text-sm text-gray-600">No members yet</p>
              <p className="text-xs text-gray-400 mt-1">Fill in the form on the right to add your first family member.</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100">
          <div className="bg-indigo-50 rounded-xl p-3.5 flex gap-3">
            <span className="text-indigo-500 text-lg shrink-0">💡</span>
            <p className="text-xs text-indigo-800 leading-relaxed">
              <strong>Tip:</strong> Men can have multiple wives — each wife forms her own family branch with her children. Select a wife to add sons/daughters to her branch.
            </p>
          </div>
        </div>
      </div>

      {/* ========== MAIN CANVAS ========== */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-5 py-3 flex items-center justify-between gap-2 shadow-sm z-20 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setShowLeftPanel(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 text-gray-600 text-lg leading-none shrink-0"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                {treeTitle.trim() || 'New Family Tree'}
              </h2>
              <p className="text-xs text-gray-500">{people.length} Members</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            <button onClick={fitToScreen} className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <span>⛶</span> <span className="hidden sm:inline">Fit to Screen</span>
            </button>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg">
              <button onClick={() => setZoom(Math.max(40, zoom - 10))} className="px-3 py-1.5 hover:bg-gray-50 text-gray-700 font-bold transition-colors">−</button>
              <span className="w-12 text-center text-xs font-mono font-bold text-gray-600">{zoom}%</span>
              <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="px-3 py-1.5 hover:bg-gray-50 text-gray-700 font-bold transition-colors">+</button>
            </div>
            <button onClick={undo} disabled={historyIndex <= 0} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition-colors">↶</button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition-colors">↷</button>
            {people.length === 0 && (
            <button
              onClick={() => setShowRightPanel(true)}
              disabled={!selectedMemberId}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-sm font-semibold transition-colors"
            >
              <span className="sm:hidden">+ Start</span>
              <span className="hidden sm:inline">+ Start Tree</span>
            </button>
            )}
            <button
              onClick={() => setShowRightPanel(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label={people.length === 0 ? 'Open add member form' : 'Open edit panel'}
            >
              {people.length === 0 ? '➕' : '📝'} <span className="hidden sm:inline">{people.length === 0 ? 'Add' : 'Edit'}</span>
            </button>
            <button className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">⋮</button>
          </div>
        </div>

        {/* Canvas Area */}
        <div
          className="flex-1 overflow-hidden bg-slate-50 relative cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            className="absolute"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
              transformOrigin: '0 0',
              transition: isPanning ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <div
              className="relative"
              style={{ width: canvasWidth, height: canvasHeight, minHeight: 400 }}
            >
              {people.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center max-w-sm px-6">
                    <p className="text-4xl mb-3">🌳</p>
                    <p className="text-base font-semibold text-gray-700">Your family tree is empty</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Enter a name in the panel on the right and click <strong>Add First Member</strong> to begin.
                    </p>
                  </div>
                </div>
              ) : (
                <>
              <TreeConnectors
                lines={connectorLines}
                width={canvasWidth}
                height={canvasHeight}
              />

              {layoutNodes.map((node) => {
                const person = idMap.get(node.id);
                if (!person) return null;
                return (
                  <PersonCard
                    key={node.id}
                    person={person}
                    relationshipTag={relationshipTags.get(node.id)}
                    selected={selectedId === node.id}
                    onSelect={() => setSelectedId(node.id)}
                    style={{
                      left: node.x,
                      top: node.y,
                    }}
                  />
                );
              })}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 z-20">
          <button className={`p-2 rounded-lg transition-colors ${isPanning ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}>
            ✋
          </button>
          <div className="w-px h-5 bg-gray-200"></div>
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            ⬜
          </button>
          <div className="w-px h-5 bg-gray-200"></div>
          <span className="text-xs text-gray-500 px-1">Drag to pan</span>
        </div>

        {/* Mini Map */}
        <div className="hidden sm:block absolute bottom-4 right-4 z-20">
          <MiniMap
            nodes={layoutNodes}
            connectors={connectorLines}
            selectedId={selectedId}
            people={people}
          />
        </div>
      </div>

      {/* ========== RIGHT EDIT PANEL ========== */}
      <div
        className={`fixed lg:static inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-white border-l border-gray-200 overflow-y-auto shrink-0 transform transition-transform duration-300 lg:transform-none ${showRightPanel ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-base">
              {people.length === 0 ? 'Select First Member' : 'Add Members to Tree'}
            </h3>
            <button
              onClick={() => setShowRightPanel(false)}
              className="lg:hidden p-1 -mr-1 -mt-1 rounded-lg hover:bg-gray-100 text-gray-500 text-xl leading-none shrink-0"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>
          {people.length === 0 && (
            <p className="text-xs text-gray-500 mb-5">
              Select an existing member from your system to be the root of your tree.
            </p>
          )}
          {people.length > 0 && <div className="mb-5" />}

          <div className="space-y-4">
            {people.length === 0 ? (
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Select a Member</label>
                <select
                  value={selectedMemberId}
                  onChange={e => setSelectedMemberId(e.target.value)}
                  disabled={loadingMembers}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white disabled:bg-gray-100 transition-all"
                >
                  <option value="">
                    {loadingMembers ? 'Loading members...' : 'Choose a member'}
                  </option>
                  {existingMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1.5">Members from your family members list</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Add a Member to Tree</label>
                <select
                  value={selectedMemberId}
                  onChange={e => setSelectedMemberId(e.target.value)}
                  disabled={loadingMembers || !selectedId}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white disabled:bg-gray-100 transition-all"
                >
                  <option value="">Select member to add</option>
                  {existingMembers
                    .filter(m => !people.some(p => p.id === m.id))
                    .map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1.5">Choose from available members</p>
              </div>
            )}

            {selectedMemberId && people.length > 0 && (
              <div className="pt-4 space-y-2 border-t border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add as spouse</p>
                <button
                  onClick={() => addExistingMember('spouse', 'wife')}
                  disabled={!selectedId || (selected?.gender !== 'male' && (selected?.spouseIds.length ?? 0) > 0)}
                  className="w-full px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:bg-gray-200 disabled:text-gray-400 font-semibold text-sm transition-colors"
                >
                  👰 Add as Wife
                </button>
                <button
                  onClick={() => addExistingMember('spouse', 'husband')}
                  disabled={!selectedId || (selected?.spouseIds.length ?? 0) > 0}
                  className="w-full px-4 py-2.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:bg-gray-200 disabled:text-gray-400 font-semibold text-sm transition-colors"
                >
                  🤵 Add as Husband
                </button>
                <button
                  onClick={() => addExistingMember('child')}
                  disabled={!canAddChild}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 font-semibold text-sm transition-colors"
                >
                  👶 Add as Child
                </button>
              </div>
            )}

            {people.length === 0 && (
              <div className="pt-4">
                <button
                  onClick={addFirstMember}
                  disabled={!selectedMemberId}
                  className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 font-semibold text-sm transition-colors shadow-sm"
                >
                  Add as Root Member
                </button>
              </div>
            )}
          </div>
      </div>
      </div>

      {/* ========== SUBMIT FOOTER ========== */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Save your work</p>
          <p className="text-xs text-gray-500">
            {people.length === 0
              ? 'Add a title and members, then submit to save your family tree.'
              : treeTitle.trim()
                ? `"${treeTitle.trim()}" — ${people.length} member${people.length === 1 ? '' : 's'} ready to save`
                : `${people.length} member${people.length === 1 ? '' : 's'} ready to save`}
          </p>
        </div>
        <button
          onClick={submitTree}
          disabled={isSubmitting || people.length === 0 || !treeTitle.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 font-semibold text-sm transition-colors shadow-sm w-full sm:w-auto sm:min-w-[180px] justify-center shrink-0"
        >
          {isSubmitting ? (
            <>
              <FiLoader className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Submit Family Tree'
          )}
        </button>
      </div>

      <DialogBox
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title={isError ? 'Save Failed' : 'Saved'}
        message={dialogMessage}
        type={isError ? 'error' : 'success'}
      />
    </div>
  );
}