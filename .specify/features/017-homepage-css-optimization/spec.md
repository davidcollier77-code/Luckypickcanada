# Homepage CSS Optimization Spec

**Objective:** Reduce render-blocking CSS on the homepage.
**Method:** Combine the two main layout CSS imports into a single Next.js CSS chunk.
**Impact:** Eliminates one critical-path render-blocking network request.
