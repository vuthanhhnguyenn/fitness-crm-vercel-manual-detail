'use client';

export function StoreFloorMapSvg() {
  return (
    <svg
      viewBox="0 0 700 440"
      className="h-auto w-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="店舗フロアマップ（閲覧専用）"
    >
      <rect
        x="5"
        y="5"
        width="690"
        height="430"
        className="fill-muted stroke-border"
        strokeWidth="1.5"
        rx="4"
      />
      <rect
        x="15"
        y="15"
        width="80"
        height="120"
        className="fill-success/15 stroke-success/40"
        strokeWidth="1"
        rx="2"
      />
      <text
        x="55"
        y="45"
        textAnchor="middle"
        fontSize="9"
        className="fill-success"
        fontWeight="600"
      >
        マシン
      </text>
      <text
        x="55"
        y="57"
        textAnchor="middle"
        fontSize="9"
        className="fill-success"
        fontWeight="600"
      >
        エリア
      </text>
      <rect
        x="105"
        y="15"
        width="180"
        height="120"
        className="fill-gender-female/15 stroke-gender-female/40"
        strokeWidth="1"
        rx="2"
      />
      <text
        x="195"
        y="65"
        textAnchor="middle"
        fontSize="10"
        className="fill-gender-female"
        fontWeight="600"
      >
        女性専用エリア
      </text>
      <rect
        x="290"
        y="30"
        width="28"
        height="40"
        className="fill-warning stroke-warning"
        strokeWidth="1.5"
        rx="2"
      />
      <text
        x="304"
        y="47"
        textAnchor="middle"
        fontSize="10"
        className="fill-warning-foreground"
        fontWeight="700"
      >
        R
      </text>
      <rect
        x="290"
        y="74"
        width="28"
        height="40"
        className="fill-warning stroke-warning"
        strokeWidth="1.5"
        rx="2"
      />
      <text
        x="304"
        y="91"
        textAnchor="middle"
        fontSize="10"
        className="fill-warning-foreground"
        fontWeight="700"
      >
        S
      </text>
      {['K', 'L', 'M', 'N'].map((letter, index) => (
        <g key={letter}>
          <rect
            x={115 + index * 42}
            y="140"
            width="38"
            height="28"
            className="fill-warning stroke-warning"
            strokeWidth="1.5"
            rx="2"
          />
          <text
            x={134 + index * 42}
            y="158"
            textAnchor="middle"
            fontSize="10"
            className="fill-warning-foreground"
            fontWeight="700"
          >
            {letter}
          </text>
        </g>
      ))}
      <rect
        x="330"
        y="15"
        width="70"
        height="60"
        className="fill-muted stroke-border"
        strokeWidth="1"
        rx="2"
      />
      <text x="365" y="38" textAnchor="middle" fontSize="8" className="fill-muted-foreground">
        出入口
      </text>
      <rect
        x="330"
        y="90"
        width="70"
        height="45"
        className="fill-muted stroke-border"
        strokeWidth="1"
        rx="2"
      />
      <text x="365" y="117" textAnchor="middle" fontSize="8" className="fill-muted-foreground">
        階段
      </text>
      <rect
        x="430"
        y="15"
        width="170"
        height="100"
        className="fill-muted stroke-border"
        strokeWidth="1"
        rx="2"
      />
      <text
        x="515"
        y="55"
        textAnchor="middle"
        fontSize="9"
        className="fill-muted-foreground"
        fontWeight="600"
      >
        STAFF ONLY
      </text>
      <text
        x="515"
        y="70"
        textAnchor="middle"
        fontSize="9"
        className="fill-muted-foreground"
        fontWeight="600"
      >
        事務所
      </text>
      <rect
        x="490"
        y="120"
        width="38"
        height="28"
        className="fill-warning stroke-warning"
        strokeWidth="1.5"
        rx="2"
      />
      <text
        x="509"
        y="138"
        textAnchor="middle"
        fontSize="10"
        className="fill-warning-foreground"
        fontWeight="700"
      >
        I
      </text>
      <rect
        x="555"
        y="120"
        width="38"
        height="28"
        className="fill-warning stroke-warning"
        strokeWidth="1.5"
        rx="2"
      />
      <text
        x="574"
        y="138"
        textAnchor="middle"
        fontSize="10"
        className="fill-warning-foreground"
        fontWeight="700"
      >
        J
      </text>
      <rect
        x="460"
        y="170"
        width="140"
        height="120"
        className="fill-info/15 stroke-info/40"
        strokeWidth="1"
        rx="2"
      />
      <text
        x="530"
        y="235"
        textAnchor="middle"
        fontSize="10"
        className="fill-info"
        fontWeight="600"
      >
        更衣室
      </text>
      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((letter, index) => (
        <g key={letter}>
          <rect
            x="645"
            y={160 + index * 32}
            width="38"
            height="28"
            className="fill-warning stroke-warning"
            strokeWidth="1.5"
            rx="2"
          />
          <text
            x="664"
            y={178 + index * 32}
            textAnchor="middle"
            fontSize="10"
            className="fill-warning-foreground"
            fontWeight="700"
          >
            {letter}
          </text>
        </g>
      ))}
      <rect
        x="15"
        y="310"
        width="80"
        height="80"
        className="fill-success/15 stroke-success/40"
        strokeWidth="1"
        rx="2"
      />
      <text
        x="55"
        y="350"
        textAnchor="middle"
        fontSize="9"
        className="fill-success"
        fontWeight="600"
      >
        FW
      </text>
      <text
        x="55"
        y="362"
        textAnchor="middle"
        fontSize="9"
        className="fill-success"
        fontWeight="600"
      >
        エリア
      </text>
      <rect
        x="250"
        y="380"
        width="350"
        height="45"
        className="fill-success/15 stroke-success/40"
        strokeWidth="1"
        rx="2"
      />
      <text
        x="425"
        y="407"
        textAnchor="middle"
        fontSize="10"
        className="fill-success"
        fontWeight="600"
      >
        有酸素エリア
      </text>
    </svg>
  );
}
