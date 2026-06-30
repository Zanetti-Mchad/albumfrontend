'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { FiLoader, FiArrowLeft } from 'react-icons/fi';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://albumbackend-production-7eed.up.railway.app/api/v1';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('token');
  if (!raw) return null;
  const token = raw.trim().replace(/^Bearer\s+/i, '');
  return token || null;
}

function clearStoredAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
}

function isTokenExpired(): boolean {
  const expiry = localStorage.getItem('tokenExpiry');
  if (!expiry) return false;
  const expiryMs = parseInt(expiry, 10);
  return !Number.isNaN(expiryMs) && Date.now() > expiryMs;
}

function parseReturnCode(data: unknown): number | undefined {
  const status = (data as { status?: { returnCode?: string | number } })?.status;
  const code = status?.returnCode;
  if (code == null) return undefined;
  return typeof code === 'string' ? parseInt(code, 10) : code;
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

export interface SavedMember {
  externalId: string;
  name: string;
  gender: Gender;
  birthYear: number | null;
  birthMonth: number | null;
  deathYear: number | null;
  birthOrder?: string | null;
  photo?: string | null;
  parentIds: string[];
  spouseIds: string[];
  childrenIds: string[];
  relationshipToRoot: string | null;
}

export interface FamilyTreePayload {
  rootId: string | null;
  memberCount: number;
  members: SavedMember[];
}

const CARD_W = 220;
const CARD_H = 88;
const SPOUSE_GAP = 40;
const MARRIAGE_GAP = 80;
const SIBLING_GAP = 60;
const GEN_GAP = 100;

/* ==================== Helpers ==================== */

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatBirthDate = (birthMonth?: number | null, birthYear?: number | null): string => {
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

function enrichMembersWithPhotos(
  members: SavedMember[],
  photoByMemberId: Map<string, string>
): SavedMember[] {
  return members.map(m => ({
    ...m,
    photo: m.photo?.trim() ? m.photo : (photoByMemberId.get(m.externalId) ?? m.photo ?? null),
  }));
}

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
        <Image src={photo} alt={name || 'Member photo'} fill className="object-cover" unoptimized />
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

interface MarriageBranch {
  spouse: Person | null;
  children: FamilyUnit[];
  width: number;
}

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

function computeMarriageWidths(marriage: MarriageBranch): number {
  const childrenWidth = marriage.children.reduce((sum, child) => sum + computeWidths(child), 0);
  const childrenGap = marriage.children.length > 1 ? (marriage.children.length - 1) * SIBLING_GAP : 0;
  const totalChildrenWidth = childrenWidth + childrenGap;
  const headWidth = marriage.spouse ? CARD_W + SPOUSE_GAP + CARD_W : CARD_W;
  marriage.width = Math.max(headWidth, totalChildrenWidth);
  return marriage.width;
}

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

/* ==================== View Page Component ==================== */

export default function FamilyTreeViewPage() {
  const router = useRouter();

  const [people, setPeople] = useState<Person[]>([]);
  const [rootId, setRootId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeName, setTreeName] = useState<string>('My Family Tree');
  const [trees, setTrees] = useState<Array<{ id: string; name: string; data: FamilyTreePayload }>>([]);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [hasSelectedTree, setHasSelectedTree] = useState(false);
  const [memberPhotoMap, setMemberPhotoMap] = useState<Map<string, string>>(new Map());

  /* ==================== Fetch Saved Tree ==================== */

  // DEMO DATA - COMMENTED OUT
  /*
  const demoTrees = useMemo(
    () => [
      {
        id: 'demo-1',
        name: 'Demo: Smith Family',
        data: {
          rootId: 'F1',
          memberCount: 5,
          members: [
            { externalId: 'F1', name: 'John Smith', gender: 'male' as Gender, birthYear: 1950, birthMonth: 3, deathYear: null, parentIds: [], spouseIds: ['S1'], childrenIds: ['P2', 'P3'], relationshipToRoot: 'Root' },
            { externalId: 'S1', name: 'Mary Smith', gender: 'female' as Gender, birthYear: 1952, birthMonth: 7, deathYear: null, parentIds: [], spouseIds: ['F1'], childrenIds: ['P2', 'P3'], relationshipToRoot: 'Wife' },
            { externalId: 'P2', name: 'James Smith', gender: 'male' as Gender, birthYear: 1975, birthMonth: 5, deathYear: null, parentIds: ['F1', 'S1'], spouseIds: [], childrenIds: [], relationshipToRoot: 'Son' },
            { externalId: 'P3', name: 'Emily Smith', gender: 'female' as Gender, birthYear: 1977, birthMonth: 11, deathYear: null, parentIds: ['F1', 'S1'], spouseIds: [], childrenIds: [], relationshipToRoot: 'Daughter' },
          ],
        },
      },
      {
        id: 'demo-2',
        name: 'Demo: Johnson Extended Family',
        data: {
          rootId: 'J1',
          memberCount: 8,
          members: [
            { externalId: 'J1', name: 'Robert Johnson', gender: 'male' as Gender, birthYear: 1940, birthMonth: 2, deathYear: 2015, parentIds: [], spouseIds: ['J2', 'J3'], childrenIds: ['J4', 'J5', 'J6'], relationshipToRoot: 'Root' },
            { externalId: 'J2', name: 'Patricia Johnson', gender: 'female' as Gender, birthYear: 1942, birthMonth: 8, deathYear: 2010, parentIds: [], spouseIds: ['J1'], childrenIds: ['J4', 'J5'], relationshipToRoot: 'Wife' },
            { externalId: 'J3', name: 'Susan Adams', gender: 'female' as Gender, birthYear: 1950, birthMonth: 1, deathYear: null, parentIds: [], spouseIds: ['J1'], childrenIds: ['J6'], relationshipToRoot: 'Wife' },
            { externalId: 'J4', name: 'David Johnson', gender: 'male' as Gender, birthYear: 1965, birthMonth: 6, deathYear: null, parentIds: ['J1', 'J2'], spouseIds: [], childrenIds: [], relationshipToRoot: 'Son' },
            { externalId: 'J5', name: 'Lisa Johnson', gender: 'female' as Gender, birthYear: 1968, birthMonth: 3, deathYear: null, parentIds: ['J1', 'J2'], spouseIds: [], childrenIds: [], relationshipToRoot: 'Daughter' },
            { externalId: 'J6', name: 'Christopher Johnson', gender: 'male' as Gender, birthYear: 1972, birthMonth: 9, deathYear: null, parentIds: ['J1', 'J3'], spouseIds: [], childrenIds: [], relationshipToRoot: 'Son' },
          ],
        },
      },
    ],
    []
  );
  */
  const demoTrees = useMemo(
    () => ([] as { id: string; name: string; data: FamilyTreePayload }[]),
    []
  );

  const loadTreeData = useCallback((treeData: FamilyTreePayload | undefined, photoMap: Map<string, string> = memberPhotoMap) => {
    if (!treeData) {
      console.error('❌ Error: treeData is undefined');
      return;
    }
    
    if (!treeData.members || treeData.members.length === 0) {
      console.error('❌ Error: treeData.members is undefined or empty', { 
        treeData,
        memberCount: treeData.memberCount,
        rootId: treeData.rootId,
        hasMembers: !!treeData.members,
        membersLength: treeData.members?.length || 0
      });
      alert('⚠️ This family tree has no members. Please contact support or try another tree.');
      return;
    }

    const membersWithPhotos = enrichMembersWithPhotos(treeData.members, photoMap);
    
    const convertedPeople: Person[] = membersWithPhotos.map((m: SavedMember) => ({
      id: m.externalId,
      name: m.name,
      gender: m.gender,
      birthYear: m.birthYear ?? undefined,
      birthMonth: m.birthMonth ?? undefined,
      deathYear: m.deathYear ?? undefined,
      birthOrder: m.birthOrder ?? undefined,
      photo: m.photo ?? undefined,
      parentIds: m.parentIds,
      spouseIds: m.spouseIds,
      childrenIds: m.childrenIds,
    }));

    setPeople(convertedPeople);
    setRootId(treeData.rootId);
    setSelectedId(treeData.rootId || '');
    setError(null);
  }, [memberPhotoMap]);

  useEffect(() => {
    async function fetchTreeList() {
      setIsLoading(true);
      try {
        const token = getStoredToken();
        if (!token || isTokenExpired()) {
          if (token && isTokenExpired()) clearStoredAuth();
          setTrees(demoTrees);
          setError(null);
          return;
        }

        // Fetch family member photos (tree API may not include photo field)
        const photoMap = new Map<string, string>();
        try {
          const membersRes = await fetch(`${API_BASE}/integration/family-members`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const membersData = await membersRes.json().catch(() => ({}));
          if (membersRes.ok && membersData.data?.members) {
            for (const m of membersData.data.members) {
              if (m.photo?.trim()) photoMap.set(m.id, m.photo);
            }
            setMemberPhotoMap(photoMap);
          }
        } catch (err) {
          console.error('Failed to fetch member photos:', err);
        }

        const response = await fetch(`${API_BASE}/family-tree`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        const data = await response.json().catch(() => ({}));
        const returnCodeNum = parseReturnCode(data);
        const returnMessage =
          (data as { status?: { returnMessage?: string } })?.status?.returnMessage;

        let treeList: Array<{ id: string; name: string; data: FamilyTreePayload }> = [];

        if (
          response.status === 401 ||
          response.status === 403 ||
          returnCodeNum === 401 ||
          returnCodeNum === 403
        ) {
          clearStoredAuth();
          setTrees(demoTrees);
          setError(null);
          return;
        }

        if (returnCodeNum === 200 && (data as { data?: unknown }).data) {
          const apiData = (data as {
            data: (FamilyTreePayload & { treeId?: string; name?: string }) | { trees?: (FamilyTreePayload & { treeId?: string; name?: string })[] };
          }).data;

          const toTreeItem = (tree: FamilyTreePayload & { treeId?: string; name?: string }) => ({
            id: tree.treeId || 'main-tree',
            name: tree.name || 'My Family Tree',
            data: {
              rootId: tree.rootId,
              memberCount: tree.memberCount ?? tree.members?.length ?? 0,
              members: enrichMembersWithPhotos(tree.members ?? [], photoMap),
            } satisfies FamilyTreePayload,
          });

          if ('trees' in apiData && Array.isArray(apiData.trees)) {
            // GET /family-tree — list response: { trees: [...], totalTrees }
            treeList = apiData.trees.map(toTreeItem);
          } else if ('members' in apiData && Array.isArray(apiData.members)) {
            // GET /family-tree/:treeId — single tree response
            treeList = [toTreeItem(apiData)];
          }
        } else if (returnCodeNum && returnCodeNum >= 400) {
          throw new Error(returnMessage || 'Failed to load family trees');
        }

        if (treeList.length === 0) {
          // Don't fallback to demo trees - user must be logged in
          setError('No family trees found. Log in to create or view your trees.');
          setTrees([]);
          return;
        }

        setTrees(treeList);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load family trees');
        setTrees([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTreeList();
  }, [demoTrees]);

  // Re-apply photos when member photo map loads after tree is already displayed
  useEffect(() => {
    if (memberPhotoMap.size === 0 || people.length === 0) return;
    setPeople(prev =>
      prev.map(p => {
        if (p.photo?.trim()) return p;
        const photo = memberPhotoMap.get(p.id);
        return photo ? { ...p, photo } : p;
      })
    );
  }, [memberPhotoMap, people.length]);

  const idMap = useMemo(() => {
    const m = new Map<string, Person>();
    people.forEach(p => m.set(p.id, p));
    return m;
  }, [people]);

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

  /* ==================== Loading State ==================== */

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden items-center justify-center">
        <FiLoader className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-gray-600 font-medium">Loading saved family trees...</p>
      </div>
    );
  }

  // Show tree list if no tree is selected
  if (!hasSelectedTree && trees.length > 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden">
        <div className="flex-1 flex items-start justify-center p-3 sm:p-6 pt-6 sm:pt-8">
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8 border border-gray-100">
              <div className="text-center mb-6 sm:mb-8">
                <p className="text-3xl sm:text-5xl mb-3 sm:mb-4">🌳</p>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Select a Family Tree</h1>
                <p className="text-sm sm:text-base text-gray-600">Choose a saved family tree to view its layout</p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {trees.map((tree, idx) => (
                  <button
                    key={tree.id}
                    onClick={() => {
                      if (!tree.data) {
                        console.error('⚠️ No tree data available for:', tree.name);
                        return;
                      }
                      // Validate tree has members before loading
                      if (!tree.data.members || tree.data.members.length === 0) {
                        console.error('⚠️ Tree has no members:', tree.name);
                        alert(`"${tree.name}" has no members. This tree cannot be displayed.`);
                        return;
                      }
                      setSelectedTreeId(tree.id);
                      setTreeName(tree.name);
                      loadTreeData(tree.data);
                      setHasSelectedTree(true);
                    }}
                    className="w-full text-left p-3 sm:p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group active:bg-indigo-100"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-100 rounded-lg flex items-center justify-center font-bold text-sm text-indigo-600 flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-indigo-700 truncate">{tree.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                            {tree.data.memberCount} member{tree.data.memberCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0">→</div>
                    </div>
                    {tree.id.startsWith('demo-') && (
                      // DEMO DATA COMMENTED OUT
                      null
                      // <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded text-xs font-medium text-amber-700">
                      //   📋 Demo
                      // </div>
                    )}
                  </button>
                ))}
              </div>

              {!getStoredToken() && (
                <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-800">
                    <strong>Tip:</strong> Log in to save and view your own family trees!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ==================== Error State ==================== */

  if (error) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden items-center justify-center">
        <div className="text-center max-w-md px-6">
          <p className="text-4xl mb-3">🌳</p>
          <p className="text-lg font-semibold text-gray-800 mb-2">{error}</p>
          <button
            onClick={() => router.push('/family-tree/create')}
            className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-colors"
          >
            Go to Create Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden select-none">
      <div className="flex flex-1 overflow-hidden">
        {/* ========== LEFT SIDEBAR (VIEW-ONLY, hidden on small screens) ========== */}
        <div className="hidden md:flex w-64 lg:w-72 bg-white border-r border-gray-200 overflow-y-auto flex-col shrink-0">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg">
                🌳
              </div>
              <div className="hidden lg:block">
                <h1 className="font-bold text-lg text-gray-900">Family Tree</h1>
                <p className="text-xs text-gray-500">View Mode</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-6 flex-1 overflow-y-auto">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Select Tree</p>
                <div className="space-y-2">
                  {trees.map((tree, idx) => (
                    <button
                      key={tree.id}
                      onClick={() => {
                        // Validate tree has members before loading
                        if (!tree.data || !tree.data.members || tree.data.members.length === 0) {
                          console.error('⚠️ Tree has no members:', tree.name);
                          alert(`"${tree.name}" has no members. This tree cannot be displayed.`);
                          return;
                        }
                        setSelectedTreeId(tree.id);
                        setTreeName(tree.name);
                        loadTreeData(tree.data);
                        setHasSelectedTree(true);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                        selectedTreeId === tree.id
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                        selectedTreeId === tree.id
                          ? 'bg-indigo-200 text-indigo-900'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{tree.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{tree.data.memberCount} members</p>
                        {tree.id.startsWith('demo-') && (
                          // DEMO DATA COMMENTED OUT
                          null
                          // <p className="text-[10px] text-amber-600 mt-1">📋 Demo Data</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
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

            {/* Selected Member Info */}
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

                {/* Birth / Death Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Born:</span>
                    <span className="font-medium text-gray-800">
                      {formatBirthDate(selected.birthMonth, selected.birthYear)}
                    </span>
                  </div>
                  {selected.deathYear && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Died:</span>
                      <span className="font-medium text-gray-800">{selected.deathYear}</span>
                    </div>
                  )}
                </div>

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
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => setSelectedId(child.id)}
                          className="w-full flex items-center gap-2 text-sm text-gray-700 hover:bg-white rounded-lg px-2 py-1.5 transition-colors text-left"
                        >
                          <span className="text-blue-500 text-xs">👤</span>
                          <span className="truncate flex-1">{child.name}</span>
                          {relationshipTags.get(child.id) && (
                            <span className="text-[10px] font-semibold text-indigo-600 uppercase shrink-0">
                              {relationshipTags.get(child.id)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200 text-center">
                <p className="text-sm text-gray-600">Click a member on the tree to view details</p>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-gray-100">
            <div className="bg-indigo-50 rounded-xl p-3 flex gap-2">
              <span className="text-indigo-500 text-lg shrink-0 hidden sm:block">💡</span>
              <p className="text-xs text-indigo-800 leading-relaxed">
                <strong>Tip:</strong> Click members to view details. Zoom and pan to explore.
              </p>
            </div>
          </div>
        </div>

        {/* ========== MAIN CANVAS ========== */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between shadow-sm z-20 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => {
                  setHasSelectedTree(false);
                  setPeople([]);
                  setRootId(null);
                }}
                className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                <FiArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate">{treeName}</h2>
                <p className="text-xs text-gray-500">{people.length} Members</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button onClick={fitToScreen} className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <span>⛶</span>
              </button>
              <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                <button onClick={() => setZoom(Math.max(40, zoom - 10))} className="px-2 sm:px-3 py-1 hover:bg-gray-50 text-gray-700 font-bold transition-colors text-sm">−</button>
                <span className="w-8 sm:w-12 text-center text-xs font-mono font-bold text-gray-600">{zoom}%</span>
                <button onClick={() => setZoom(Math.min(150, zoom + 10))} className="px-2 sm:px-3 py-1 hover:bg-gray-50 text-gray-700 font-bold transition-colors text-sm">+</button>
              </div>
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
                      <p className="text-base font-semibold text-gray-700">No family tree data</p>
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
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-2 bg-white border border-gray-200 rounded-xl shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 text-xs sm:text-sm">
            <button className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isPanning ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'}`}>
              ✋
            </button>
            <div className="w-px h-4 bg-gray-200"></div>
            <span className="text-xs text-gray-500 px-1 hidden sm:inline">Drag to pan • Ctrl+Scroll to zoom</span>
            <span className="text-xs text-gray-500 px-1 sm:hidden">Drag • Ctrl+Scroll</span>
          </div>

          {/* Mini Map - hidden on small screens */}
          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 hidden sm:block">
            <MiniMap
              nodes={layoutNodes}
              connectors={connectorLines}
              selectedId={selectedId}
              people={people}
            />
          </div>
        </div>
      </div>
    </div>
  );
}