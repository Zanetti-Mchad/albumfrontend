import * as React from 'react';

export type FamilyNode = {
  id: string;
  name?: string;
  gender?: 'male' | 'female' | 'spouse';
  parents?: string[];
  partnerId?: string;
  left?: number;
  top?: number;
};

export type FamilyTreeProps = {
  nodes: FamilyNode[];
  rootId: string;
  width: number;
  height: number;
  renderNode: (args: { node: FamilyNode; style: React.CSSProperties }) => React.ReactNode;
};

declare const ReactFamilyTree: React.FC<FamilyTreeProps>;

export default ReactFamilyTree;


