// Multi-purpose SVG evidence & cover mock generator
// Supports software/digital, research, curriculum, event, and facility illustrations

export function createEvidenceSvg(
  title: string,
  subtitle: string,
  type: 'software' | 'research' | 'education' | 'event' | 'facilities'
): string {
  let bgGradient = '';
  let shapes = '';
  let badgeColor = '';
  let badgeText = '';

  switch (type) {
    case 'software':
      bgGradient =
        '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0F172A"/><stop offset="100%" stop-color="#0369A1"/></linearGradient>';
      badgeColor = '#38BDF8';
      badgeText = 'HỆ THỐNG PHẦN MỀM & DỮ LIỆU SỐ';
      shapes = `
        <!-- Window frame -->
        <rect x="80" y="80" width="640" height="320" rx="12" fill="#1E293B" stroke="#334155" stroke-width="2"/>
        <circle cx="105" cy="105" r="5" fill="#EF4444"/>
        <circle cx="125" cy="105" r="5" fill="#F59E0B"/>
        <circle cx="145" cy="105" r="5" fill="#10B981"/>
        <line x1="80" y1="125" x2="720" y2="125" stroke="#334155" stroke-width="1.5"/>
        <!-- Code / Interface simulation -->
        <rect x="110" y="150" width="160" height="20" rx="4" fill="#38BDF8" fill-opacity="0.2"/>
        <rect x="290" y="150" width="100" height="20" rx="4" fill="#A855F7" fill-opacity="0.2"/>
        <rect x="110" y="185" width="280" height="12" rx="3" fill="#64748B" fill-opacity="0.5"/>
        <rect x="110" y="210" width="220" height="12" rx="3" fill="#64748B" fill-opacity="0.5"/>
        <!-- Chart mockup in right window -->
        <rect x="420" y="150" width="270" height="150" rx="8" fill="#0F172A" stroke="#334155"/>
        <polyline points="440,270 480,240 520,250 560,200 600,210 650,170" fill="none" stroke="#38BDF8" stroke-width="3"/>
        <circle cx="650" cy="170" r="4" fill="#38BDF8"/>
        <text x="110" y="360" fill="#38BDF8" font-family="monospace" font-size="12">STATUS: 200 OK • DEPLOYMENT SUCCESSFUL</text>
      `;
      break;

    case 'education':
      bgGradient =
        '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#064E3B"/><stop offset="100%" stop-color="#022C22"/></linearGradient>';
      badgeColor = '#34D399';
      badgeText = 'KIỂM ĐỊNH CHẤT LƯỢNG & ĐÀO TẠO';
      shapes = `
        <!-- Certificate / Review sheet -->
        <rect x="150" y="80" width="500" height="340" rx="14" fill="#065F46" fill-opacity="0.4" stroke="#059669" stroke-width="2"/>
        <line x1="200" y1="130" x2="600" y2="130" stroke="#34D399" stroke-width="2"/>
        <text x="200" y="120" fill="#A7F3D0" font-family="system-ui" font-weight="bold" font-size="14">TIÊU CHUẨN ĐÁNH GIÁ CHẤT LƯỢNG AUN-QA</text>
        <!-- Checklist items -->
        <circle cx="215" cy="175" r="10" fill="#10B981" fill-opacity="0.3" stroke="#10B981" stroke-width="2"/>
        <text x="210" y="180" fill="#34D399" font-weight="bold" font-size="12">✓</text>
        <rect x="240" y="170" width="340" height="12" rx="3" fill="#D1FAE5" fill-opacity="0.8"/>
        <circle cx="215" cy="225" r="10" fill="#10B981" fill-opacity="0.3" stroke="#10B981" stroke-width="2"/>
        <text x="210" y="230" fill="#34D399" font-weight="bold" font-size="12">✓</text>
        <rect x="240" y="220" width="310" height="12" rx="3" fill="#D1FAE5" fill-opacity="0.8"/>
        <circle cx="215" cy="275" r="10" fill="#10B981" fill-opacity="0.3" stroke="#10B981" stroke-width="2"/>
        <text x="210" y="280" fill="#34D399" font-weight="bold" font-size="12">✓</text>
        <rect x="240" y="270" width="360" height="12" rx="3" fill="#D1FAE5" fill-opacity="0.8"/>
        <rect x="200" y="325" width="220" height="24" rx="6" fill="#10B981" fill-opacity="0.2"/>
        <text x="215" y="342" fill="#6EE7B7" font-family="monospace" font-size="11">KẾT QUẢ: 100% ĐẠT CHUẨN</text>
      `;
      break;

    case 'research':
      bgGradient =
        '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2E1065"/><stop offset="100%" stop-color="#1E1B4B"/></linearGradient>';
      badgeColor = '#C084FC';
      badgeText = 'BÁO CÁO KHOA HỌC & ĐỀ TÀI';
      shapes = `
        <pattern id="dotGrid" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="1" fill="#A855F7" fill-opacity="0.3"/>
        </pattern>
        <rect width="800" height="500" fill="url(#dotGrid)"/>
        <!-- Document page preview -->
        <rect x="180" y="90" width="440" height="310" rx="10" fill="#3B0764" stroke="#9333EA" stroke-width="2"/>
        <rect x="220" y="130" width="280" height="16" rx="4" fill="#C084FC"/>
        <rect x="220" y="160" width="180" height="10" rx="3" fill="#DDD6FE" fill-opacity="0.6"/>
        <!-- Graph / data curve -->
        <rect x="220" y="190" width="360" height="120" rx="8" fill="#1E1B4B" stroke="#6B21A8"/>
        <path d="M 240 280 Q 320 200 400 240 T 560 210" fill="none" stroke="#C084FC" stroke-width="3"/>
        <circle cx="400" cy="240" r="5" fill="#E9D5FF"/>
        <text x="220" y="345" fill="#DDD6FE" font-family="monospace" font-size="11">PEER-REVIEW STATUS: ACCEPTED (SCOPUS / ISBN)</text>
      `;
      break;

    case 'event':
      bgGradient =
        '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#831843"/><stop offset="100%" stop-color="#4C0519"/></linearGradient>';
      badgeColor = '#F472B6';
      badgeText = 'TỔ CHỨC SỰ KIỆN & HỘI NGHỊ';
      shapes = `
        <!-- Conference stage lighting -->
        <polygon points="400,60 180,380 620,380" fill="#F472B6" fill-opacity="0.08"/>
        <rect x="160" y="130" width="480" height="240" rx="16" fill="#500724" stroke="#BE185D" stroke-width="2"/>
        <text x="400" y="180" fill="#FDF2F8" font-family="system-ui" font-weight="bold" font-size="20" text-anchor="middle">INTERNATIONAL ACADEMIC FORUM</text>
        <line x1="240" y1="210" x2="560" y2="210" stroke="#F472B6" stroke-width="1.5" stroke-dasharray="6 4"/>
        <!-- Micro & Podium silhouette -->
        <rect x="360" y="240" width="80" height="110" rx="6" fill="#831843" stroke="#F472B6" stroke-width="1.5"/>
        <circle cx="400" cy="235" r="8" fill="#FB7185"/>
        <text x="400" y="320" fill="#FCE7F3" font-family="monospace" font-size="12" text-anchor="middle">DIỄN GIẢ & KHÁCH MỜI</text>
      `;
      break;

    case 'facilities':
      bgGradient =
        '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E293B"/><stop offset="100%" stop-color="#0F172A"/></linearGradient>';
      badgeColor = '#F59E0B';
      badgeText = 'CƠ SỞ VẬT CHẤT & THIẾT BỊ';
      shapes = `
        <!-- Workstations / Lab layout -->
        <rect x="140" y="110" width="520" height="260" rx="12" fill="#334155" stroke="#F59E0B" stroke-width="2"/>
        <rect x="170" y="140" width="130" height="90" rx="8" fill="#1E293B" stroke="#64748B"/>
        <rect x="335" y="140" width="130" height="90" rx="8" fill="#1E293B" stroke="#64748B"/>
        <rect x="500" y="140" width="130" height="90" rx="8" fill="#1E293B" stroke="#64748B"/>
        <rect x="170" y="255" width="130" height="90" rx="8" fill="#1E293B" stroke="#64748B"/>
        <rect x="335" y="255" width="130" height="90" rx="8" fill="#1E293B" stroke="#64748B"/>
        <rect x="500" y="255" width="130" height="90" rx="8" fill="#1E293B" stroke="#64748B"/>
        <text x="180" y="190" fill="#FBBF24" font-family="monospace" font-size="11">PC-LAB-01 [OK]</text>
        <text x="345" y="190" fill="#FBBF24" font-family="monospace" font-size="11">PC-LAB-02 [OK]</text>
        <text x="510" y="190" fill="#FBBF24" font-family="monospace" font-size="11">PC-LAB-03 [OK]</text>
      `;
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
    <defs>
      ${bgGradient}
      <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="60%" stop-color="#000000" stop-opacity="0.0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect width="800" height="500" fill="url(#bg)"/>
    ${shapes}
    <rect width="800" height="500" fill="url(#overlay)"/>
    
    <!-- Top badge -->
    <rect x="30" y="24" width="290" height="32" rx="8" fill="${badgeColor}" fill-opacity="0.2" stroke="${badgeColor}" stroke-width="1.5"/>
    <text x="44" y="45" fill="${badgeColor}" font-family="system-ui, sans-serif" font-weight="bold" font-size="11" letter-spacing="0.5">${badgeText}</text>
    
    <!-- Title & Subtitle overlay at bottom -->
    <text x="36" y="435" fill="#FFFFFF" font-family="system-ui, sans-serif" font-weight="bold" font-size="22">${title}</text>
    <text x="36" y="465" fill="#CBD5E1" font-family="system-ui, sans-serif" font-size="14">${subtitle}</text>
    
    <!-- Technical watermarks -->
    <text x="650" y="45" fill="#94A3B8" font-family="monospace" font-size="11" text-anchor="end">MINH CHỨNG NGHIỆM THU: ĐẠT</text>
    <text x="765" y="465" fill="#94A3B8" font-family="monospace" font-size="12" text-anchor="end">PXU-DOC-2026</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createCoverSvg(
  title: string,
  code: string,
  color1: string,
  color2: string,
  categoryText: string = 'DỰ ÁN MỤC TIÊU'
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 480" width="1200" height="480">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
      </linearGradient>
      <pattern id="archGrid" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#FFFFFF" stroke-width="0.75" stroke-opacity="0.12"/>
        <circle cx="25" cy="25" r="1.5" fill="#FFFFFF" fill-opacity="0.25"/>
      </pattern>
    </defs>
    <rect width="1200" height="480" fill="url(#grad)"/>
    <rect width="1200" height="480" fill="url(#archGrid)"/>
    
    <!-- Abstract geometric dynamics -->
    <g stroke="#FFFFFF" stroke-opacity="0.2" stroke-width="1.5" fill="none">
      <circle cx="1000" cy="240" r="180" stroke-dasharray="10 6"/>
      <circle cx="1000" cy="240" r="120"/>
      <circle cx="1000" cy="240" r="60"/>
      <line x1="750" y1="240" x2="1200" y2="240" stroke-dasharray="4 4"/>
      <line x1="1000" y1="60" x2="1000" y2="420" stroke-dasharray="4 4"/>
    </g>

    <!-- Project info -->
    <rect x="60" y="60" width="180" height="34" rx="8" fill="#FFFFFF" fill-opacity="0.15" stroke="#FFFFFF" stroke-width="1"/>
    <text x="80" y="82" fill="#FFFFFF" font-family="monospace" font-weight="bold" font-size="13">${code}</text>

    <text x="60" y="160" fill="#FFFFFF" font-family="system-ui, sans-serif" font-weight="800" font-size="36" letter-spacing="-0.5">${title}</text>
    <text x="60" y="200" fill="#E2E8F0" font-family="system-ui, sans-serif" font-size="16" opacity="0.9">${categoryText} • HỆ THỐNG QUẢN TRỊ MỤC TIÊU & PHÂN RÃ CÔNG VIỆC</text>

    <line x1="60" y1="240" x2="620" y2="240" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1.5"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
