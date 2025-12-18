'use client';

import { useState, useEffect } from 'react';
import { FiUsers, FiUserPlus, FiEye } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://albumbackend-production-7eed.up.railway.app/api/v1';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthOrder: string;
  dateOfBirth: string;
  photo: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  createdBy?: string;
}

export default function ViewMembersPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/integration/family-members`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        console.log('Raw backend response:', data);
        if (!response.ok) {
          throw new Error((data.status && data.status.returnMessage) || 'Failed to fetch members');
        }
        const memberArr = data.data && Array.isArray(data.data.members)
          ? data.data.members
          : [];
        console.log('Extracted memberArr:', memberArr);
        setMembers(memberArr);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not load family members'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const getRelationshipColor = (relationship: string) => {
    const colors: { [key: string]: string } = {
      'Father': 'from-blue-500 to-blue-600',
      'Mother': 'from-pink-500 to-pink-600',
      'Grandfather': 'from-purple-500 to-purple-600',
      'Grandmother': 'from-purple-400 to-purple-500',
      'Brother': 'from-green-500 to-green-600',
      'Sister': 'from-yellow-500 to-yellow-600',
      'Son': 'from-cyan-500 to-cyan-600',
      'Daughter': 'from-rose-500 to-rose-600',
      'Uncle': 'from-indigo-500 to-indigo-600',
      'Aunt': 'from-pink-400 to-pink-500',
      'Nephew': 'from-teal-500 to-teal-600',
      'Niece': 'from-amber-500 to-amber-600',
      'Cousin': 'from-lime-500 to-lime-600'
    };
    return colors[relationship] || 'from-gray-500 to-gray-600';
  };

  const getAge = (isoDate: string) => {
    if (!isoDate) return '';
    const dob = new Date(isoDate);
    if (isNaN(dob.getTime())) return '';
    const today = new Date();
    if (dob > today) return '';
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? age.toString() : '';
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return 'FM';
    const parts = fullName.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p.charAt(0).toUpperCase()).join('');
  };

  if (loading) return <div>Loading family members...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <FiUsers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Family Members</h1>
            <p className="text-gray-600">View all members in your family tree</p>
          </div>
        </div>
        <Link
          href="/pages/users/create"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
        >
          <FiUserPlus className="w-5 h-5" />
          Add Member
        </Link>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 items-center px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div className="col-span-2 sm:col-span-1">#</div>
          <div className="col-span-6 sm:col-span-4">Member</div>
          <div className="hidden sm:block col-span-3">Relationship</div>
          <div className="hidden md:block col-span-3">Date of Birth</div>
          <div className="hidden lg:block col-span-2">Created</div>
          <div className="col-span-2 sm:col-span-2 md:col-span-1 text-right">Action</div>
        </div>
        <ul className="divide-y divide-gray-100">
          {members.map((member, index) => (
            <li key={member.id} className="group">
              <div className="grid grid-cols-12 items-center px-6 py-4 hover:bg-indigo-50/50 transition-colors">
                {/* # */}
                <div className="col-span-2 sm:col-span-1 text-sm font-semibold text-gray-700">{index + 1}</div>

                {/* Member info */}
                <div className="col-span-10 sm:col-span-4 flex items-center gap-4">
                  {member.photo && member.photo.trim() !== '' ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100 group-hover:ring-indigo-200 transition-all">
                      <Image src={member.photo} alt={member.name || 'Member photo'} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center ring-2 ring-gray-100 text-xs font-bold">
                      {getInitials(member.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-indigo-700">{member.name}</p>
                    <p className="text-xs text-gray-500 truncate">ID: {member.id}</p>
                    {(member.email || member.phone) && (
                      <p className="text-xs text-gray-500 truncate">
                        {member.email && <span>{member.email}</span>}
                        {member.email && member.phone && <span className="mx-1">·</span>}
                        {member.phone && <span>{member.phone}</span>}
                      </p>
                    )}
                  </div>
                </div>

                {/* Relationship */}
                <div className="hidden sm:flex col-span-3 items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium text-white bg-gradient-to-r ${getRelationshipColor(member.relationship)}`}>
                    {member.relationship}
                  </span>
                  {member.birthOrder && member.birthOrder !== 'N/A' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium text-gray-700 bg-gray-100 border border-gray-200">
                      {member.birthOrder}
                    </span>
                  )}
                </div>

                {/* DOB */}
                <div className="hidden md:flex col-span-3 flex-col">
                  <div className="text-sm text-gray-700">
                    {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : '—'}
                  </div>
                  {(() => {
                    const age = getAge(member.dateOfBirth);
                    return age ? <div className="text-xs text-gray-500">Age: {age} yrs</div> : null;
                  })()}
                </div>

                {/* Created info */}
                <div className="hidden lg:flex col-span-2 flex-col text-sm text-gray-600">
                  {'—'}
                </div>

                {/* Action */}
                <div className="col-span-12 sm:col-span-2 md:col-span-1 flex justify-end">
                  <Link
                    href={`/pages/users/edit?id=${member.id}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 transition-colors text-sm font-medium"
                  >
                    <FiEye className="w-4 h-4" />
                    Edit
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {members.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <FiUsers className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No family members yet</h3>
          <p className="text-gray-600 mb-6">Start building your family tree by adding members</p>
          <Link
            href="/pages/users/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            <FiUserPlus className="w-5 h-5" />
            Add First Member
          </Link>
        </div>
      )}
    </div>
  );
}