'use client';

import { Suspense, useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import DialogBox from '@/components/dialogbox';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://albumbackend-production-7eed.up.railway.app/api/v1';

type Member = {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  relationship?: string;
  birthOrder?: string;
  dateOfBirth?: string;
  photo?: string;
  email?: string;
  phone?: string;
};

function EditMemberContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberId = searchParams.get('id');

  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning'>('success');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogMode, setDialogMode] = useState<'alert' | 'confirm'>('alert');
  const [dialogTitle, setDialogTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'N/A',
    birthOrder: 'N/A',
    dateOfBirth: '',
    photo: '',
    email: '',
    phone: ''
  });

  const handlePhotoFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, photo: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return 'FM';
    const parts = fullName.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p.charAt(0).toUpperCase()).join('');
  };

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

  const birthOrderOptions = [
    'N/A',
    '1st Born',
    '2nd Born',
    '3rd Born',
    '4th Born',
    '5th Born',
    '6th Born'
  ];

  // Load member data based on ID
  useEffect(() => {
    const fetchMember = async () => {
      if (!memberId) {
        setError('No member id provided');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        // Try show endpoint first
        const showResp = await fetch(`${API_BASE}/integration/family-members/${memberId}`, {
          headers: {
            'Authorization': `Bearer ${token || ''}`,
            'Content-Type': 'application/json'
          }
        });

        let member: Member | null = null;
        if (showResp.ok) {
          const showData = await showResp.json();
          const maybe = (showData?.data?.member || showData?.data) as Member | null | undefined;
          if (maybe) {
            member = maybe;
          }
        } else {
          // Fallback: get list and find locally
          const listResp = await fetch(`${API_BASE}/integration/family-members`, {
            headers: {
              'Authorization': `Bearer ${token || ''}`,
              'Content-Type': 'application/json'
            }
          });
          const listData = await listResp.json();
          const arr: Member[] = listData?.data?.members || [];
          member = Array.isArray(arr) ? (arr.find((m: Member) => m.id === memberId) || null) : null;
        }

        if (!member) {
          throw new Error('Member not found');
        }

        const name = member.name || [member.firstName, member.lastName].filter(Boolean).join(' ').trim();

        setFormData({
          name: name || '',
          relationship: member.relationship || 'N/A',
          birthOrder: member.birthOrder || 'N/A',
          dateOfBirth: member.dateOfBirth || '',
          photo: member.photo || '',
          email: member.email || '',
          phone: member.phone || ''
        });
      } catch (e) {
        console.error('Failed to load member', e);
        setError(e instanceof Error ? e.message : 'Failed to load member');
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [memberId]);

  const handleUpdate = async () => {
    if (!formData.name || !formData.relationship) {
      setDialogType('error');
      setDialogMessage('Please fill in all required fields');
      setDialogTitle('Error');
      setDialogMode('alert');
      setShowDialog(true);
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch(`${API_BASE}/integration/family-members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          relationship: formData.relationship,
          birthOrder: formData.birthOrder,
          dateOfBirth: formData.dateOfBirth,
          photo: formData.photo,
          email: formData.email,
          phone: formData.phone
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update member');
      }
      
      setDialogType('success');
      setDialogMessage('Member updated successfully!');
      setDialogTitle('Success!');
      setDialogMode('alert');
      setShowDialog(true);
      
      setTimeout(() => {
        router.push('/pages/users/view');
      }, 2000);
    } catch (error) {
      console.error('Update error:', error);
      setDialogType('error');
      setDialogMessage('Failed to update member. Please try again.');
      setDialogTitle('Error');
      setDialogMode('alert');
      setShowDialog(true);
    }
  };

  const handleDelete = async () => {
    // Show confirmation dialog instead of browser confirm
    setDialogType('warning');
    setDialogMessage('Are you sure you want to delete this member? This action cannot be undone.');
    setDialogTitle('Delete Member');
    setDialogMode('confirm');
    setShowDialog(true);
  };

  const confirmDelete = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch(`${API_BASE}/integration/family-members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete member');
      }
      
      setDialogType('success');
      setDialogMessage('Member deleted successfully!');
      setDialogTitle('Success!');
      setDialogMode('alert');
      setShowDialog(true);
      
      setTimeout(() => {
        router.push('/pages/users/view');
      }, 2000);
    } catch (error) {
      console.error('Delete error:', error);
      setDialogType('error');
      setDialogMessage('Failed to delete member. Please try again.');
      setDialogTitle('Error');
      setDialogMode('alert');
      setShowDialog(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Member</h1>
            <p className="text-gray-600">Update member information or remove from family tree</p>
          </div>
        </div>
      </div>

      {/* Profile Preview */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">Loading member...</div>
      ) : error ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-8 text-red-700">{error}</div>
      ) : (
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 mb-8 shadow-xl">
        <div className="flex items-center gap-6">
          {formData.photo ? (
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg">
              <Image
                src={formData.photo}
                alt={formData.name}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center ring-4 ring-white text-2xl font-bold shadow-lg">
              {getInitials(formData.name)}
            </div>
          )}
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-1">{formData.name}</h2>
            <p className="text-indigo-100">
              {formData.relationship}
              {formData.birthOrder && formData.birthOrder !== 'N/A' && ` • ${formData.birthOrder}`}
            </p>
        {(formData.email || formData.phone) && (
          <p className="text-indigo-100/90 text-sm mt-1">
            {formData.email && <span>{formData.email}</span>}
            {formData.email && formData.phone && <span className="mx-2">•</span>}
            {formData.phone && <span>{formData.phone}</span>}
          </p>
        )}
          </div>
        </div>
      </div>
      )}

      {/* Edit Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <FiEdit2 className="w-5 h-5 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">Edit Information</h2>
        </div>

        {/* Photo */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Photo</label>
          <div className="flex items-center gap-6">
            {formData.photo ? (
              <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-gray-100">
                <Image src={formData.photo} alt={formData.name || 'Member photo'} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center ring-4 ring-gray-100 text-lg font-bold">
                {getInitials(formData.name)}
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoFile(e.target.files?.[0])}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              placeholder="Enter name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Relationship *
            </label>
            <select
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
            >
              {relationshipOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Birth Order
            </label>
            <select
              value={formData.birthOrder}
              onChange={(e) => setFormData({ ...formData, birthOrder: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
            >
              {birthOrderOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FiTrash2 className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-bold text-red-700">Danger Zone</h3>
            </div>
            <p className="text-sm text-red-600">
              Permanently remove this member from your family tree. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={handleDelete}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
          >
            Delete Member
          </button>
        </div>
      </div>

      {/* Dialog */}
      <DialogBox
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title={dialogTitle}
        message={dialogMessage}
        type={dialogType}
        mode={dialogMode}
        onConfirm={dialogMode === 'confirm' ? confirmDelete : undefined}
        onCancel={dialogMode === 'confirm' ? () => setShowDialog(false) : undefined}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

export default function EditMemberPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-8">Loading...</div>}>
      <EditMemberContent />
    </Suspense>
  );
}