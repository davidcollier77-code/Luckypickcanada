type Point = { x: number, y: number };
type BoltSegment = Point;
interface BoltBranch { segments: BoltSegment[]; branches: BoltBranch[]; thickness: number; }

function createMockBolt() {
   const segments: BoltSegment[] = [];
   for (let i=0; i<100; i++) segments.push({x: i, y: i});
   const branches: BoltBranch[] = [];
   for (let i=0; i<10; i++) {
       const subSegments: BoltSegment[] = [];
       for (let j=0; j<50; j++) subSegments.push({x: i+j, y: i+j});
       branches.push({ segments: subSegments, branches: [], thickness: 1 });
   }
   return { segments, branches, thickness: 3 };
}
const b = createMockBolt();
console.log(b.branches.length);
