import * as T from 'three';
// Batch only static descendants; preserve root transforms and all animated exclusions.
export function batchMeshes(root,excluded=new Set()){
 root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),groups=new Map();
 function visit(o){if(excluded.has(o)||o.isInstancedMesh)return;if(o.isMesh&&!Array.isArray(o.material)&&!o.material.transparent){const key=o.geometry.uuid+':'+o.material.uuid;let list=groups.get(key);if(!list)groups.set(key,list=[]);list.push(o);}for(const child of o.children)visit(child);}
 visit(root);let removed=0;
 for(const list of groups.values()){if(list.length<2)continue;const first=list[0],mesh=new T.InstancedMesh(first.geometry,first.material,list.length);mesh.name='Batch '+first.material.name;mesh.castShadow=list.some(m=>m.castShadow);mesh.receiveShadow=list.some(m=>m.receiveShadow);list.forEach((m,i)=>{mesh.setMatrixAt(i,new T.Matrix4().multiplyMatrices(inverse,m.matrixWorld));m.removeFromParent();});mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();root.add(mesh);removed+=list.length-1;}
 return removed;
}
