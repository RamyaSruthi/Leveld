-- Leveld — Curriculum Seed Data
-- Run AFTER migration.sql. Safe to re-run (uses ON CONFLICT DO NOTHING).

INSERT INTO public.topics (pillar, title, description, order_index) VALUES

-- ── DSA — 17 patterns (Neetcode 150 order) ───────────────────────────────────
('dsa', 'Arrays & Hashing', 'Frequency maps, prefix sums, two-pointer basics, sliding window intro.', 1),
('dsa', 'Two Pointers', 'Sorted-array pair problems, palindrome checks, removing duplicates.', 2),
('dsa', 'Sliding Window', 'Fixed and variable window, substring problems, max/min in window.', 3),
('dsa', 'Stack', 'Monotonic stacks, next greater element, valid parentheses.', 4),
('dsa', 'Binary Search', 'Search on sorted arrays, rotated arrays, search on answer space.', 5),
('dsa', 'Linked List', 'Fast/slow pointers, reversal, merge, cycle detection.', 6),
('dsa', 'Trees', 'DFS/BFS traversals, diameter, LCA, path sums.', 7),
('dsa', 'Tries', 'Prefix tree construction, word search, autocomplete.', 8),
('dsa', 'Heap / Priority Queue', 'Top-K elements, merge K sorted lists, median from stream.', 9),
('dsa', 'Backtracking', 'Subsets, permutations, combinations, N-Queens.', 10),
('dsa', 'Graphs', 'DFS/BFS on grids/adjacency lists, connected components, topological sort.', 11),
('dsa', 'Advanced Graphs', 'Dijkstra, Bellman-Ford, Prim, Kruskal, Union-Find.', 12),
('dsa', '1-D Dynamic Programming', 'Fibonacci, climbing stairs, house robber, coin change.', 13),
('dsa', '2-D Dynamic Programming', 'Unique paths, LCS, edit distance, knapsack.', 14),
('dsa', 'Greedy', 'Activity selection, interval scheduling, jump game.', 15),
('dsa', 'Intervals', 'Merge intervals, insert interval, meeting rooms.', 16),
('dsa', 'Bit Manipulation', 'XOR tricks, counting bits, missing number, power of two.', 17),

-- ── HLD — 12 topics + 6 design problems ──────────────────────────────────────
('hld', 'Scalability Fundamentals', 'Vertical vs horizontal scaling, stateless services, load balancing strategies.', 1),
('hld', 'CAP Theorem & Consistency Models', 'Strong, eventual, causal consistency. CP vs AP trade-offs.', 2),
('hld', 'Load Balancing', 'Round-robin, least connections, consistent hashing, L4 vs L7.', 3),
('hld', 'Caching', 'CDN, Redis, write-through/write-back/write-around, cache eviction policies.', 4),
('hld', 'Databases — SQL vs NoSQL', 'RDBMS, document, key-value, wide-column, graph. When to use each.', 5),
('hld', 'Database Sharding & Partitioning', 'Horizontal/vertical partitioning, hash vs range sharding, hotspot mitigation.', 6),
('hld', 'Message Queues & Event Streaming', 'Kafka, RabbitMQ, pub-sub vs queue, at-least-once vs exactly-once delivery.', 7),
('hld', 'API Design', 'REST, GraphQL, gRPC. Rate limiting, versioning, idempotency.', 8),
('hld', 'Microservices & Service Mesh', 'Service discovery, circuit breaker, sidecar pattern, Istio basics.', 9),
('hld', 'Search', 'Elasticsearch internals, inverted index, relevance ranking, autocomplete.', 10),
('hld', 'Observability', 'Distributed tracing, metrics, structured logging, alerting.', 11),
('hld', 'Security Fundamentals', 'AuthN vs AuthZ, OAuth 2.0, JWT, rate limiting, DDoS mitigation.', 12),
-- Design problems
('hld', 'Design URL Shortener', 'TinyURL / Bitly. Focus: consistent hashing, KV store, analytics counters.', 13),
('hld', 'Design Twitter / Feed', 'Fan-out on write vs read, timeline generation, hot user problem.', 14),
('hld', 'Design WhatsApp', 'WebSocket connections, message delivery guarantees, media storage.', 15),
('hld', 'Design YouTube / Netflix', 'Video encoding pipeline, CDN strategy, adaptive bitrate streaming.', 16),
('hld', 'Design Uber / Ride Sharing', 'Geospatial indexing, driver matching, surge pricing, real-time tracking.', 17),
('hld', 'Design Google Drive', 'File chunking, deduplication, versioning, collaborative editing.', 18),

-- ── LLD — 10 design problems ──────────────────────────────────────────────────
('lld', 'Design Parking Lot', 'OOP basics: Vehicle, Spot, Ticket, Payment. Polymorphism, factory pattern.', 1),
('lld', 'Design Library Management', 'Book, Member, Loan lifecycle. State machine for book availability.', 2),
('lld', 'Design Movie Ticket Booking', 'Show, Seat, Booking. Concurrency with optimistic locking.', 3),
('lld', 'Design Elevator System', 'Multiple elevators, request scheduling (SCAN algorithm), state machine.', 4),
('lld', 'Design Chess Game', 'Piece hierarchy, move validation, check/checkmate detection.', 5),
('lld', 'Design Snake & Ladder', 'Board, Player, Dice. Immutable game rules, observer for events.', 6),
('lld', 'Design ATM', 'Cash withdrawal flow, denomination dispensing, account state, PIN retry.', 7),
('lld', 'Design In-Memory Cache (LRU/LFU)', 'Doubly linked list + HashMap for O(1). Capacity eviction.', 8),
('lld', 'Design Notification Service', 'Multi-channel (email, SMS, push). Strategy pattern for channels.', 9),
('lld', 'Design Splitwise', 'Expense splitting, simplify debts algorithm, group balances.', 10),

-- ── Tech Stack / Java — 20 topics ─────────────────────────────────────────────
('tech_stack', 'Java Collections Framework', 'List, Set, Map, Queue — implementations, time complexity, thread safety.', 1),
('tech_stack', 'Java Concurrency', 'Threads, Executors, synchronized, volatile, happens-before, ConcurrentHashMap.', 2),
('tech_stack', 'Java Memory Model & GC', 'Heap/stack, GC algorithms (G1, ZGC), OutOfMemoryError types, tuning flags.', 3),
('tech_stack', 'Java Streams & Functional', 'Stream API, lambda, method references, Collectors, parallel streams.', 4),
('tech_stack', 'Java Generics & Type System', 'Bounded wildcards, type erasure, covariance/contravariance.', 5),
('tech_stack', 'Spring Boot Internals', 'Auto-configuration, bean lifecycle, application context, starter packs.', 6),
('tech_stack', 'Spring MVC & REST', 'DispatcherServlet flow, @RestController, exception handling, filters, interceptors.', 7),
('tech_stack', 'Spring Data JPA', 'Repository pattern, JPQL vs native queries, N+1 problem, Hibernate caching.', 8),
('tech_stack', 'Spring Security', 'Filter chain, JWT integration, OAuth2 resource server, method security.', 9),
('tech_stack', 'Reactive Programming (WebFlux)', 'Mono/Flux, backpressure, reactive pipeline, when to use vs MVC.', 10),
('tech_stack', 'Microservices with Spring', 'Spring Cloud, Eureka, Feign, Resilience4j circuit breaker.', 11),
('tech_stack', 'Kafka with Java', 'Producer/consumer API, partitions, consumer groups, exactly-once semantics.', 12),
('tech_stack', 'Redis with Java', 'Jedis/Lettuce, data structures, pub/sub, distributed locks.', 13),
('tech_stack', 'Docker & Containers', 'Dockerfile best practices, multi-stage builds, layer caching, networking.', 14),
('tech_stack', 'Kubernetes Basics', 'Pod, Deployment, Service, Ingress, ConfigMap, HPA.', 15),
('tech_stack', 'SQL Performance', 'Index types (B-tree, hash, composite), EXPLAIN, query planner, partitioning.', 16),
('tech_stack', 'Testing — Unit & Integration', 'JUnit 5, Mockito, TestContainers, @SpringBootTest vs @WebMvcTest.', 17),
('tech_stack', 'Build Tools — Maven / Gradle', 'Lifecycle phases, dependency management, custom tasks, caching.', 18),
('tech_stack', 'CI/CD Pipeline Patterns', 'Pipeline stages, blue-green vs canary deploy, rollback strategy.', 19),
('tech_stack', 'Monitoring & Observability (Java)', 'Micrometer, Prometheus, Grafana, distributed tracing with Sleuth/Zipkin.', 20),

-- ── Theory — 8 topics ─────────────────────────────────────────────────────────
('theory', 'Operating Systems — Processes & Threads', 'Context switching, scheduling (FCFS, SJF, Round Robin), process vs thread, IPC.', 1),
('theory', 'Operating Systems — Memory', 'Virtual memory, paging, segmentation, TLB, page replacement algorithms.', 2),
('theory', 'Operating Systems — Storage', 'File systems (ext4, NTFS), inodes, RAID, disk I/O scheduling.', 3),
('theory', 'Networking — Protocols', 'TCP vs UDP, TLS handshake, HTTP/1.1 vs HTTP/2 vs HTTP/3, DNS resolution.', 4),
('theory', 'Networking — Load & Proxy', 'Reverse proxy, NAT, CDN, anycast routing, BGP basics.', 5),
('theory', 'Database Internals', 'B+ tree index, WAL, MVCC, transaction isolation levels, ACID vs BASE.', 6),
('theory', 'Distributed Systems Concepts', 'Consensus (Raft/Paxos), leader election, distributed transactions, 2PC.', 7),
('theory', 'Concurrency Concepts', 'Race conditions, deadlock, livelock, starvation, lock-free data structures.', 8),

-- ── Behavioral — 10 STAR prompts ──────────────────────────────────────────────
('behavioral', 'Conflict with teammate or manager', 'Describe a significant disagreement. How did you resolve it?', 1),
('behavioral', 'Influence without authority', 'A time you drove change or adoption without a formal mandate.', 2),
('behavioral', 'Handling ambiguity', 'A project with unclear requirements or shifting goals. How did you proceed?', 3),
('behavioral', 'Technical leadership', 'A time you led a technical decision or mentored others through one.', 4),
('behavioral', 'Failure & lessons learned', 'A project or decision that went wrong. What did you do and learn?', 5),
('behavioral', 'Delivering under pressure', 'A high-stakes deadline or production crisis. How did you handle it?', 6),
('behavioral', 'Cross-team collaboration', 'Working with PM, design, or another eng team to ship something complex.', 7),
('behavioral', 'Prioritisation trade-offs', 'A time you had to cut scope or defer features. How did you decide?', 8),
('behavioral', 'Going beyond the job spec', 'Something you did that was not your responsibility but had high impact.', 9),
('behavioral', 'Why this company / role', 'Craft a genuine, specific answer about motivation and alignment.', 10),

-- ── Projects — 8 talking point prompts (2 projects × 4 angles) ───────────────
('projects', 'Project 1 — Problem & Solution', 'What was the business/user problem? What did you build and why that approach?', 1),
('projects', 'Project 1 — Technical Depth', 'Deep-dive: architecture decisions, trade-offs, interesting implementation details.', 2),
('projects', 'Project 1 — Impact & Metrics', 'Quantified outcomes: latency improvement, cost reduction, user growth, revenue.', 3),
('projects', 'Project 1 — Challenges & Learnings', 'What was hardest? What would you do differently? What did you learn?', 4),
('projects', 'Project 2 — Problem & Solution', 'What was the business/user problem? What did you build and why that approach?', 5),
('projects', 'Project 2 — Technical Depth', 'Deep-dive: architecture decisions, trade-offs, interesting implementation details.', 6),
('projects', 'Project 2 — Impact & Metrics', 'Quantified outcomes: latency improvement, cost reduction, user growth, revenue.', 7),
('projects', 'Project 2 — Challenges & Learnings', 'What was hardest? What would you do differently? What did you learn?', 8)

ON CONFLICT DO NOTHING;
