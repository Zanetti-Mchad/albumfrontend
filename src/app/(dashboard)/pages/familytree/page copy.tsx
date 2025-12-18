'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { FiUsers, FiPlus, FiX, FiUser } from 'react-icons/fi';

type MemberId = string;

interface MemberNode {
  id: MemberId;
  name: string;
  relationship: string; // Father, Mother, Son, Daughter, etc.
  parentId?: MemberId; // optional parent
  photo?: string; // data URL
}

const relationshipOptions = [
  'Father',
  'Mother',
  'Grandfather',
  'Grandmother',
  'Brother',
  'Sister',
  'Son',
  'Daughter',
  'Uncle',
  'Aunt',
  'Nephew',
  'Niece',
  'Cousin'
];

function getInitials(fullName: string) {
  if (!fullName) return 'FM';
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

export default function FamilyTreePage() {
  const [members, setMembers] = useState<MemberNode[]>([
    { id: '1', name: 'John Smith', relationship: 'Father' },
    { id: '2', name: 'Jane Smith', relationship: 'Mother' },
    { id: '3', name: 'Michael Smith', relationship: 'Son', parentId: '1' },
    { id: '4', name: 'Sarah Smith', relationship: 'Daughter', parentId: '1' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<{ name: string; relationship: string; parentId?: MemberId; photo?: string }>({
    name: '',
    relationship: '',
    parentId: undefined,
    photo: undefined,
  });

  const byParent = useMemo(() => {
    const grouped = new Map<MemberId | undefined, MemberNode[]>();
    for (const m of members) {
      const k = m.parentId;
      if (!grouped.has(k)) grouped.set(k, []);
      grouped.get(k)!.push(m);
    }
    return grouped;
  }, [members]);

  const roots = byParent.get(undefined) ?? [];

  const handlePhotoFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft((d) => ({ ...d, photo: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const addMember = () => {
    if (!draft.name || !draft.relationship) return;
    const newMember: MemberNode = {
      id: Math.random().toString(36).slice(2, 10),
      name: draft.name,
      relationship: draft.relationship,
      parentId: draft.parentId || undefined,
      photo: draft.photo,
    };
    setMembers((prev) => [...prev, newMember]);
    setDraft({ name: '', relationship: '', parentId: undefined, photo: undefined });
    setIsModalOpen(false);
  };

  const renderChildren = (parentId?: MemberId, depth = 0) => {
    const children = byParent.get(parentId) ?? [];
    if (children.length === 0) return null;
    return (
      <ul className="ml-0 md:ml-6 border-l md:border-l-2 border-gray-200 md:pl-6">
        {children.map((child) => (
          <li key={child.id} className="py-3">
            <div className="flex items-center gap-3">
              {child.photo ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100">
                  <Image src={child.photo} alt={child.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center ring-2 ring-gray-100 text-xs font-bold">
                  {getInitials(child.name)}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900">{child.name}</p>
                <p className="text-xs text-gray-500">{child.relationship}</p>
              </div>
            </div>
            {renderChildren(child.id, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <FiUsers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Family Tree</h1>
            <p className="text-gray-600">Manage members and visualize relationships</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700"
        >
          <FiPlus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {/* Tree */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        {roots.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            No members yet. Click &quot;Add Member&quot; to get started.
          </div>
        ) : (
          <div className="space-y-6">
            {roots.map((root) => (
              <div key={root.id}>
                <div className="flex items-center gap-3">
                  {root.photo ? (
                    <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-gray-100">
                      <Image src={root.photo} alt={root.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center ring-2 ring-gray-100 font-bold">
                      {getInitials(root.name)}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-bold text-gray-900">{root.name}</p>
                    <p className="text-xs text-gray-500">{root.relationship}</p>
                  </div>
                </div>
                <div className="mt-3">{renderChildren(root.id)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add member modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100"
            >
              <FiX className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Member</h2>

            <div className="flex items-center gap-4 mb-4">
              {draft.photo ? (
                <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-gray-100">
                  <Image src={draft.photo} alt={draft.name || 'Member'} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center ring-2 ring-gray-100 font-bold">
                  {getInitials(draft.name || 'Family Member')}
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 shadow-sm text-sm font-medium cursor-pointer hover:bg-gray-50">
                <FiUser className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">Choose Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoFile(e.target.files?.[0])} />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship</label>
                <select
                  value={draft.relationship}
                  onChange={(e) => setDraft((d) => ({ ...d, relationship: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                >
                  <option value="">Select relationship</option>
                  {relationshipOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Parent (optional)</label>
                <select
                  value={draft.parentId || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, parentId: e.target.value || undefined }))}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                >
                  <option value="">No parent (root)</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.relationship}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100">
                Cancel
              </button>
              <button
                onClick={addMember}
                className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow hover:shadow-lg"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}