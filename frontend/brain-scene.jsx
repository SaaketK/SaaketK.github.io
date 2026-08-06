/* global React */
const { useState: useBrainState } = React;

const BRAIN_DETAILS = {
  piano: {
    eyebrow: "hobby / 01",
    title: "learning piano",
    body: "",
  },
  books: {
    eyebrow: "hobby / 02",
    title: "reading books",
    body: "",
  },
  basketball: {
    eyebrow: "hobby / 03",
    title: "casual basketball",
    body: "",
  },
  current: {
    eyebrow: "current work / summer 2026",
    title: "ANNS performance",
    body: "researching approximate nearest-neighbor search on Intel AMX CPUs and high-performance GPU clusters.",
  },
  past: {
    eyebrow: "past work / summer 2025",
    title: "Cardaverse",
    body: "software engineering intern working with web development frameworks and full-stack engineering.",
  },
  interests: {
    eyebrow: "interests",
    title: "things I keep returning to",
    body: "computer architecture · systems programming · high-performance computing · quantum computing · optimization algorithms",
  },
};

const BRAIN_SILHOUETTE = "M800 358H734V368H670V382H612V402H560V428H518V460H484V500H458V544H440V590H432V632H436V674H450V718H472V758H504V790H544V820H592V844H650V860H716V866H754L800 848L846 866H884V860H950V844H1008V820H1056V790H1096V758H1128V718H1150V674H1164V632H1168V590H1160V544H1142V500H1116V460H1082V428H1040V402H988V382H930V368H866V358Z";

function PianoGlyph() {
  return (
    <g className="brain-glyph">
      <rect x="0" y="18" width="114" height="48" fill="#6e302e" />
      <rect x="6" y="24" width="102" height="29" fill="#15131a" />
      {[0,1,2,3,4,5,6,7,8,9].map((i) => <rect key={i} x={10 + i * 9.4} y="28" width="7" height="21" fill="#eee7d7" />)}
      {[0,1,2,3,4,5].map((i) => <rect key={i} x={16 + i * 15.7} y="28" width="5" height="12" fill="#17151b" />)}
      <rect x="8" y="66" width="10" height="32" fill="#402021" />
      <rect x="96" y="66" width="10" height="32" fill="#402021" />
      <rect x="14" y="0" width="86" height="18" fill="#87403b" />
      <rect x="20" y="5" width="74" height="5" fill="#a85b50" />
    </g>
  );
}

function BooksGlyph() {
  return (
    <g className="brain-glyph">
      <rect x="2" y="58" width="104" height="22" fill="#477397" />
      <rect x="10" y="34" width="90" height="20" fill="#d1a44d" />
      <rect x="0" y="10" width="112" height="20" fill="#537d58" />
      <rect x="12" y="14" width="3" height="12" fill="#dfe8cf" />
      <rect x="88" y="38" width="4" height="12" fill="#5a3d18" />
      <rect x="12" y="63" width="76" height="4" fill="#a8c4d8" />
    </g>
  );
}

function BasketballGlyph() {
  return (
    <g className="brain-glyph">
      <path d="M34 2H66V6H78V10H86V16H92V24H96V34H100V66H96V76H92V84H86V90H78V94H66V98H34V94H22V90H14V84H8V76H4V66H0V34H4V24H8V16H14V10H22V6H34Z" fill="#231b1c" />
      <path d="M34 8H66V12H78V16H86V24H90V34H94V66H90V76H86V84H78V90H66V94H34V90H22V84H14V76H10V66H6V34H10V24H14V16H22V12H34Z" fill="#ef6c00" />
      <path d="M47 8H53V94H47ZM6 47H94V53H6ZM24 12H31V24H35V38H39V47H32V39H28V25H24ZM69 12H76V25H72V39H68V47H61V38H65V24H69ZM32 53H39V63H35V77H31V90H24V76H28V62H32ZM61 53H68V62H72V76H76V90H69V77H65V63H61Z" fill="#231b1c" />
    </g>
  );
}

function ChipGlyph() {
  return (
    <g className="brain-glyph">
      <rect x="17" y="17" width="86" height="86" fill="#202834" stroke="#7ea0c8" strokeWidth="4" />
      <rect x="31" y="31" width="58" height="58" fill="#30455e" />
      <rect x="40" y="40" width="40" height="40" fill="#17202b" />
      <path d="M10 28H0M10 48H0M10 68H0M10 88H0M120 28H110M120 48H110M120 68H110M120 88H110M28 10V0M48 10V0M68 10V0M88 10V0M28 120V110M48 120V110M68 120V110M88 120V110" stroke="#d2a94f" strokeWidth="6" />
      <rect x="47" y="49" width="26" height="22" fill="#6cf0a0" opacity=".72" />
    </g>
  );
}

function CodeGlyph() {
  return (
    <g className="brain-glyph">
      <rect x="0" y="0" width="132" height="88" fill="#161b25" stroke="#6180a6" strokeWidth="4" />
      <rect x="0" y="0" width="132" height="15" fill="#293446" />
      <rect x="8" y="6" width="4" height="4" fill="#f07178" />
      <rect x="18" y="6" width="4" height="4" fill="#e6b450" />
      <rect x="28" y="6" width="4" height="4" fill="#66c48d" />
      <path d="M16 33H55M16 47H42M50 47H86M16 61H66M72 61H112M16 75H48" stroke="#7fb1e2" strokeWidth="5" />
      <rect x="16" y="31" width="17" height="5" fill="#d97c91" />
    </g>
  );
}

function NodesGlyph() {
  return (
    <g className="brain-glyph">
      <path d="M18 74L52 25L91 49L120 13M52 25L69 94L112 83M91 49L112 83" fill="none" stroke="#8d78d5" strokeWidth="4" />
      {[[18,74],[52,25],[91,49],[120,13],[69,94],[112,83]].map(([x,y], i) => (
        <g key={i}><rect x={x-8} y={y-8} width="16" height="16" fill="#171421" stroke="#d0bbff" strokeWidth="3" /><rect x={x-3} y={y-3} width="6" height="6" fill="#8d78d5" /></g>
      ))}
    </g>
  );
}

function BrainDetailGlyph({ type }) {
  const glyph =
    type === "piano" ? <PianoGlyph /> :
    type === "books" ? <BooksGlyph /> :
    type === "basketball" ? <BasketballGlyph /> :
    type === "current" ? <ChipGlyph /> :
    type === "past" ? <CodeGlyph /> :
    type === "interests" ? <NodesGlyph /> :
    null;
  return <svg className="brain-detail-glyph" viewBox="0 0 140 120" aria-hidden="true">{glyph}</svg>;
}

function BrainScene({ embedded = false, onReturn }) {
  const [active, setActive] = useBrainState(null);
  const [lastActive, setLastActive] = useBrainState(null);
  const detail = lastActive ? BRAIN_DETAILS[lastActive] : null;
  const activate = (key) => {
    setLastActive(key);
    setActive(key);
  };

  return (
    <main className="brain-scene">
      {embedded ? (
        <button className="brain-back" type="button" onClick={onReturn} aria-label="Return to the room">← room</button>
      ) : (
        <a className="brain-back" href="./" aria-label="Return to the room">← room</a>
      )}
      <div className="brain-scene-label">inside / static study</div>

      <div className={`brain-frame${active ? ` is-${active}` : ""}`}>
        <svg className="brain-art" viewBox="0 0 1600 900" role="img" aria-label="Pixel art view from inside Saaket's head, looking through his eyes toward a computer monitor">
        <defs>
          <radialGradient id="brainCavity" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#25141d" />
            <stop offset="58%" stopColor="#100a10" />
            <stop offset="100%" stopColor="#050407" />
          </radialGradient>
          <linearGradient id="screenLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9f3ef" />
            <stop offset="100%" stopColor="#789da0" />
          </linearGradient>
          <clipPath id="eyeWindows">
            <polygon points="420,155 505,105 724,121 780,176 738,294 512,302 438,252" />
            <polygon points="820,176 876,121 1095,105 1180,155 1162,252 1088,302 862,294" />
          </clipPath>
          <clipPath id="leftEyeWindow">
            <polygon points="420,155 505,105 724,121 780,176 738,294 512,302 438,252" />
          </clipPath>
          <clipPath id="rightEyeWindow">
            <polygon points="820,176 876,121 1095,105 1180,155 1162,252 1088,302 862,294" />
          </clipPath>
          <clipPath id="brainShape" clipPathUnits="userSpaceOnUse">
            <path d={BRAIN_SILHOUETTE} />
          </clipPath>
          <path id="hobbiesArc" d="M620 448C660 397 706 364 790 355" />
          <path id="interestsArc" d="M810 355C894 364 940 397 980 448" />
          <pattern id="brainDither" width="14" height="14" patternUnits="userSpaceOnUse">
            <rect width="2" height="2" x="2" y="2" fill="#ffffff" opacity=".035" />
            <rect width="2" height="2" x="10" y="9" fill="#ffffff" opacity=".025" />
          </pattern>
        </defs>

        <rect width="1600" height="900" fill="url(#brainCavity)" />
        <rect width="1600" height="900" fill="url(#brainDither)" />

        <g clipPath="url(#eyeWindows)">
          <rect x="330" y="50" width="940" height="370" fill="#090b0e" />
          <rect x="390" y="75" width="820" height="330" fill="#202b31" />
          <rect x="408" y="93" width="784" height="294" fill="url(#screenLight)" />
          <rect x="408" y="93" width="784" height="10" fill="#f0fff8" opacity=".85" />
          <path d="M400 110L1180 340M360 180L1050 390" stroke="#fff" strokeWidth="8" opacity=".05" />
        </g>

        <g className="brain-screen-copy brain-screen-copy--intro" clipPath="url(#leftEyeWindow)">
          <text x="480" y="195" className="primary">Hi, I am Saaket</text>
          <text x="510" y="258" className="secondary">Minors: Computer Engineering,</text>
        </g>
        <g className="brain-screen-copy brain-screen-copy--education" clipPath="url(#rightEyeWindow)">
          <text x="880" y="195" className="primary">CS @ NJIT ADHC</text>
          <text x="880" y="258" className="secondary">Computational Mathematics</text>
        </g>

        <polygon points="420,155 505,105 724,121 780,176 738,294 512,302 438,252" fill="none" stroke="#4a2834" strokeWidth="18" />
        <polygon points="820,176 876,121 1095,105 1180,155 1162,252 1088,302 862,294" fill="none" stroke="#4a2834" strokeWidth="18" />

        <g className="brain-arc-labels" aria-hidden="true">
          <text className="brain-arc-label brain-arc-label--hobbies">
            <textPath href="#hobbiesArc" startOffset="50%" textAnchor="middle">hobbies</textPath>
          </text>
          <text className="brain-arc-label brain-arc-label--interests">
            <textPath href="#interestsArc" startOffset="50%" textAnchor="middle">interests</textPath>
          </text>
        </g>

        <g className="brain-map" transform="translate(0 36)">
        <g className="brain-figure" transform="translate(336 12) scale(.58 .92)">
          {/* One complete top-view silhouette, based on the compact pixel reference. */}
          <g clipPath="url(#brainShape)">
          <path
            d={BRAIN_SILHOUETTE}
            fill="#ee718b"
          />
          <path
            d="M432 632V590L440 544L458 500L484 460L518 428L560 402L612 382L670 368H734V358H790V848L754 866H716V860H650V844H592V820H544V790H504V758H472V718H450V674H436Z"
            fill="#d95777"
            opacity=".72"
          />

          {/* Narrow natural groove instead of the previous floating center shape. */}
          <path d="M800 358V456L788 514L800 572L788 632L800 692L790 762L800 848" fill="none" stroke="#642d4a" strokeWidth="13" />

          {/* Blocky gyri: irregular and asymmetric so the form reads as a brain. */}
          <path d="M488 500H570V466H652V492H728V530H760M454 582H532V544H616V578H698V616H758M468 666H552V628H642V662H724V704H760M486 758H566V722H648V760H724V798H760M544 820H618V790H688V820H750" fill="none" stroke="#ff9bac" strokeWidth="17" />
          <path d="M1112 500H1030V466H948V492H872V530H840M1146 582H1068V544H984V578H902V616H842M1132 666H1048V628H958V662H876V704H840M1114 758H1034V722H952V760H876V798H840M1056 820H982V790H912V820H850" fill="none" stroke="#ff9bac" strokeWidth="17" />
          <path d="M548 446V500M652 406V492M516 544V628M616 492V578M698 530V616M572 628V710M724 616V704M534 722V790M648 760V826" fill="none" stroke="#a63f62" strokeWidth="13" />
          <path d="M1052 446V500M948 406V492M1084 544V628M984 492V578M902 530V616M1028 628V710M876 616V704M1066 722V790M952 760V826" fill="none" stroke="#a63f62" strokeWidth="13" />
          <rect x="528" y="474" width="18" height="18" fill="#ffb0ba" />
          <rect x="674" y="430" width="16" height="16" fill="#ffb0ba" />
          <rect x="458" y="612" width="18" height="18" fill="#b83e62" />
          <rect x="1060" y="486" width="18" height="18" fill="#ffb0ba" />
          <rect x="924" y="438" width="16" height="16" fill="#ffb0ba" />
          <rect x="1122" y="612" width="18" height="18" fill="#b83e62" />
          </g>
          <path
            d={BRAIN_SILHOUETTE}
            fill="none"
            stroke="#533451"
            strokeWidth="5"
            strokeOpacity="1"
            strokeLinejoin="miter"
            shapeRendering="crispEdges"
            vectorEffect="non-scaling-stroke"
          />
        </g>

        <g className="brain-circuits" pointerEvents="none">
          <path d="M654 482H558V448H438L392 408H302" />
          <path d="M690 590H560V602H424V602H296" />
          <path d="M654 698H562V714H438L390 758H306" />
          <path d="M946 482H1042V448H1162L1208 408H1298" />
          <path d="M910 590H1040V602H1176V602H1304" />
          <path d="M946 698H1038V714H1162L1210 758H1294" />
        </g>

        <g className="brain-surface-icons" pointerEvents="none">
          <g transform="translate(626 448) scale(.42)"><PianoGlyph /></g>
          <g transform="translate(666 556) scale(.42)"><BooksGlyph /></g>
          <g transform="translate(628 658) scale(.43)"><BasketballGlyph /></g>
          <g transform="translate(920 442) scale(.42)"><ChipGlyph /></g>
          <g transform="translate(878 552) scale(.42)"><CodeGlyph /></g>
          <g transform="translate(916 654) scale(.42)"><NodesGlyph /></g>
        </g>
        </g>
        </svg>

        <button className={`brain-hotspot brain-hotspot--piano${active === "piano" ? " active" : ""}`} onPointerEnter={() => activate("piano")} onPointerLeave={() => setActive(null)} onFocus={() => activate("piano")} onBlur={() => setActive(null)} onClick={() => activate("piano")} aria-label="Learning piano"><span>learning piano</span></button>
        <button className={`brain-hotspot brain-hotspot--books${active === "books" ? " active" : ""}`} onPointerEnter={() => activate("books")} onPointerLeave={() => setActive(null)} onFocus={() => activate("books")} onBlur={() => setActive(null)} onClick={() => activate("books")} aria-label="Reading books"><span>reading books</span></button>
        <button className={`brain-hotspot brain-hotspot--basketball${active === "basketball" ? " active" : ""}`} onPointerEnter={() => activate("basketball")} onPointerLeave={() => setActive(null)} onFocus={() => activate("basketball")} onBlur={() => setActive(null)} onClick={() => activate("basketball")} aria-label="Casual basketball"><span>casual basketball</span></button>
        <button className={`brain-hotspot brain-hotspot--current${active === "current" ? " active" : ""}`} onPointerEnter={() => activate("current")} onPointerLeave={() => setActive(null)} onFocus={() => activate("current")} onBlur={() => setActive(null)} onClick={() => activate("current")} aria-label="Current ANNS research"><span>ANNS research</span></button>
        <button className={`brain-hotspot brain-hotspot--past${active === "past" ? " active" : ""}`} onPointerEnter={() => activate("past")} onPointerLeave={() => setActive(null)} onFocus={() => activate("past")} onBlur={() => setActive(null)} onClick={() => activate("past")} aria-label="Past work at Cardaverse"><span>Cardaverse internship</span></button>
        <button className={`brain-hotspot brain-hotspot--interests${active === "interests" ? " active" : ""}`} onPointerEnter={() => activate("interests")} onPointerLeave={() => setActive(null)} onFocus={() => activate("interests")} onBlur={() => setActive(null)} onClick={() => activate("interests")} aria-label="Technical interests"><span>technical interests</span></button>

        {detail && (
          <aside className={`brain-detail brain-detail--${lastActive}${active ? " visible" : ""}`} aria-live="polite" aria-hidden={!active}>
            <>
              <BrainDetailGlyph type={lastActive} />
              <div className="brain-detail-copy">
                <p>{detail.eyebrow}</p>
                <h2>{detail.title}</h2>
                {detail.body && <div>{detail.body}</div>}
              </div>
            </>
          </aside>
        )}
      </div>
    </main>
  );
}
