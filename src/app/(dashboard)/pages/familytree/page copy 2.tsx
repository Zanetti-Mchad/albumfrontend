'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { FiUsers as Users, FiX as X } from 'react-icons/fi';

type Role = 'grandfather' | 'grandmother' | 'father' | 'mother' | 'son' | 'daughter' | 'grandson' | 'granddaughter';

interface PersonNode {
  id: string;
  name: string;
  photo: string | null;
  gender: 'male' | 'female';
  role: Role;
  spouse: PersonNode | null;
  children: PersonNode[];
  father: PersonNode | null;
  mother: PersonNode | null;
}

// --- Demo Data Setup ---
const DEMO_DATA: PersonNode = {
  id: 'root',
  name: 'John',
  photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
  gender: 'male',
  role: 'father',
  spouse: null,
  children: [],
  father: null,
  mother: null,
};

const mother: PersonNode = {
  id: 'mother-1',
  name: 'Maria',
  photo: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=100',
  gender: 'female',
  role: 'mother',
  spouse: DEMO_DATA,
  children: [],
  father: null,
  mother: null,
};

DEMO_DATA.spouse = mother;

// Children
const son1: PersonNode = {
  id: 'son-1',
  name: 'Michael',
  photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
  gender: 'male',
  role: 'son',
  spouse: null,
  children: [],
  father: DEMO_DATA,
  mother: mother,
};

const son1Spouse: PersonNode = {
  id: 'son1-spouse',
  name: 'Sophia',
  photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
  gender: 'female',
  role: 'mother',
  spouse: son1,
  children: [],
  father: null,
  mother: null,
};
son1.spouse = son1Spouse;

const son2: PersonNode = {
  id: 'son-2',
  name: 'David',
  photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
  gender: 'male',
  role: 'son',
  spouse: null,
  children: [],
  father: DEMO_DATA,
  mother: mother,
};

const daughter1: PersonNode = {
  id: 'daughter-1',
  name: 'Sarah',
  photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
  gender: 'female',
  role: 'daughter',
  spouse: null,
  children: [],
  father: DEMO_DATA,
  mother: mother,
};

const daughter1Spouse: PersonNode = {
  id: 'daughter1-spouse',
  name: 'Chris',
  photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
  gender: 'male',
  role: 'father',
  spouse: daughter1,
  children: [],
  father: null,
  mother: null,
};
daughter1.spouse = daughter1Spouse;


const daughter2: PersonNode = {
  id: 'daughter-2',
  name: 'Emily',
  photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
  gender: 'female',
  role: 'daughter',
  spouse: null,
  children: [],
  father: DEMO_DATA,
  mother: mother,
};

DEMO_DATA.children = [son1, daughter1, son2, daughter2];
mother.children = [son1, daughter1, son2, daughter2];

// Grandchildren
const grandson1: PersonNode = {
  id: 'grandson-1',
  name: 'Leo',
  photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100',
  gender: 'male',
  role: 'grandson',
  spouse: null,
  children: [],
  father: son1,
  mother: son1Spouse,
};

const granddaughter1: PersonNode = {
  id: 'granddaughter-1',
  name: 'Mia',
  photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
  gender: 'female',
  role: 'granddaughter',
  spouse: null,
  children: [],
  father: son1,
  mother: son1Spouse,
};
son1.children = [grandson1, granddaughter1];
son1Spouse.children = [grandson1, granddaughter1];

const grandson2: PersonNode = {
    id: 'grandson-2',
    name: 'Noah',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100',
    gender: 'male',
    role: 'grandson',
    spouse: null,
    children: [],
    father: daughter1Spouse,
    mother: daughter1,
};
daughter1.children = [grandson2];
daughter1Spouse.children = [grandson2];
// --- End Demo Data ---


const FamilyTree = () => {
  const [familyData, setFamilyData] = useState<PersonNode>(DEMO_DATA);
  
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; photo: string }>({ name: '', photo: '' });
  const [showAddMenu, setShowAddMenu] = useState<string | null>(null);
  

  const uniqueId = () => `${Math.random().toString(36).slice(2, 11)}-${Date.now()}`;

  const getRoleTitle = (role: Role) => {
    const titles = {
      grandfather: 'Grandfather',
      grandmother: 'Grandmother',
      father: 'Father',
      mother: 'Mother',
      son: 'Son',
      daughter: 'Daughter',
      grandson: 'Grandson',
      granddaughter: 'Granddaughter'
    };
    return titles[role] || 'Family Member';
  };

  const getGenerationLevel = (role: Role) => {
    const levels = {
      grandfather: 0,
      grandmother: 0,
      father: 1,
      mother: 1,
      son: 2,
      daughter: 2,
      grandson: 3,
      granddaughter: 3
    };
    return levels[role] || 0;
  };

  const startEdit = (node: PersonNode) => {
    setEditingNode(node.id);
    setEditForm({ 
      name: node.name || '', 
      photo: node.photo || ''
    });
    setShowAddMenu(null);
  };

  const saveEdit = (nodeId: string) => {
    const updateNode = (node: PersonNode): PersonNode => {
      if (node.id === nodeId) {
        return { 
          ...node, 
          name: editForm.name,
          photo: editForm.photo 
        };
      }
      
      if (node.spouse && node.spouse.id === nodeId) {
        return {
          ...node,
          spouse: { 
            ...node.spouse, 
            name: editForm.name,
            photo: editForm.photo 
          }
        };
      }

      if (node.father && node.father.id === nodeId) {
        return {
          ...node,
          father: {
            ...node.father,
            name: editForm.name,
            photo: editForm.photo
          }
        };
      }

      if (node.mother && node.mother.id === nodeId) {
        return {
          ...node,
          mother: {
            ...node.mother,
            name: editForm.name,
            photo: editForm.photo
          }
        };
      }
      
      return {
        ...node,
        children: node.children.map(updateNode),
        spouse: node.spouse ? updateNode(node.spouse) : null
      };
    };

    setFamilyData((prev) => updateNode(prev));
    setEditingNode(null);
  };

  const addMember = (
    parentId: string,
    memberType: 'spouse' | 'son' | 'daughter' | 'father' | 'mother'
  ) => {
    const createNewMember = (type: typeof memberType, gender?: 'male' | 'female'): PersonNode => {
      const id = `${type}-${uniqueId()}`;
      let role: Role;
      let newGender: 'male' | 'female';
      
      switch (type) {
        case 'spouse':
          newGender = gender || 'female';
          role = newGender === 'male' ? 'father' : 'mother';
          break;
        case 'son':
          newGender = 'male';
          role = 'son';
          break;
        case 'daughter':
          newGender = 'female';
          role = 'daughter';
          break;
        case 'father':
            newGender = 'male';
            role = 'grandfather';
            break;
        case 'mother':
            newGender = 'female';
            role = 'grandmother';
            break;
        default:
          throw new Error('Invalid member type');
      }

      return {
        id,
        name: '',
        photo: null,
        gender: newGender,
        role: role,
        spouse: null,
        children: [],
        father: null,
        mother: null,
      };
    };

    const updateNode = (node: PersonNode): PersonNode => {
      if (node.id === parentId) {
        // Add spouse
        if (memberType === 'spouse' && !node.spouse) {
          const spouseGender = node.gender === 'male' ? 'female' : 'male';
          const newSpouse = createNewMember('spouse', spouseGender);
          newSpouse.spouse = node; // Link back
          return { ...node, spouse: newSpouse };
        }

        // Add child under this couple
        if (memberType === 'son' || memberType === 'daughter') {
          const newChild = createNewMember(memberType);
          const fatherNode = node.gender === 'male' ? node : node.spouse;
          const motherNode = node.gender === 'female' ? node : node.spouse;
          newChild.father = fatherNode;
          newChild.mother = motherNode;
          
          const updatedNode = { ...node, children: [...node.children, newChild] };
          if(updatedNode.spouse){
            updatedNode.spouse.children = [...updatedNode.spouse.children, newChild];
          }
          return updatedNode;
        }

        // Add parents
        if (memberType === 'father' && !node.father) return { ...node, father: createNewMember('father') };
        if (memberType === 'mother' && !node.mother) return { ...node, mother: createNewMember('mother') };
      }

      // Recurse into related nodes
      return {
        ...node,
        spouse: node.spouse ? updateNode(node.spouse) : null,
        father: node.father ? updateNode(node.father) : null,
        mother: node.mother ? updateNode(node.mother) : null,
        children: node.children.map(updateNode),
      };
    };

    setFamilyData((prev) => updateNode(prev));
    setShowAddMenu(null);
  };

  const canAddChildren = (node: PersonNode) => {
    return getGenerationLevel(node.role) < 3 && !!node.spouse;
  };

  const PersonCard = ({ person }: { person: PersonNode }) => {
    const isEditing = editingNode === person.id;
    const isAdding = showAddMenu === person.id;

    return (
      <div className="flex flex-col items-center">
        <div 
          className="bg-white rounded-lg shadow-md w-32 border-2 border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => !isEditing && !isAdding && startEdit(person)}
        >
          {isEditing ? (
            <div className="p-3 space-y-2">
              <input
                type="text"
                placeholder="Name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full px-2 py-1 border rounded text-xs"
                onClick={(e) => e.stopPropagation()}
              />
              <input
                type="text"
                placeholder="Photo URL"
                value={editForm.photo}
                onChange={(e) => setEditForm({...editForm, photo: e.target.value})}
                className="w-full px-2 py-1 border rounded text-xs"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  saveEdit(person.id);
                }}
                className="w-full bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
              >
                Save
              </button>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mt-3 rounded-full overflow-hidden bg-gray-200">
                {person.photo ? (
                  <Image src={person.photo} alt={person.name} width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users size={32} className="text-gray-400" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-center text-sm mt-2 px-2 truncate">
                {person.name || 'Click to add'}
              </h3>
              <p className="text-xs text-gray-500 text-center pb-2 px-2">{getRoleTitle(person.role)}</p>
            </>
          )}
        </div>

        {!isEditing && (
          <div className="relative mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAddMenu(isAdding ? null : person.id);
              }}
              className="text-blue-500 hover:text-blue-700 text-xl font-bold"
            >
              {isAdding ? <X size={16} /> : '+'}
            </button>
            
            {isAdding && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-lg p-2 z-10 w-32">
                {!person.spouse && (
                  <button
                    onClick={() => addMember(person.id, 'spouse')}
                    className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs"
                  >
                    + Spouse
                  </button>
                )}
                {canAddChildren(person) && (
                  <>
                    <button
                      onClick={() => addMember(person.id, 'son')}
                      className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs"
                    >
                      + Son
                    </button>
                    <button
                      onClick={() => addMember(person.id, 'daughter')}
                      className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-xs"
                    >
                      + Daughter
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderNode = (node: PersonNode | null) => {
    if (!node) return null;
    
    const hasSpouse = !!node.spouse;
    const hasChildren = node.children && node.children.length > 0;
    
    // Sort children: those with spouses/children come first to optimize layout
    const sortedChildren = [...node.children].sort((a, b) => {
        const aValue = (a.spouse || a.children.length > 0) ? 0 : 1;
        const bValue = (b.spouse || b.children.length > 0) ? 0 : 1;
        return aValue - bValue;
    });

    return (
      <div key={node.id} className="flex flex-col items-center my-4">
        {/* Couple & Spouse */}
        <div className="relative flex items-start justify-center gap-6">
          <PersonCard person={node} />
          {hasSpouse && node.spouse && (
            <>
              {/* Horizontal line connecting spouses */}
              <div className="absolute top-1/2 left-full w-6 h-0.5 bg-gray-300 -translate-y-6"></div>
              <PersonCard person={node.spouse} />
            </>
          )}
        </div>

        {/* Vertical line connecting to children */}
        {hasChildren && (
          <div className="absolute top-full left-1/2 w-0.5 h-6 bg-gray-300 -translate-x-1/2"></div>
        )}

        {/* Children Container */}
        {hasChildren && (
          <div className="relative mt-12">
             {/* Horizontal line above all children */}
             {sortedChildren.length > 1 && (
                <div className="absolute bottom-full h-0.5 bg-gray-300" style={{ left: 'calc(50% - 11rem)', right: 'calc(50% - 11rem)' }}></div>
             )}
            <div className="flex gap-8 justify-center">
              {sortedChildren.map((child) => (
                <div key={child.id} className="relative pt-6">
                  {/* Vertical line connecting child to the horizontal line */}
                  <div className="absolute bottom-full left-1/2 w-0.5 h-6 bg-gray-300 -translate-x-1/2"></div>
                  {renderNode(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Family Tree</h1>
          <p className="text-gray-600">A demonstration of a four-generation family.</p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-2xl p-8 overflow-x-auto">
          <div className="min-w-max inline-block">
            {renderNode(familyData)}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Click any card to edit details. • Click &apos;+&apos; on a person to add their spouse or children.</p>
        </div>
      </div>
    </div>
  );
};

export default FamilyTree;