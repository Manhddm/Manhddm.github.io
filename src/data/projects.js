/**
 * Danh sách dự án game dùng chung cho Trang chủ và trang /projects
 */
export const PROJECTS = [
  {
    id: 'match3-puzzle-quest',
    title: 'Match-3 Puzzle Adventure',
    genre: 'Puzzle / Casual Mobile',
    period: '2025 – 2026',
    status: 'Đã hoàn thành Core & Tooling',
    description:
      'Tựa game giải đố Match-3 màn hình dọc tối ưu thao tác một tay (Thumb Zone), tích hợp hệ thống sinh màn chơi, kiểm thử độ khó bằng mô phỏng Monte Carlo và kiến trúc Dependency Injection tách biệt.',
    highlights: [
      'Thiết kế nhịp độ độ khó theo mô hình Sawtooth Curve.',
      'Tối ưu bộ nhớ với Object Pooling cho hiệu ứng hạt và mảnh ghép.',
      'Xử lý chuỗi bất đồng bộ mượt mà bằng UniTask.',
    ],
    techStack: ['Unity 2022 LTS', 'C#', 'UniTask', 'ScriptableObject', 'Custom Editor'],
    coverGradient: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
    icon: '💎',
    links: {
      github: 'https://github.com/Manhddm',
      demo: 'https://manhddm.github.io/projects',
    },
    featured: true,
  },
  {
    id: 'roguelike-arena-survivor',
    title: 'Cyber Arena Survivor',
    genre: '2D Action Roguelite',
    period: '2024 – 2025',
    status: 'Prototype / Mở mã nguồn',
    description:
      'Game hành động sinh tồn góc nhìn Top-down với hàng trăm quái vật xuất hiện cùng lúc trên màn hình. Áp dụng kiến trúc hướng sự kiện (Event-driven) và State Machine rõ ràng.',
    highlights: [
      'Hệ thống vũ khí & nâng cấp cấu hình hoàn toàn qua ScriptableObject.',
      'Quản lý hàng trăm thực thể không gây giật khung hình (Zero GC Allocation trong Update).',
      'Tích hợp Unit Test cho công thức tính sát thương và tỉ lệ chí mạng.',
    ],
    techStack: ['Unity', 'C#', 'NUnit Test', '2D URP', 'State Machine'],
    coverGradient: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
    icon: '⚔️',
    links: {
      github: 'https://github.com/Manhddm',
    },
    featured: true,
  },
  {
    id: 'unity-modular-toolkit',
    title: 'Unity Clean Architecture & Toolkit',
    genre: 'Open-Source Package / Template',
    period: '2025 – Nay',
    status: 'Đang phát triển',
    description:
      'Bộ khung khởi tạo dự án (Project Template) dành cho Unity Developer: đóng gói sẵn Audio Manager, Scene Loader, Object Pooler và Composition Root nhẹ gọn không phụ thuộc thư viện nặng.',
    highlights: [
      'Áp dụng nguyên lý Single Responsibility và Dependency Injection thuần C#.',
      'Tích hợp sẵn các chuẩn quy ước code và cấu trúc thư mục rõ ràng.',
      'Dễ dàng tái sử dụng cho cả dự án Game Jam lẫn dự án dài hạn.',
    ],
    techStack: ['C#', 'Unity Package', 'Design Patterns', 'DI', 'Clean Code'],
    coverGradient: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
    icon: '🧰',
    links: {
      github: 'https://github.com/Manhddm',
    },
    featured: true,
  },
];

export const SKILL_GROUPS = [
  {
    title: '🎮 Game Engine & Lập trình',
    description: 'Làm chủ vòng đời Unity, vật lý 2D/3D, hệ thống UI và bất đồng bộ.',
    skills: [
      'Unity 2022 LTS / Unity 6',
      'C# (.NET Standard 2.1)',
      'UniTask (Async/Await)',
      'UGUI & UI Toolkit',
      'URP & Shader Graph',
      'Unity Input System',
    ],
  },
  {
    title: '🏗️ Kiến trúc & Tối ưu hóa',
    description: 'Viết code dễ đọc, dễ mở rộng, tách biệt phụ thuộc và kiểm soát hiệu năng.',
    skills: [
      'Dependency Injection',
      'SOLID & Design Patterns',
      'ScriptableObject Architecture',
      'Object Pooling & Memory',
      'Unity Profiler & Frame Debugger',
      'Unit Testing (NUnit)',
    ],
  },
  {
    title: '🛠️ Công cụ & Quy trình',
    description: 'Tự động hóa quy trình làm việc, thiết kế màn chơi và quản lý mã nguồn.',
    skills: [
      'Git & GitHub Workflow',
      'Custom Editor / Inspector',
      'Level Design & Balancing',
      'DOTween / Cinemachine',
      'Addressables / Asset Management',
      'CI/CD cơ bản',
    ],
  },
];
